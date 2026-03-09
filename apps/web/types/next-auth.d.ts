import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    idToken?: string;
    userToken?: string;
  }
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      userToken?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    idToken?: string;
    accessToken?: string;
    userToken?: string;
    provider: string;
    id: string;
  }
}
