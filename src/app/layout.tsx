import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";
import SessionProvider from "@/components/SessionProvider";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
// Load and validate environment variables at app startup
import "@/lib/env";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Clean Glass Proposal App",
  description: "Professional glazing proposal management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GlobalErrorBoundary>
          <SessionProvider>
            {children}
          </SessionProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
