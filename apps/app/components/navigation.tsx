"use client";

import { CreditCardIcon } from "@/components/icons";
import { BillingPage } from "@/features/billing";
import { cn } from "@/lib/utils";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/overview", label: "Overview" },
  { href: "/logs", label: "Logs" },
  { href: "/api-keys", label: "API Keys" },
  { href: "/integrations", label: "Integrations" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Top bar: Organization and User */}
      <div className="flex items-center justify-between px-3 h-14 border-b bg-surface-100">
        <OrganizationSwitcher
          hidePersonal
          appearance={{
            elements: {
              rootBox: {
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              },
            },
          }}
        >
          <OrganizationSwitcher.OrganizationProfilePage
            label="Billing"
            url="billing"
            labelIcon={
              <div className="flex items-center justify-center w-5 h-5 -mt-0.5">
                <CreditCardIcon />
              </div>
            }
          >
            <BillingPage />
          </OrganizationSwitcher.OrganizationProfilePage>
        </OrganizationSwitcher>

        <UserButton />
      </div>

      {/* Primary Navigation Bar */}
      <div className="sticky top-0 z-10 border-b bg-surface-100">
        <div className="no-scrollbar relative flex h-12 justify-between overflow-x-auto px-1.5">
          <nav className="relative isolate flex w-full shrink-0 items-stretch">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3.5 relative shrink-0 transition font-book text-[14px]",
                    "hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
                    isActive ? "text-primary" : "text-secondary"
                  )}
                >
                  {item.label}
                  {isActive && (
                    <div className="absolute inset-x-3.5 bottom-0 h-px bg-foreground rounded-full" />
                  )}
                </Link>
              );
            })}
            <div className="ml-auto self-center" />
          </nav>
        </div>

        {/* Gradient overlays for scroll indication */}
        <div className="pointer-events-none absolute bottom-[1px] left-0 top-0 w-14 bg-gradient-to-r from-gray-50 dark:from-gray-950 transition-opacity duration-200 opacity-0" />
        <div className="pointer-events-none absolute bottom-[1px] right-0 top-0 w-14 bg-gradient-to-l from-gray-50 dark:from-gray-950 transition-opacity duration-200 opacity-0" />
      </div>
    </>
  );
}
