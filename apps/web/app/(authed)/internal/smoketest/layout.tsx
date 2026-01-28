import { authOptions } from "@/lib/auth";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
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

  // Get the OAuth id token from the session (session.user contains JWT data)
  const userToken = session?.user?.idToken;

  return <ClientLayout userToken={userToken}>{children}</ClientLayout>;
}
