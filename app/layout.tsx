import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { DemoBar } from "@/components/DemoBar";
import { isDemoMode } from "@/lib/demo";

const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-display", display: "swap" });
const body = Instrument_Sans({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-body", display: "swap" });
const mono = DM_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Chaser: late invoices, chased politely",
  description: "Log what you are owed. Chaser shows what is overdue and writes the reminder. A demo subscription app with a free plan and a Pro plan in Stripe test mode. Sample data.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const demo = isDemoMode();
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className={`min-h-screen antialiased ${demo ? "pb-14 sm:pb-10" : ""}`}>
        {children}
        {demo && <DemoBar />}
      </body>
    </html>
  );
}
