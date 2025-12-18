import { DeviceAuthPage } from "@/components/auth/device-auth-page";

export const metadata = {
  title: "Authorize CLI - Tambo",
  description: "Authorize the Tambo CLI to access your account",
};

export default function Page() {
  return <DeviceAuthPage />;
}
