import { authOptions } from "@/lib/auth";
import { ComponentsThemeProvider } from "@/providers/components-theme-provider";
import { Metadata } from "next";
import { getServerSession, User } from "next-auth";
import { CSSProperties } from "react";
import { ClientLayout } from "./components/client-layout";

export const metadata: Metadata = {
  title: "Tambo Smoketest",
  description: "Tambo Smoketest",
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  // Get the OAuth access token from the session
  const userToken = user?.idToken ?? user?.userToken;

  return (
    <ComponentsThemeProvider>
      <div style={{ "--container": "0 0% 100%" } as CSSProperties}>
        <ClientLayout userToken={userToken}>{children}</ClientLayout>
      </div>
    </ComponentsThemeProvider>
  );
}
