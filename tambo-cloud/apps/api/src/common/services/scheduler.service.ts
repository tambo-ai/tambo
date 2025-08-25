import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import { getDb, HydraDatabase, operations, schema } from "@tambo-ai-cloud/db";
import { eq } from "drizzle-orm";
import { EmailService } from "./email.service";

@Injectable()
export class SchedulerService {
  private readonly db: HydraDatabase;

  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    // Create a direct database connection for scheduled jobs
    this.db = getDb(this.configService.get<string>("DATABASE_URL")!);
  }

  // Run every day at 10 AM UTC
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async sendReactivationEmails() {
    console.log("Starting reactivation email job...");

    try {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

      // Find users who:
      // 1. Signed up more than 2 weeks ago
      // 2. Haven't been active in the last 2 weeks OR haven't set up a project
      // 3. Haven't received a reactivation email in the last month
      const inactiveUsers = await operations.getInactiveUsersWithProjects(
        this.db,
        14,
      );

      for (const user of inactiveUsers) {
        try {
          // Check lifecycle tracking
          let lifecycleTracking = await this.db.query.tamboUsers.findFirst({
            where: eq(schema.tamboUsers.userId, user.id),
          });

          if (!lifecycleTracking) {
            // Create tracking record
            [lifecycleTracking] = await this.db
              .insert(schema.tamboUsers)
              .values({
                userId: user.id,
                hasSetupProject: user.projects.length > 0,
                lastActivityAt: user.createdAt || new Date(),
              })
              .returning();
          }

          // Skip if email was sent recently
          if (
            lifecycleTracking.reactivationEmailSentAt &&
            lifecycleTracking.reactivationEmailSentAt > oneMonthAgo
          ) {
            continue;
          }

          // Check if user is inactive
          const isInactive =
            lifecycleTracking.lastActivityAt < twoWeeksAgo ||
            !lifecycleTracking.hasSetupProject;

          if (!isInactive) {
            continue;
          }

          // Calculate days since signup
          const daysSinceSignup = Math.floor(
            (Date.now() - (user.createdAt?.getTime() || Date.now())) /
              (1000 * 60 * 60 * 24),
          );

          // Send reactivation email
          const result = await this.emailService.sendReactivationEmail(
            user.email ?? "",
            daysSinceSignup,
            lifecycleTracking.hasSetupProject,
          );

          if (result.success) {
            // Update tracking
            await this.db
              .update(schema.tamboUsers)
              .set({
                reactivationEmailSentAt: new Date(),
                reactivationEmailCount:
                  lifecycleTracking.reactivationEmailCount + 1,
              })
              .where(eq(schema.tamboUsers.id, lifecycleTracking.id));

            console.log(`Sent reactivation email to ${user.email}`);
          }
        } catch (error) {
          console.error(`Error processing user ${user.email}:`, error);
          // Continue with next user
        }
      }

      console.log("Reactivation email job completed");
    } catch (error) {
      console.error("Error in reactivation email job:", error);
    }
  }

  // Update user activity when they perform actions
  async updateUserActivity(userId: string, projectId?: string) {
    try {
      const tracking = await this.db.query.tamboUsers.findFirst({
        where: eq(schema.tamboUsers.userId, userId),
      });

      if (tracking) {
        await this.db
          .update(schema.tamboUsers)
          .set({
            lastActivityAt: new Date(),
            hasSetupProject: tracking.hasSetupProject || !!projectId,
          })
          .where(eq(schema.tamboUsers.id, tracking.id));
      } else {
        await this.db.insert(schema.tamboUsers).values({
          userId,
          hasSetupProject: !!projectId,
          lastActivityAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Error updating user activity:", error);
    }
  }
}
