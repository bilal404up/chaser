import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { mono, sans } from "./fonts";
import DemoBar from "@/components/DemoBar";
import { isDemoMode } from "@/lib/demo";

export const metadata: Metadata = {
  title: "Chaser: late invoices, counted out loud",
  description:
    "An invoice tracker for freelancers. Chaser counts the days overdue, sorts the oldest first and writes a reminder you send yourself. A portfolio demo with sample data and a free and Pro plan; no real money moves.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: ReactNode }) {
  const demo = isDemoMode();
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.add('js');setTimeout(function(){if(!window.__kit)document.documentElement.classList.remove('js')},4000)",
          }}
        />
      </head>
      <body>
        {demo ? <DemoBar /> : null}
        {children}
      </body>
    </html>
  );
}
