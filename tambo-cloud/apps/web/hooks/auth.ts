import { getSupabaseClient } from "@/app/utils/supabase";
import { Session } from "@supabase/supabase-js";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";

/** Get the logged in user's session */
export function useSession(
  queryOptions: Partial<UseQueryOptions<Session | null>> = {},
) {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session;
    },
    ...queryOptions,
  });
}
