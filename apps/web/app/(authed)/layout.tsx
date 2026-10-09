import { NextAuthLayoutWrapper } from "@/components/auth/nextauth-layout-wrapper";
import { ShutdownNotice } from "@/components/shutdown-notice";
import { HydrateClient, trpc } from "@/server/api/root";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await Promise.all([
    trpc.user.hasAcceptedLegal.prefetch(),
    trpc.user.getUser.prefetch(),
  ]);
  return (
    <HydrateClient>
      <ShutdownNotice />
      <NextAuthLayoutWrapper>{children}</NextAuthLayoutWrapper>
    </HydrateClient>
  );
}
