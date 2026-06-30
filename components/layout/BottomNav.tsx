"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Globe, ShoppingBag, Users, PenSquare, Search } from "lucide-react";

const navItems = [
  { href: "/",            icon: Home,        label: "Home"      },
  { href: "/worlds/gaming", icon: Globe,     label: "Worlds"    },
  { href: "/search",      icon: Search,      label: "Search"    },
  { href: "/write",       icon: PenSquare,   label: "Write"     },
  { href: "/marketplace", icon: ShoppingBag, label: "Market"    },
  { href: "/community",   icon: Users,       label: "Community" },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Hide on auth pages
  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: "rgba(12,12,22,0.95)",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(124,58,237,0.2)",
      }}
    >
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
              style={{
                color: isActive ? "#7C3AED" : "var(--text-muted)",
                background: isActive ? "rgba(124,58,237,0.1)" : "transparent",
              }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="font-mono text-[10px] font-bold">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}