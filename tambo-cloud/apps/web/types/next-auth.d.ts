import "next-auth";

declare module "next-auth" {
  interface User {
    idToken: string;
  }
  interface DefaultSession {
    user: User;
  }
}
