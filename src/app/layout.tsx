import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { RouteGuard } from "@/components/auth/RouteGuard";

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
        <AuthProvider>
          <RouteGuard>{children}</RouteGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
