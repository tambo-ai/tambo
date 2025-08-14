import { redirect } from "next/navigation";
import { env } from "@/lib/env";

export default function HackPage() {
  redirect(env.NEXT_PUBLIC_TAMBOHACK_URL!);
}
