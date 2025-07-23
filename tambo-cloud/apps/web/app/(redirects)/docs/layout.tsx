import { permanentRedirect } from "next/navigation";

export default function Layout() {
  permanentRedirect(
    process.env.NEXT_PUBLIC_DOCS_URL || "https://docs.tambo.co",
  );
}
