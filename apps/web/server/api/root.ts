import "server-only";

import {
  createCallerFactory,
  createTRPCContext,
  createTRPCRouter,
} from "@/server/api/trpc";
import { createQueryClient } from "@/trpc/query-client";
import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { cache } from "react";
import { appRouter as applicationRouter } from "./routers/app";
import { demoRouter } from "./routers/demo";
import { deviceAuthRouter } from "./routers/device-auth";
import { llmRouter } from "./routers/llm";
import { projectRouter } from "./routers/project";
import { threadRouter } from "./routers/thread";
import { toolsRouter } from "./routers/tools";
import { userRouter } from "./routers/user";
import { validateRouter } from "./routers/validate";

// Need to re-export this so that the trpc export can be resolved correctly.
export { type DecorateRouterRecord } from "@trpc/react-query/shared";

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
  deviceAuth: deviceAuthRouter,
});

// export type definition of API for the client
export type AppRouter = typeof appRouter;

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(createQueryClient);
/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
const createCaller = createCallerFactory(appRouter);
const caller = createCaller(createTRPCContext);

export const { HydrateClient, trpc } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient,
);
