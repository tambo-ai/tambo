import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
  }
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      idToken?: string;
    };
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
