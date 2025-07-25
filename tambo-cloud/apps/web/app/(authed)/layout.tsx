import { NextAuthLayoutWrapper } from "@/components/auth/nextauth-layout-wrapper";

export default function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NextAuthLayoutWrapper>{children}</NextAuthLayoutWrapper>;
}
