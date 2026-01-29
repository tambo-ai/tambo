import { type NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import prisma from "./prisma";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user?.email || !user?.name) return false;

      try {
        await prisma.user.upsert({
          where: { email: user.email },
          update: { name: user.name },
          create: {
            email: user.email,
            name: user.name,
          },
        });
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (user) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });
          if (dbUser) {
            token.uid = dbUser.id;
          }
        } catch (error) {
          console.error("Error fetching user in JWT callback:", error);
        }
        token.name = user.name;
        token.email = user.email;
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      if (session.user) {
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      if (token.uid) {
        session.userId = token.uid as string;
      }
      return session;
    },
  },
} satisfies NextAuthOptions;
