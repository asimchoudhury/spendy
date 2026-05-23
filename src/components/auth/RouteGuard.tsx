"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Navigation } from "@/components/layout/Navigation";
import { MigrationModal } from "@/components/MigrationModal";
import { DataRefreshProvider } from "@/contexts/DataRefreshContext";

const PUBLIC_PATHS = ["/login", "/signup"];

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (isLoading) return;
    if (!user && !isPublic) router.replace("/login");
    if (user && isPublic) router.replace("/");
  }, [isLoading, user, isPublic, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-violet-600" size={32} />
      </div>
    );
  }

  // Auth pages: full screen, no nav
  if (isPublic) {
    return <>{children}</>;
  }

  // Protected pages: nav + main wrapper
  if (!user) return null;

  return (
    <DataRefreshProvider>
      <Navigation />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">{children}</main>
      <MigrationModal />
    </DataRefreshProvider>
  );
}
