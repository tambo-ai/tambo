import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation, useRevalidator } from "@remix-run/react";
import { createClient } from "@supabase/supabase-js";
import { useState, useMemo, useEffect, useRef, lazy, Suspense } from "react";
import { requireUser } from "~/lib/session.server";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import type { Bookmark, Database } from "~/lib/database.types";
import { createBookmarkTools } from "~/tambo/tools";

// Lazy load the Tambo chat component (client-only) to avoid SSR issues
const TamboChat = lazy(() => 
  import("~/components/tambo-chat.client").then((mod) => ({ default: mod.TamboChat }))
);

export const meta: MetaFunction = () => {
  return [{ title: "My Bookmarks | Bookmark Manager" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { user, accessToken } = await requireUser(request);
  const supabase = createSupabaseServerClient(accessToken);

  const { data: bookmarks, error } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching bookmarks:", error);
  }

  return json({ 
    user,
    accessToken, 
    bookmarks: (bookmarks ?? []) as Bookmark[] 
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { user, accessToken } = await requireUser(request);
  const supabase = createSupabaseServerClient(accessToken);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "add") {
    const url = formData.get("url") as string;
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;

    if (!url) {
      return json({ error: "URL is required" }, { status: 400 });
    }

    const { error } = await supabase.from("bookmarks").insert({
      user_id: user.id,
      url,
      title: title || null,
      category: category || null,
    });

    if (error) {
      return json({ error: error.message }, { status: 400 });
    }

    return json({ success: true });
  }

  if (intent === "edit") {
    const id = formData.get("id") as string;
    const url = formData.get("url") as string;
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;

    const { error } = await supabase
      .from("bookmarks")
      .update({
        url: url || undefined,
        title: title || null,
        category: category || null,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return json({ error: error.message }, { status: 400 });
    }

    return json({ success: true, edited: true });
  }

  if (intent === "delete") {
    const id = formData.get("id") as string;

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return json({ error: error.message }, { status: 400 });
    }

    return json({ success: true });
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function BookmarksPage() {
  const { user, accessToken, bookmarks } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const isAdding = navigation.state === "submitting" && 
    navigation.formData?.get("intent") === "add";

  // Use bookmarks length as form key to reset after successful add
  const formKey = bookmarks.length;

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

  // Create tools with mutation callback
  const tamboTools = useMemo(() => {
    if (!supabaseClient) return [];
    return createBookmarkTools(supabaseClient, user.id, () => {
      revalidator.revalidate();
    });
  }, [supabaseClient, user.id, revalidator]);

  const tamboApiKey = typeof window !== "undefined" ? window.ENV?.TAMBO_API_KEY : "";

  // Group bookmarks by category
  const groupedBookmarks = useMemo(() => {
    const groups: Record<string, Bookmark[]> = {};
    for (const bookmark of bookmarks) {
      const cat = bookmark.category ?? "Uncategorized";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(bookmark);
    }
    return groups;
  }, [bookmarks]);

  const categories = Object.keys(groupedBookmarks).sort((a, b) => 
    a === "Uncategorized" ? 1 : b === "Uncategorized" ? -1 : a.localeCompare(b)
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${isChatOpen ? "mr-[420px]" : ""}`}>
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Bookmarks</h1>
                <p className="text-xs text-slate-500">{bookmarks.length} saved</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-smooth hover:bg-slate-800"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-smooth ${
                  isChatOpen 
                    ? "border-slate-900 bg-slate-900 text-white" 
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                AI
              </button>
              <div className="h-6 w-px bg-slate-200" />
              <span className="text-sm text-slate-500">{user.email}</span>
              <Form method="post" action="/logout">
                <button
                  type="submit"
                  className="rounded-lg p-2 text-slate-400 transition-smooth hover:bg-slate-100 hover:text-slate-600"
                  title="Sign out"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </Form>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-8">
          {/* Add Bookmark Form - Collapsible */}
          {showAddForm && (
            <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Add New Bookmark</h2>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {actionData && "error" in actionData && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {actionData.error}
                </div>
              )}

              <Form key={formKey} method="post" className="space-y-4">
                <input type="hidden" name="intent" value="add" />
                
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="url" className="mb-1.5 block text-sm font-medium text-slate-700">
                      URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      id="url"
                      name="url"
                      required
                      placeholder="https://example.com"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm transition-smooth placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                  </div>
                  <div>
                    <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      placeholder="Optional title"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm transition-smooth placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                  </div>
                  <div>
                    <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Category
                    </label>
                    <input
                      type="text"
                      id="category"
                      name="category"
                      placeholder="e.g., Tech, News"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm transition-smooth placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white transition-smooth hover:bg-slate-800 disabled:opacity-50"
                  >
                    {isAdding ? "Saving..." : "Save Bookmark"}
                  </button>
                </div>
              </Form>
            </div>
          )}

          {/* Bookmarks Grid */}
          {bookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">No bookmarks yet</h3>
              <p className="mb-4 text-sm text-slate-500">Save your first bookmark or ask the AI to help</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Add your first bookmark
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {categories.map((category) => (
                <div key={category}>
                  <div className="mb-4 flex items-center gap-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                      {category}
                    </h2>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {groupedBookmarks[category].length}
                    </span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {groupedBookmarks[category].map((bookmark) => (
                      <BookmarkCard key={bookmark.id} bookmark={bookmark} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Chat Sidebar */}
      <div 
        className={`fixed right-0 top-0 h-full w-[420px] border-l border-slate-200 bg-white shadow-xl transition-transform duration-300 ${
          isChatOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {typeof window !== "undefined" && tamboApiKey && tamboTools.length > 0 && (
          <Suspense fallback={
            <div className="flex h-full items-center justify-center">
              <div className="flex items-center gap-2 text-slate-400">
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading AI...
              </div>
            </div>
          }>
            <TamboChat apiKey={tamboApiKey} tools={tamboTools} />
          </Suspense>
        )}
      </div>
    </div>
  );
}

function BookmarkCard({ bookmark }: { bookmark: Bookmark }) {
  const navigation = useNavigation();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(bookmark.title ?? "");
  const [editUrl, setEditUrl] = useState(bookmark.url);
  const [editCategory, setEditCategory] = useState(bookmark.category ?? "");

  const isDeleting =
    navigation.state === "submitting" &&
    navigation.formData?.get("intent") === "delete" &&
    navigation.formData?.get("id") === bookmark.id;

  const isUpdating =
    navigation.state === "submitting" &&
    navigation.formData?.get("intent") === "edit" &&
    navigation.formData?.get("id") === bookmark.id;

  // Extract domain for favicon
  const domain = (() => {
    try {
      return new URL(bookmark.url).hostname.replace("www.", "");
    } catch {
      return "";
    }
  })();
  const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null;

  // Close edit form when navigation completes after submitting
  const prevNavigationState = useRef(navigation.state);
  
  useEffect(() => {
    const wasSubmitting = prevNavigationState.current === "submitting";
    const isNowIdle = navigation.state === "idle";
    
    if (wasSubmitting && isNowIdle && isEditing) {
      setIsEditing(false);
    }
    
    prevNavigationState.current = navigation.state;
  }, [navigation.state, isEditing]);

  if (isEditing) {
    return (
      <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
        <Form method="post" className="space-y-3">
          <input type="hidden" name="intent" value="edit" />
          <input type="hidden" name="id" value={bookmark.id} />
          
          <div>
            <input
              type="text"
              name="title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
          <div>
            <input
              type="url"
              name="url"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              placeholder="URL"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
          <div>
            <input
              type="text"
              name="category"
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              placeholder="Category"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isUpdating ? "Saving..." : "Save"}
            </button>
          </div>
        </Form>
      </div>
    );
  }

  return (
    <div
      className={`group relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm card-hover ${
        isDeleting ? "opacity-50" : ""
      }`}
    >
      {/* Quick Actions */}
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => setIsEditing(true)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          title="Edit"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => navigator.clipboard.writeText(bookmark.url)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          title="Copy URL"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        <Form method="post" className="inline">
          <input type="hidden" name="intent" value="delete" />
          <input type="hidden" name="id" value={bookmark.id} />
          <button
            type="submit"
            disabled={isDeleting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
            title="Delete"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </Form>
      </div>

      {/* Content */}
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="flex items-start gap-3">
          {/* Favicon */}
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100">
            {faviconUrl ? (
              <img
                src={faviconUrl}
                alt=""
                className="h-6 w-6"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).parentElement!.innerHTML = `
                    <svg class="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  `;
                }}
              />
            ) : (
              <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            )}
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1 pr-8">
            <h3 className="truncate font-medium text-slate-900 group-hover:text-slate-700">
              {bookmark.title || domain || bookmark.url}
            </h3>
            <p className="mt-0.5 truncate text-sm text-slate-500">{domain}</p>
          </div>
        </div>
      </a>
    </div>
  );
}
