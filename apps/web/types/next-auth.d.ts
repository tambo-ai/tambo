import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    idToken: string;
  }
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    idToken?: string;
    accessToken?: string;
    provider: string;
    id: string;
  }
}
