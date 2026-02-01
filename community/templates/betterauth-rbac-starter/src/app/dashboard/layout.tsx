import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/tambo/Navbar";
import { TamboClientWrapper } from "@/components/tambo/TamboClientWrapper";
import { SuggestionsPanel } from "@/components/tambo/SuggestionsPanel";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <TamboClientWrapper
      apiKey={process.env.TAMBO_API_KEY!}
      userToken={session.session.id}
      role={(session.user.role as "admin" | "user") || "user"}
    >
      <div className="h-screen bg-black text-zinc-100 flex flex-col font-[family-name:var(--font-geist-sans)] overflow-hidden dark">
        <Navbar
          role={(session.user.role as "admin" | "user") || "user"}
          userName={session.user.name || "User"}
        />
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-hidden relative">{children}</main>
          <SuggestionsPanel
            role={(session.user.role as "admin" | "user") || "user"}
          />
        </div>
      </div>
    </TamboClientWrapper>
  );
}
