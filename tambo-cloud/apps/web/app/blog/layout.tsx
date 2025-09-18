import { Footer } from "@/components/sections/footer";
import { ReactNode } from "react";
import { BlogHeader } from "../../components/blog/blog-header";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | tambo blog",
    default: "blog",
  },
  description:
    "Latest updates, tutorials, and insights about tambo - the AI orchestration framework for React frontends.",
};

interface BlogLayoutProps {
  children: ReactNode;
}

export default function BlogLayout({ children }: BlogLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <BlogHeader />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
      <footer className="mt-auto">
        <div className="mx-auto w-full max-w-7xl">
          <Footer />
        </div>
      </footer>
    </div>
  );
}
