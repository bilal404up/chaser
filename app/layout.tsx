import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { body, display, mono } from "./fonts";
import DemoBar from "@/components/DemoBar";
import { isDemoMode } from "@/lib/demo";

export const metadata: Metadata = {
  title: "Chaser: late invoices, chased politely",
  description: "Log what you are owed. Chaser shows what is overdue and writes the reminder. A demo subscription app with a free plan and a Pro plan in Stripe test mode. Sample data.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: ReactNode }) {
  const demo = isDemoMode();
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body data-demo={demo ? "true" : undefined}>
        {children}
        {demo ? <DemoBar /> : null}
      </body>
    </html>
  );
}
