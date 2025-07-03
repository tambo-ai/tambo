import { getServerSupabaseClient } from "@/server/supabase";
import { Metadata } from "next";
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
  const supabase = await getServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return (
    <ClientLayout userToken={session?.access_token}>{children}</ClientLayout>
  );
}
