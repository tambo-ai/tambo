import { Metadata } from "next";
import { ClientLayout } from "./components/client-layout";

export const metadata: Metadata = {
  title: "Tambo Smoketest",
  description: "Tambo Smoketest",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>;
}
