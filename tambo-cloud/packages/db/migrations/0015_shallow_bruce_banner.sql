-- make sure role has access to extensions schema, where we use some functions like gen_random_bytes
GRANT USAGE ON SCHEMA extensions TO project_api_key;
-- Grant EXECUTE on all existing functions in the public and extensions schemas
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT n.nspname AS routine_schema,
               p.proname AS routine_name,
               pg_get_function_identity_arguments(p.oid) AS args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname IN ('public', 'extensions')
    LOOP
        EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO project_api_key', r.routine_schema, r.routine_name, r.args);
    END LOOP;
END$$;

-- Set default privileges for future functions in the public and extensions schemas
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO project_api_key;
ALTER DEFAULT PRIVILEGES IN SCHEMA extensions GRANT EXECUTE ON FUNCTIONS TO project_api_key;
