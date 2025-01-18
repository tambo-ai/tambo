/**
 * This script migrates a firebase backup to the db.
 *
 * It is designed to be run in a transaction so that it can be rolled back if
 * there are any errors.
 *
 * It is designed to be run in a dry run mode where it will not actually commit
 * the transaction.
 *
 * You can generate a firestore backup with
 *
 * npx -p node-firestore-import-export firestore-export -a credentials.json -b backup.json
 *
 * You can then run this script with
 *
 * DATABASE_URL=... tsx src/migrate.ts backup.json
 *
 * add DRY_RUN=1 to the environment to not actually commit the transaction
 */
import { and, eq, ExtractTablesWithRelations, inArray } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";
import { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import fs from "fs";
import { closeDb, getDb, schema } from "./index";
type FirebaseTimestamp = {
  __datatype__: "timestamp";
  value: {
    _seconds: number;
    _nanoseconds: number;
  };
};

interface FirebaseProject {
  id: string;
  name: string;
  userId: string;
  apiKeys: {
    id: string;
    name: string;
    hashedKey: string;
    partiallyHiddenKey: string;
    lastUsed: FirebaseTimestamp | null;
    created: FirebaseTimestamp;
  }[];

  providerKeys: {
    id: string;
    providerName: string;
    providerKeyEncrypted: string;
    partiallyHiddenKey: string;
  }[];
}

interface FirebaseUser {
  // the actual UUID of the user in the db
  authId: string;
  email: string;
}
interface FirebaseBackup {
  __collections__: {
    projects: {
      [key: string]: FirebaseProject;
    };
    users: {
      [userId: string]: FirebaseUser;
    };
  };
}

function dateFromTimestamp(timestamp: FirebaseTimestamp | null) {
  if (!timestamp) {
    return new Date();
  }
  return new Date(
    timestamp.value._seconds * 1000 + timestamp.value._nanoseconds / 1000000,
  );
}

function loadBackup(path: string) {
  const backup = fs.readFileSync(path, "utf-8");
  return JSON.parse(backup) as FirebaseBackup;
}

async function run() {
  const path = process.argv[2];
  const backup = loadBackup(path);

  const users = backup.__collections__.users;
  const projects = Object.values(backup.__collections__.projects);

  console.log("getting db from ", process.env.DATABASE_URL);
  const db = getDb(process.env.DATABASE_URL!);

  try {
    let projectCount = 0;
    await db.transaction(async (tx) => {
      for (const project of projects) {
        const userId = project.userId;
        const projectOwner = users[userId];
        if (!projectOwner) {
          console.log("cannot find project owner ", userId);
          continue;
        }

        // verifying we have a user
        const user = await findUser(tx, projectOwner);
        if (!user) {
          console.log(
            "  cannot find user ",
            projectOwner.email,
            projectOwner.authId,
          );
          continue;
        }

        // check if the user already has a matching project
        const [existingProject] = await tx
          .select()
          .from(schema.projects)
          .where(
            and(
              eq(schema.projects.name, project.name),
              inArray(
                schema.projects.id,
                db
                  .select({ id: schema.projectMembers.projectId })
                  .from(schema.projectMembers)
                  .where(eq(schema.projectMembers.userId, user.id)),
              ),
            ),
          );
        if (existingProject) {
          console.log("project already exists ", existingProject.id);
          continue;
        }
        console.log(
          "inserting project ",
          project.name,
          "belonging to ",
          projectOwner.email,
        );

        projectCount++;

        // insert the project
        const [newProject] = await tx
          .insert(schema.projects)
          .values({
            name: project.name,
          })
          .returning();
        await tx.insert(schema.projectMembers).values({
          projectId: newProject.id,
          userId: user.id,
          role: "admin",
        });

        for (const apiKey of project.apiKeys) {
          await tx.insert(schema.apiKeys).values({
            hashedKey: apiKey.hashedKey,
            createdByUserId: user.id,
            name: apiKey.name,
            partiallyHiddenKey: apiKey.partiallyHiddenKey,
            projectId: newProject.id,
            lastUsedAt: dateFromTimestamp(apiKey.lastUsed),
            createdAt: dateFromTimestamp(apiKey.created),
          });
        }

        for (const providerKey of project.providerKeys ?? []) {
          await tx.insert(schema.providerKeys).values({
            partiallyHiddenKey: providerKey.partiallyHiddenKey,
            projectId: newProject.id,
            providerKeyEncrypted: providerKey.providerKeyEncrypted,
            providerName: providerKey.providerName,
          });
        }
      }
      console.log("inserted ", projectCount, "projects");
      // do not actually commit the transaction if DRY_RUN is set

      // eslint-disable-next-line turbo/no-undeclared-env-vars
      if (process.env.DRY_RUN) {
        tx.rollback();
      }
    });
    console.log("migration transaction complete");
  } catch (e: any) {
    if (e.message === "Rollback") {
      console.log("rollback detected");
    } else {
      console.error("error: ", e);
    }
  } finally {
    await closeDb();
  }

  console.log("migration complete");
}

await run();

async function findUser(
  tx: PgTransaction<
    PostgresJsQueryResultHKT,
    typeof schema,
    ExtractTablesWithRelations<typeof schema>
  >,
  projectOwner: FirebaseUser,
) {
  const [user] = await tx
    .select()
    .from(schema.authUsers)
    .where(eq(schema.authUsers.id, projectOwner.authId));
  if (!user) {
    // look up by email
    const [userByEmail] = await tx
      .select()
      .from(schema.authUsers)
      .where(eq(schema.authUsers.email, projectOwner.email));
    if (userByEmail) {
      return userByEmail;
    }
  }
  return user;
}
