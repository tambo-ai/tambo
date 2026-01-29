import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { lazy, Suspense, useMemo } from "react";
import { requireUser } from "~/lib/session.server";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import type { Database } from "~/lib/database.types";
import { createClient } from "@supabase/supabase-js";
import { createBookmarkTools } from "~/tambo/tools";

// Lazy load the Tambo chat (client-only)
const TamboChat = lazy(() =>
  import("~/components/tambo-chat.client").then((mod) => ({
    default: mod.TamboChat,
  })),
);

export const meta: MetaFunction = () => {
  return [{ title: "Chat | AI Bookmark Manager" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { user, accessToken } = await requireUser(request);
  const supabase = createSupabaseServerClient(accessToken);

  // Fetch bookmarks count for context
  const { count } = await supabase
    .from("bookmarks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return json({
    user,
    accessToken,
    bookmarkCount: count ?? 0,
  });
}

export default function ChatPage() {
  const { user, accessToken, bookmarkCount } = useLoaderData<typeof loader>();

  // Create Supabase client for Tambo tools (client-side)
  const supabaseClient = useMemo(() => {
    if (typeof window === "undefined") return null;
    const url = window.ENV?.SUPABASE_URL;
    const key = window.ENV?.SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient<Database>(url, key, {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    });
  }, [accessToken]);

  // Create tools
  const tamboTools = useMemo(() => {
    if (!supabaseClient) return [];
    return createBookmarkTools(supabaseClient, user.id, () => {
      // Tools handle mutations directly
    });
  }, [supabaseClient, user.id]);

  const tamboApiKey =
    typeof window !== "undefined" ? window.ENV?.TAMBO_API_KEY : "";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900">
              Bookmark Manager
            </h1>
            <p className="text-xs text-slate-500">
              {bookmarkCount} bookmarks saved
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:inline">
            {user.email}
          </span>
          <Form method="post" action="/logout">
            <button
              type="submit"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              title="Sign out"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </Form>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <div className="text-slate-500">Loading chat...</div>
            </div>
          }
        >
          {tamboApiKey && tamboTools.length > 0 && (
            <TamboChat apiKey={tamboApiKey} tools={tamboTools} />
          )}
        </Suspense>
      </div>
    </div>
  );
}
