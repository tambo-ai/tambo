-- 1. Change the project_api_key role to NOINHERIT
ALTER ROLE project_api_key NOINHERIT;

-- 2. Grant membership to the role that will assume project_api_key (e.g. postgres)
GRANT project_api_key TO postgres;

-- 3. Optionally, set default session settings for the role (e.g., search_path)
ALTER ROLE project_api_key SET search_path = public;

-- 4. Grant USAGE on the schema so the role can access objects in it
GRANT USAGE ON SCHEMA public TO project_api_key;

-- 5. Grant privileges on all existing tables in the public schema
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO project_api_key;

-- 6. Set default privileges so that future tables created by postgres in public will automatically grant access
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO project_api_key;
