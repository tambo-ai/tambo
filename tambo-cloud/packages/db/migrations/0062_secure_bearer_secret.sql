-- Add per-project bearer token secret with strong default
ALTER TABLE "projects"
  ADD COLUMN "bearer_token_secret" text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex');
