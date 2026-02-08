import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { lazy, Suspense, useMemo, useEffect } from "react";
import { MessageSquare, LogOut, AlertTriangle } from "lucide-react";
import { requireUser } from "~/lib/session.server";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { getSupabaseClient } from "~/lib/supabase.client.singleton";
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

  const supabaseClient = useMemo(() => {
    if (typeof window === "undefined") return null;
    const url = window.ENV?.SUPABASE_URL;
    const key = window.ENV?.SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return getSupabaseClient(url, key);
  }, []);

  useEffect(() => {
    if (supabaseClient && accessToken) {
      supabaseClient.auth.setSession({
        access_token: accessToken,
        refresh_token: "",
      });
    }
  }, [supabaseClient, accessToken]);

  const tamboTools = useMemo(() => {
    if (!supabaseClient) return [];
    return createBookmarkTools(supabaseClient, user.id, () => {});
  }, [supabaseClient, user.id]);

  const tamboApiKey =
    typeof window !== "undefined" ? window.ENV?.TAMBO_API_KEY : "";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
            <MessageSquare className="h-4 w-4" />
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
              <LogOut className="h-5 w-5" />
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
          {!tamboApiKey ? (
            <div className="flex h-full items-center justify-center p-8">
              <div className="max-w-md text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 mb-2">
                  Tambo API Key Missing
                </h2>
                <p className="text-sm text-slate-600 mb-4">
                  The Tambo API key is not configured. Please add your{" "}
                  <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono">
                    TAMBO_API_KEY
                  </code>{" "}
                  to your{" "}
                  <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono">
                    .env
                  </code>{" "}
                  file.
                </p>
                <div className="rounded-lg bg-slate-50 p-4 text-left">
                  <p className="text-xs font-semibold text-slate-700 mb-2">
                    Quick Fix:
                  </p>
                  <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
                    <li>
                      Get your API key from{" "}
                      <a
                        href="https://tambo.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        tambo.ai
                      </a>
                    </li>
                    <li>
                      Add{" "}
                      <code className="px-1 py-0.5 bg-white rounded font-mono">
                        TAMBO_API_KEY=your_key
                      </code>{" "}
                      to .env
                    </li>
                    <li>Restart the dev server</li>
                  </ol>
                </div>
              </div>
            </div>
          ) : !supabaseClient || tamboTools.length === 0 ? (
            <div className="flex h-full items-center justify-center p-8">
              <div className="max-w-md text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 mb-2">
                  Supabase Configuration Missing
                </h2>
                <p className="text-sm text-slate-600 mb-4">
                  Supabase environment variables are not configured. Please
                  check your{" "}
                  <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono">
                    .env
                  </code>{" "}
                  file.
                </p>
                <div className="rounded-lg bg-slate-50 p-4 text-left">
                  <p className="text-xs font-semibold text-slate-700 mb-2">
                    Required Variables:
                  </p>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                    <li>SUPABASE_URL</li>
                    <li>SUPABASE_ANON_KEY</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <TamboChat
              apiKey={tamboApiKey}
              userToken={accessToken}
              tools={tamboTools}
            />
          )}
        </Suspense>
      </div>
    </div>
  );
}
