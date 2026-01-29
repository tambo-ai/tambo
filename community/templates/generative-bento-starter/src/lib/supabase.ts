import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// --- Types & Schemas ---

export const bookmarkSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  url: z.string().url(),
  tags: z.array(z.string()).optional(),
  created_at: z.string().optional(),
});

export type Bookmark = z.infer<typeof bookmarkSchema>;

// --- Client Setup ---

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Mock Data Store (for demo purposes if no DB is connected)
const MOCK_BOOKMARKS: Bookmark[] = [
  {
    id: "1",
    title: "Tambo Documentation",
    url: "https://docs.tambo.co",
    tags: ["docs", "ai"],
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Supabase",
    url: "https://supabase.com",
    tags: ["database", "backend"],
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Next.js",
    url: "https://nextjs.org",
    tags: ["frontend", "react"],
    created_at: new Date().toISOString(),
  },
];

export const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// --- Helper Functions (CRUD) ---

export async function getBookmarks({ tag }: { tag?: string } = {}): Promise<
  Bookmark[]
> {
  if (!supabase) {
    console.warn("Supabase not configured. Returning mock data.");
    if (tag) {
      return MOCK_BOOKMARKS.filter((b) => b.tags?.includes(tag));
    }
    return MOCK_BOOKMARKS;
  }

  let query = supabase.from("bookmarks").select("*");
  if (tag) {
    query = query.contains("tags", [tag]);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createBookmark(
  bookmark: Omit<Bookmark, "id" | "created_at">,
): Promise<Bookmark> {
  if (!supabase) {
    console.warn("Supabase not configured. Mocking create.");
    const newBookmark = {
      ...bookmark,
      id: Math.random().toString(36).substring(7),
      created_at: new Date().toISOString(),
    };
    MOCK_BOOKMARKS.push(newBookmark);
    return newBookmark;
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .insert([bookmark])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBookmark({ id }: { id: string }): Promise<void> {
  if (!supabase) {
    console.warn("Supabase not configured. Mocking delete.");
    const index = MOCK_BOOKMARKS.findIndex((b) => b.id === id);
    if (index !== -1) MOCK_BOOKMARKS.splice(index, 1);
    return;
  }

  const { error } = await supabase.from("bookmarks").delete().eq("id", id);
  if (error) throw error;
}

export async function updateBookmark({
  id,
  updates,
}: {
  id: string;
  updates: Partial<Bookmark>;
}): Promise<Bookmark> {
  if (!supabase) {
    console.warn("Supabase not configured. Mocking update.");
    const index = MOCK_BOOKMARKS.findIndex((b) => b.id === id);
    if (index !== -1) {
      MOCK_BOOKMARKS[index] = { ...MOCK_BOOKMARKS[index], ...updates };
      return MOCK_BOOKMARKS[index];
    }
    throw new Error("Bookmark not found");
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
