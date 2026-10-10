import { Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { ToastProvider } from "@/components/ui/toast";
import { ApolloClientProvider } from "@/lib/apollo";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ApolloClientProvider>
      <ToastProvider>
        <Suspense fallback={<div className="min-h-dvh bg-canvas" />}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </ToastProvider>
    </ApolloClientProvider>
  );
}
