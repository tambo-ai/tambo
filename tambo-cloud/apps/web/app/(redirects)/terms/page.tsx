import { env } from "@/lib/env";
import { redirect } from "next/navigation";

export default function TermsPage() {
  redirect(
    env.NEXT_PUBLIC_TERMS_URL ||
      "https://docs.google.com/document/d/1GOjwt8tHx3AQ1SeZJ0rXhxuuSfRYnjLIaF02chvFqYo/edit?usp=sharing",
  );
}
