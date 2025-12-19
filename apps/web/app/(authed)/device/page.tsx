import { DeviceCodeForm } from "@/components/device-auth/device-code-form";
import { use } from "react";

export const metadata = {
  title: "Authorize CLI",
  description: "Authorize Tambo CLI access to your account",
};

export default function DevicePage({
  searchParams,
}: {
  searchParams: Promise<{ user_code?: string }>;
}) {
  const initialCode = use(searchParams).user_code ?? "";

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Authorize CLI Access
          </h1>
          <p className="text-muted-foreground mt-2">
            Grant your terminal access to your tambo account
          </p>
        </div>
        <DeviceCodeForm initialCode={initialCode} />
      </div>
    </div>
  );
}
