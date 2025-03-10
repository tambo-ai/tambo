import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { schema } from "@tambo-ai-cloud/db";
export const userRouter = createTRPCRouter({
  getUser: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.session.user;
    return user;
  }),
  getUserProjects: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const db = ctx.db;
    const projects = await db.query.projects.findMany({
      where: (projects, { eq, inArray }) =>
        inArray(
          projects.id,
          db
            .select({ id: schema.projectMembers.projectId })
            .from(schema.projectMembers)
            .where(eq(schema.projectMembers.userId, userId)),
        ),
    });
    return projects;
  }),
});
