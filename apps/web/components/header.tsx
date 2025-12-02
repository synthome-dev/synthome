"use client";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { useMedia } from "@/hooks/use-media";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import React from "react";

interface MobileLink {
  name: string;
  href: string;
}

const mobileLinks: MobileLink[] = [
  // { name: "Models", href: "/models" },
  { name: "Pricing", href: "/pricing" },
  { name: "Docs", href: "/docs" },
  { name: "Blog", href: "/blog" },
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const isLarge = useMedia("(min-width: 64rem)");

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    handleScroll(); // Check initial scroll position on mount
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    const originalOverflow = document.body.style.overflow;

    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileMenuOpen]);

  return (
    <header
      role="banner"
      data-theme="dark"
      data-state={isMobileMenuOpen ? "active" : "inactive"}
      {...(isScrolled && { "data-scrolled": true })}
      className="has-data-[state=open]:h-screen has-data-[state=open]:backdrop-blur has-data-[state=open]:bg-background/50 fixed inset-x-0 top-0 z-50"
    >
      <div
        className={cn(
          "border-border-illustration absolute inset-x-0 top-0 z-50 h-14 border-b ring-1 ring-transparent transition-all duration-300",
          "in-data-scrolled:ring-border-illustration in-data-scrolled:border-transparent in-data-scrolled:bg-background/75 in-data-scrolled:backdrop-blur",
          "has-data-[state=open]:ring-foreground/5 has-data-[state=open]:border-transparent has-data-[state=open]:bg-background/75 has-data-[state=open]:shadow-lg has-data-[state=open]:backdrop-blur has-data-[state=open]:border-b has-data-[state=open]:shadow-black/10 has-data-[state=open]:h-[calc(var(--navigation-menu-viewport-height)+3.4rem)]",
          "max-lg:in-data-[state=active]:h-screen max-lg:in-data-[state=active]:bg-background/75 max-lg:in-data-[state=active]:backdrop-blur max-lg:h-14 max-lg:overflow-hidden max-lg:border-b"
        )}
      >
        <div className="mx-auto max-w-6xl px-2 lg:px-6">
          <div className="relative flex flex-wrap items-center justify-between lg:py-3">
            <div
              aria-hidden
              className="in-has-data-[state=open]:block bg-size-[4px_1px] absolute inset-x-0 bottom-0 hidden h-px bg-[linear-gradient(90deg,var(--color-foreground)_1px,transparent_1px)] bg-repeat-x opacity-20"
            />
            <div className="flex items-center justify-between gap-8 max-lg:h-14 max-lg:w-full max-lg:border-b">
              <Link href="/" aria-label="home">
                <Logo className="w-28 h-8" />
              </Link>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={
                  isMobileMenuOpen == true ? "Close Menu" : "Open Menu"
                }
                className="relative z-20 -m-2.5 -mr-3 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-5 duration-200" />
                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-5 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
            </div>

            {isLarge && (
              <div className="absolute inset-0 m-auto size-fit">
                <NavMenu />
              </div>
            )}

            {!isLarge && isMobileMenuOpen && (
              <MobileMenu closeMenu={() => setIsMobileMenuOpen(false)} />
            )}

            <div className="max-lg:in-data-[state=active]:mt-6 in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                <Button asChild variant="outline" size="sm">
                  <Link href="https://dashboard.synthome.dev/sign-in">
                    Sign In
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="border-transparent px-4 text-sm"
                >
                  <Link href="https://dashboard.synthome.dev/sign-up">
                    Get API Key
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

const MobileMenu = ({ closeMenu }: { closeMenu: () => void }) => {
  return (
    <nav
      role="navigation"
      className="w-full [--color-border:--alpha(var(--color-foreground)/5%)] [--color-muted:--alpha(var(--color-foreground)/5%)]"
    >
      {mobileLinks.map((link, index) => (
        <Link
          key={index}
          href={link.href}
          onClick={closeMenu}
          className="group relative block border-0 border-b py-4 text-lg"
        >
          {link.name}
        </Link>
      ))}
    </nav>
  );
};

const NavMenu = () => {
  return (
    <NavigationMenu className="max-lg:hidden">
      <NavigationMenuList className="gap-3">
        {/* <NavigationMenuItem value="models">
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="/models">Models</Link>
          </NavigationMenuLink>
        </NavigationMenuItem> */}
        <NavigationMenuItem value="pricing">
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="/pricing">Pricing</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem value="docs">
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="/docs">Docs</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem value="blog">
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="/blog">Blog</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};
