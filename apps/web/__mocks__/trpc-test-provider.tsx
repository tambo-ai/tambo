import { api } from "@/trpc/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import type { PropsWithChildren } from "react";

/**
 * Run the real tRPC hooks and query cache against a deterministic transport.
 * @returns A provider and client scoped to one test.
 */
export function createTRPCTestProvider(
  request: (path: string, input: unknown) => Promise<unknown>,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const client = api.createClient({
    links: [
      () =>
        ({ op }) =>
          observable((observer) => {
            let active = true;
            async function respond() {
              try {
                const data = await request(op.path, op.input);
                if (active) {
                  observer.next({ result: { data } });
                  observer.complete();
                }
              } catch (error) {
                if (active) {
                  observer.error(
                    TRPCClientError.from(
                      error instanceof Error ? error : new Error(String(error)),
                    ),
                  );
                }
              }
            }
            void respond();
            return () => {
              active = false;
            };
          }),
    ],
  });
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <api.Provider client={client} queryClient={queryClient}>
          {children}
        </api.Provider>
      </QueryClientProvider>
    );
  }
  return { Wrapper, queryClient };
}
