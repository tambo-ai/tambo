import "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    userId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    uid?: string;
  }
}
