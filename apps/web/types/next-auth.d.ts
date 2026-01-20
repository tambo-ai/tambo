import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    idToken: string;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
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
