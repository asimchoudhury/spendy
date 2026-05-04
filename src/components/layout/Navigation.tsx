"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Menu, X, Wallet, Tags, Cloud } from "lucide-react";
import { useState, type ComponentType } from "react";

type NavItem = {
  href: string;
  label: string;
  lucideIcon?: ComponentType<{ size?: number; className?: string }>;
  emoji?: string;
};

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", lucideIcon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", lucideIcon: Receipt },
  { href: "/breakdown", label: "Breakdown", emoji: "📊" },
  { href: "/categories", label: "Categories", lucideIcon: Tags },
  { href: "/export", label: "Export", lucideIcon: Cloud },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Wallet size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">Spendy</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map(({ href, label, lucideIcon: Icon, emoji }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? "bg-violet-50 text-violet-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {Icon ? <Icon size={16} /> : <span className="text-base leading-none">{emoji}</span>}
                  {label}
                </Link>
              );
            })}
          </nav>

          <button
            className="sm:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileOpen && (
          <nav className="sm:hidden pb-3 flex flex-col gap-1">
            {navItems.map(({ href, label, lucideIcon: Icon, emoji }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? "bg-violet-50 text-violet-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {Icon ? <Icon size={16} /> : <span className="text-base leading-none">{emoji}</span>}
                  {label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
