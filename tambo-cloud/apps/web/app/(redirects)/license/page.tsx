import { env } from "@/lib/env";
import { redirect } from "next/navigation";

export default function LicensePage() {
  redirect(
    env.NEXT_PUBLIC_LICENSE_URL ||
      "https://docs.google.com/document/d/1UHvU9pKnuZ4wHRjxRk_8nqmeDK8KTmHc/edit?usp=sharing&ouid=105761745283245441798&rtpof=true&sd=true",
  );
}
