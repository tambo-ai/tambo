import { signIn, signOut, useSession } from "next-auth/react";

/** Get the logged in user's session */
export function useNextAuthSession() {
  return useSession();
}

/** Sign in with a provider */
export function useSignIn() {
  return signIn;
}

/** Sign out the current user */
export function useSignOut() {
  return signOut;
}
