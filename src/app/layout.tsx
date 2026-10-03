import type { Metadata } from "next";
import "./globals.css";
import { LocalyProvider } from "@/components/providers/localy-provider";
import { AppShell } from "@/components/layout/app-shell";
import { SupabaseGate } from "@/components/auth/supabase-gate";
export const metadata: Metadata = {
  title: "Localy — Turn local conversations into customers",
  description:
    "Find local demand, match it to your services, and turn conversations into bookings.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SupabaseGate>
          <LocalyProvider>
            <AppShell>{children}</AppShell>
          </LocalyProvider>
        </SupabaseGate>
      </body>
    </html>
  );
}
