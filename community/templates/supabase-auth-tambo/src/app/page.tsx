import { redirect } from "next/navigation";

// Server redirect: let middleware handle auth-based routing from /dashboard
export default function HomePage() {
  redirect("/dashboard");
}
