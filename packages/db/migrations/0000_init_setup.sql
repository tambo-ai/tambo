CREATE EXTENSION if not exists pgcrypto;

DO $$ 
BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE "authenticated";
    -- Grant all privileges on the public schema to the authenticated role, since RLS will be used for
    -- more fine-grained control.
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON TYPES TO authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated;
END IF;
END $$;

-- Generate a custom ID with a prefix and a random part, for use as a unique identifier
CREATE OR REPLACE FUNCTION generate_custom_id(
    prefix TEXT,
    random_length INT DEFAULT 8
) RETURNS TEXT AS $$
DECLARE
    random_part TEXT;
    signature TEXT;
    -- This is just a dummy secret key for now. When we eventually parameterize this in
    -- the environment, we'll need to call SET_CONFIG() before and after each transaction
    -- see the createDrizzle example for RLS in https://orm.drizzle.team/docs/rls for a
    -- rough idea of how to do this.
    secret_key TEXT := COALESCE(current_setting('custom.custom_id_secret_key', true), 
                                'dummy-secret-key-FxEMIkJKnody');
BEGIN
    IF random_length <= 0 THEN
        RAISE EXCEPTION 'random_length must be greater than 0';
    END IF;

    -- Generate a random byte string and encode it as Base64
    random_part := encode(gen_random_bytes((random_length * 3 + 3) / 4), 'base64');
    random_part := regexp_replace(random_part, '[^a-zA-Z0-9]', '', 'g'); -- Remove non-alphanumeric characters
    random_part := substring(random_part FROM 1 FOR random_length);

    -- Compute the signature using HMAC with SHA-256
    signature := encode(hmac(random_part, secret_key, 'sha256'), 'hex');
    signature := substring(signature FROM 1 FOR 6); -- Shorten for brevity

    -- Combine prefix, random part, and signature
    RETURN prefix || random_part || '.' || signature;
END;
$$ LANGUAGE plpgsql;

-- Create auth schema if it doesn't exist (for NextAuth adapter compatibility)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
        CREATE SCHEMA "auth";
        -- Grant all privileges on the auth schema to the authenticated role
        GRANT ALL PRIVILEGES ON SCHEMA "auth" TO "authenticated";
    END IF;
END $$;

-- Create extensions schema if it doesn't exist (for Supabase compatibility)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'extensions') THEN
        CREATE SCHEMA "extensions";
    END IF;
END $$;

-- Create auth tables if they don't exist (for NextAuth adapter compatibility)
DO $$ 
BEGIN
    -- Create users table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        CREATE TABLE "auth"."users" (
            "id" uuid PRIMARY KEY NOT NULL,
            "email" text,
            "email_confirmed_at" timestamp with time zone,
            "created_at" timestamp with time zone DEFAULT now(),
            "updated_at" timestamp with time zone DEFAULT now(),
            "raw_user_meta_data" jsonb DEFAULT '{}'::jsonb
        );
        
        -- Create index on email for fast lookups
        CREATE INDEX "auth_email_idx" ON "auth"."users" USING btree ("email");
    END IF;
    
    -- Create identities table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'identities') THEN
        CREATE TABLE "auth"."identities" (
            "id" uuid PRIMARY KEY NOT NULL,
            "user_id" uuid NOT NULL,
            "provider" text NOT NULL,
            "provider_id" text NOT NULL,
            "identity_data" jsonb DEFAULT '{}'::jsonb,
            "created_at" timestamp with time zone DEFAULT now() NOT NULL,
            "updated_at" timestamp with time zone DEFAULT now() NOT NULL
        );
        
        -- Add foreign key constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'identities_user_id_users_id_fk' 
            AND table_schema = 'auth' 
            AND table_name = 'identities'
        ) THEN
            ALTER TABLE "auth"."identities" ADD CONSTRAINT "identities_user_id_users_id_fk" 
            FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
        END IF;
        
        -- Create indexes for identities table
        CREATE INDEX "identity_provider_provider_id_idx" ON "auth"."identities" USING btree ("provider","provider_id");
        CREATE INDEX "identity_user_id_idx" ON "auth"."identities" USING btree ("user_id");
    END IF;
    
    -- Create sessions table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'sessions') THEN
        CREATE TABLE "auth"."sessions" (
            "id" text PRIMARY KEY NOT NULL,
            "user_id" uuid NOT NULL,
            "created_at" timestamp with time zone DEFAULT now() NOT NULL,
            "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
            "not_after" timestamp with time zone
        );
        
        -- Add foreign key constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'sessions_user_id_users_id_fk' 
            AND table_schema = 'auth' 
            AND table_name = 'sessions'
        ) THEN
            ALTER TABLE "auth"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" 
            FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
        END IF;
        
        -- Create indexes for sessions table
        CREATE INDEX "session_user_id_idx" ON "auth"."sessions" USING btree ("user_id");
        CREATE INDEX "session_not_after_idx" ON "auth"."sessions" USING btree ("not_after");
    END IF;
END $$;

-- Supabase compatibility functions
-- Only create these if we're NOT running on Supabase (detected by supabase_admin role)
-- Supabase already provides auth.email(), auth.jwt(), auth.role(), and auth.uid() natively
DO $$
BEGIN
    -- Check if supabase_admin role exists (indicates Supabase environment)
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin') THEN
        -- Create auth.email() function
        CREATE OR REPLACE FUNCTION auth.email()
         RETURNS text
         LANGUAGE sql
         STABLE
        AS $func$
          select
          coalesce(
            nullif(current_setting('request.jwt.claim.email', true), ''),
            (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
          )::text
        $func$;

        -- Create auth.jwt() function
        CREATE OR REPLACE FUNCTION auth.jwt()
         RETURNS jsonb
         LANGUAGE sql
         STABLE
        AS $func$
          select
            coalesce(
                nullif(current_setting('request.jwt.claim', true), ''),
                nullif(current_setting('request.jwt.claims', true), '')
            )::jsonb
        $func$;

        -- Create auth.role() function
        CREATE OR REPLACE FUNCTION auth.role()
         RETURNS text
         LANGUAGE sql
         STABLE
        AS $func$
          select
          coalesce(
            nullif(current_setting('request.jwt.claim.role', true), ''),
            (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
          )::text
        $func$;

        -- Create auth.uid() function
        CREATE OR REPLACE FUNCTION auth.uid()
         RETURNS uuid
         LANGUAGE sql
         STABLE
        AS $func$
          select
          coalesce(
            nullif(current_setting('request.jwt.claim.sub', true), ''),
            (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
          )::uuid
        $func$;
    END IF;
END $$;