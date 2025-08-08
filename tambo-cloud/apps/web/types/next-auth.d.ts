import "next-auth";

declare module "next-auth" {
  interface User {
    idToken: string;
  }
  interface DefaultSession {
    user: User;
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
