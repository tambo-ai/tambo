import { NextAuthLayoutWrapper } from "@/components/auth/nextauth-layout-wrapper";
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
      <NextAuthLayoutWrapper>{children}</NextAuthLayoutWrapper>
    </HydrateClient>
  );
}
