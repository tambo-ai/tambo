import { getSupabaseClient } from "@/app/utils/supabase";
import { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

enum SessionState {
  Uninitialized,
  Loading,
  Authenticated,
  Unauthenticated,
  Error,
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>(
    SessionState.Uninitialized,
  );
  const checkAuth = useCallback(async () => {
    console.log("Checking auth status");
    try {
      const supabase = getSupabaseClient();
      setSessionState(SessionState.Loading);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setSessionState(
        session ? SessionState.Authenticated : SessionState.Unauthenticated,
      );
    } catch (error) {
      console.error("Error checking auth status:", error);
      setSession(null);
      setSessionState(SessionState.Error);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return { session, sessionState };
}
