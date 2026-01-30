-- Disable FK checks temporarily
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- 1. Create new table with titleKey NULLABLE
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "titleKey" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Copy data and backfill titleKey
INSERT INTO "new_Task" ("id", "title", "titleKey", "completed", "createdAt")
SELECT
  "id",
  "title",
  lower(trim("title")) AS "titleKey",
  "completed",
  "createdAt"
FROM "Task";

-- 3. Replace old table
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";

-- 4. Enforce uniqueness
CREATE UNIQUE INDEX "Task_titleKey_key" ON "Task"("titleKey");

-- Re-enable FK checks
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;