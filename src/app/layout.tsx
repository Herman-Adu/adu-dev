import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { SiteHeader, SiteFooter } from "@/features/chrome/lib";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://adudev.co.uk"),
  title: {
    default: "Adu Dev — Independent engineering studio",
    template: "%s · Adu Dev",
  },
  description:
    "Cinematic front ends, typed contracts and full-stack product, built by one senior engineer with an agent fleet behind them.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={`${inter.variable} ${jetbrains.variable}`}>
      <body>
        {/* First tab stop on every page. The nav is four links deep before
            content starts, and scene 01 sits behind a sticky bar. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:inline-flex focus:min-h-[44px] focus:items-center focus:rounded-[var(--radius-control)] focus:bg-brand focus:px-4 focus:font-semibold focus:text-ground"
        >
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
