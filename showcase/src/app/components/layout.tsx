import { Sidebar } from "@/components/sidebar";

export default function DocsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Sidebar />
      <div>
        <main className="pb-16">
          <div className="container mx-auto">{children}</div>
        </main>
      </div>
    </>
  );
}
