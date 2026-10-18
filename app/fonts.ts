import { Archivo, IBM_Plex_Mono } from "next/font/google";

/** One family for display, UI and figures. Variable on weight and width (wdth 62 to 125). */
export const sans = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-sans",
});

/** Receipt meta only: due dates, invoice lines, the letter header. */
export const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});
