import { CLIAuthPage } from "@/components/auth/cli-auth-page";

export const metadata = {
  title: "Setup tambo",
  description: "Create a project and generate an API key",
};

export default function Page() {
  return <CLIAuthPage />;
}
