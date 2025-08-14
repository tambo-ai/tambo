import { env } from "@/lib/env";
import { redirect } from "next/navigation";

export default function PrivacyPage() {
  redirect(
    env.NEXT_PUBLIC_PRIVACY_URL ||
      "https://docs.google.com/document/d/1OFX8Y-uc7_TLDFUKxq3dYI0ozbpN8igD/edit?usp=sharing&ouid=105761745283245441798&rtpof=true&sd=true",
  );
}
