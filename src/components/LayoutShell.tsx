"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type LayoutShellProps = {
  children: ReactNode;
};

const navItems = [
  { href: "/", label: "ホテルを探す" },
  { href: "/favorites", label: "お気に入り" },
  { href: "/price-watch", label: "価格推移" },
];

export default function LayoutShell({ children }: LayoutShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-5">
            <Link
              className="shrink-0 text-base font-bold tracking-tight text-slate-950 sm:text-lg"
              href="/"
            >
              Travel Reserve
            </Link>
            <nav aria-label="主要ナビゲーション" className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => {
                const active =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                      active
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    }`}
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <Link
            className="shrink-0 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 sm:text-sm"
            href="/#about"
          >
            このサイトについて
          </Link>
        </div>
        <nav
          aria-label="主要ナビゲーション"
          className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden"
        >
          {navItems.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${
                  active ? "bg-blue-50 text-blue-600" : "text-slate-600"
                }`}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      {children}
    </div>
  );
}
