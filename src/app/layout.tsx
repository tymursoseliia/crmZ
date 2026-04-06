import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientBody from "./ClientBody";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Империя Зета",
  description: "Генератор автодокументов",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%231f2937'/><path d='M20 65 L20 45 L35 55 L50 35 L65 55 L80 45 L80 65 Z' fill='%23F59E0B'/><rect x='18' y='65' width='64' height='12' rx='3' fill='%23F59E0B'/><circle cx='20' cy='45' r='5' fill='%23F59E0B'/><circle cx='50' cy='35' r='5' fill='%23F59E0B'/><circle cx='80' cy='45' r='5' fill='%23F59E0B'/></svg>" type="image/svg+xml" />
        <Script
          crossOrigin="anonymous"
          src="//unpkg.com/same-runtime/dist/index.global.js"
        />
      </head>
      <body suppressHydrationWarning className="antialiased">
        <ClientBody>{children}</ClientBody>
      </body>
    </html>
  );
}
