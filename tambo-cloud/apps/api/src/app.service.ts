import { Inject, Injectable } from "@nestjs/common";
import type { HydraDatabase } from "@tambo-ai-cloud/db";
import { sql } from "drizzle-orm";
import { DATABASE } from "./common/middleware/db-transaction-middleware";

@Injectable()
export class AppService {
  constructor(
    @Inject(DATABASE)
    private readonly db: HydraDatabase,
  ) {}

  getHello(): string {
    return "Welcome to the Tambo AI API!";
  }

  async checkHealth(): Promise<{ status: string }> {
    try {
      // Execute a simple SQL query to check database connectivity
      await this.db.execute(sql`SELECT 1`);
      return { status: "healthy" };
    } catch (_error) {
      return { status: "unhealthy" };
    }
  }
}
