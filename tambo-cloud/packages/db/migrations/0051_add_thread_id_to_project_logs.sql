-- 0051_add_thread_id_to_project_logs.sql
ALTER TABLE "project_logs" ADD COLUMN "thread_id" text;
ALTER TABLE "project_logs"
  ADD CONSTRAINT "project_logs_thread_id_threads_id_fk"
  FOREIGN KEY ("thread_id") REFERENCES "threads"("id");
