import type { Metadata } from "next";
import "./globals.css";
import { LocalyProvider } from "@/components/providers/localy-provider";
import { AppShell } from "@/components/layout/app-shell";
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
        <LocalyProvider>
          <AppShell>{children}</AppShell>
        </LocalyProvider>
      </body>
    </html>
  );
}
