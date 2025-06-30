import { getServerSupabaseClient } from "@/server/supabase";
import { AuthedLayoutWrapper } from "../../components/auth/authed-layout-wrapper";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication on the server
  const _supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await _supabase.auth.getUser();

  return (
    <AuthedLayoutWrapper hasSession={!!user}>{children}</AuthedLayoutWrapper>
  );
}
