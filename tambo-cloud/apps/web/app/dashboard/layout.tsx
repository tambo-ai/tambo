import { TRPCReactProvider } from "@/trpc/react";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return <TRPCReactProvider>{children}</TRPCReactProvider>;
};

export default DashboardLayout;
