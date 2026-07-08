"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Journal stays routable for the studio's own use, but the client's
// discovery form said no to managing the blog from here — so no nav slot.
const links = [
  { href: "/studio/dashboard", label: "Overview" },
  { href: "/studio/projects", label: "Projects" },
  { href: "/studio/leads", label: "Enquiries" },
  { href: "/studio/analytics", label: "Analytics" },
] as const;

export function StudioNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Studio" className="flex gap-6 overflow-x-auto lg:flex-col lg:gap-4">
      {links.map(({ href, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "mono-label whitespace-nowrap py-1 transition-colors hover:text-ink",
              active && "text-brass",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
