import { getServerSupabaseclient } from "@/server/supabase";
import { AuthedLayoutWrapper } from "../../components/auth/AuthedLayoutWrapper";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication on the server
  const supabase = await getServerSupabaseclient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <AuthedLayoutWrapper hasSession={!!session}>{children}</AuthedLayoutWrapper>
  );
}
