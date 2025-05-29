import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { appRouter as applicationRouter } from "./routers/app";
import { demoRouter } from "./routers/demo";
import { llmRouter } from "./routers/llm";
import { projectRouter } from "./routers/project";
import { threadRouter } from "./routers/thread";
import { toolsRouter } from "./routers/tools";
import { userRouter } from "./routers/user";
import { validateRouter } from "./routers/validate";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  project: projectRouter,
  thread: threadRouter,
  app: applicationRouter,
  tools: toolsRouter,
  demo: demoRouter,
  llm: llmRouter,
  validate: validateRouter,
});

// export type definition of API for the client
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
