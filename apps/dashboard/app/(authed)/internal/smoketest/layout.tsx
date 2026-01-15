import { authOptions } from "@/lib/auth";
import { Metadata } from "next";
import { getServerSession, User } from "next-auth";
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
  const user = session?.user as User | undefined;

  // Get the OAuth access token from the session
  const userToken = user?.idToken;

  return <ClientLayout userToken={userToken}>{children}</ClientLayout>;
}
