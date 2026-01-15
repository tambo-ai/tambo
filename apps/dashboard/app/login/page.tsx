import { getAuthProviders } from "@/lib/auth";
import { Metadata } from "next";
import { LoginPageBody } from "./LoginPage";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
};

export default function LoginPage() {
  const providers = getAuthProviders();
  return <LoginPageBody providers={providers} />;
}
