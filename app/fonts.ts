import { Fraunces, Archivo, Azeret_Mono } from "next/font/google";

export const display = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-display",
});

export const body = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-body",
});

export const mono = Azeret_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});
