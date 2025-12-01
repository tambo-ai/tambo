import type { BlogPost } from "@/lib/get-posts";

jest.mock(
  "nextra/normalize-pages",
  () => ({
    normalizePages: jest.fn((arg: { list: unknown; route: string }) => {
      return { directories: arg.list };
    }),
  }),
  { virtual: true },
);

jest.mock(
  "nextra/page-map",
  () => ({
    getPageMap: jest.fn(async () => {
      const items: BlogPost[] = [
        {
          name: "b",
          route: "/blog/posts/b",
          content: "b content",
          frontMatter: {
            title: "Post B",
            date: "2024-01-10",
            author: "A",
          },
        },
        {
          name: "a",
          route: "/blog/posts/a",
          content: "a content",
          frontMatter: {
            title: "Post A",
            date: "2024-05-20",
            author: "B",
          },
        },
        {
          name: "c",
          route: "/blog/posts/c",
          content: "c content",
          frontMatter: {
            title: "Post C",
            date: "2023-12-31",
            author: "C",
          },
        },
      ];
      return items;
    }),
  }),
  { virtual: true },
);

describe("get-posts", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test("getPosts returns posts sorted by date desc", async () => {
    const { getPosts } = await import("@/lib/get-posts");
    const posts = await getPosts();
    expect(posts.map((p) => p.name)).toEqual(["a", "b", "c"]);
    expect(posts[0].frontMatter.title).toBe("Post A");
  });

  test("getPostListItems maps category from post name", async () => {
    const { getPostListItems } = await import("@/lib/get-posts");
    const items = await getPostListItems();
    const byId = Object.fromEntries(items.map((i) => [i.id, i]));
    // Default category is "update"
    expect(byId.a.category).toBe("update");
    expect(byId.b.category).toBe("update");
    expect(byId.c.category).toBe("update");
  });
});
