import { useAuth } from "@clerk/clerk-react";
import { TamboProvider, type TamboComponent } from "@tambo-ai/react";
import { useEffect, useState } from "react";
import { z } from "zod/v4";
import { TamboChat } from "./TamboChat";
import { UserCard } from "./UserCard";

const TAMBO_API_KEY = import.meta.env.VITE_TAMBO_API_KEY;

const components: TamboComponent[] = [
  {
    name: "UserCard",
    description:
      "Shows details for the currently signed-in Clerk user when they ask to see their account or user details.",
    component: UserCard,
    propsSchema: z.object({}),
  },
];

export function AuthedTamboApp() {
  const { isLoaded, userId, getToken } = useAuth();
  const [userToken, setUserToken] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !userId) return;

    void getToken()
      .then((token) => {
        setUserToken(token ?? null);
      })
      .catch(() => {
        setUserToken(null);
      });
  }, [isLoaded, userId, getToken]);

  if (!isLoaded || !userId || !userToken) {
    return <p>Loading your AI session…</p>;
  }

  if (!TAMBO_API_KEY) {
    throw new Error("Missing VITE_TAMBO_API_KEY.");
  }

  return (
    <TamboProvider apiKey={TAMBO_API_KEY} components={components}>
      <TamboChat />
    </TamboProvider>
  );
}
