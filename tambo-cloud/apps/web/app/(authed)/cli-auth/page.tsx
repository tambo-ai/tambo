import { CLIAuthClient } from "@/components/auth/CLIAuthClient";

export const metadata = {
  title: "Setup tambo",
  description: "Create a project and generate an API key",
};

export default function CLIAuthPage() {
  return <CLIAuthClient />;
}
