import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/layout/Navigation";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Spendy — Expense Tracker",
  description: "A modern, professional expense tracking application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${geist.className} bg-gray-50 min-h-full`}>
        <Navigation />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">{children}</main>
      </body>
    </html>
  );
}
