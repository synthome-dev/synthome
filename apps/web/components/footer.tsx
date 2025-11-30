import { Logo } from "@/components/logo";
import Link from "next/link";

const links = [
  {
    group: "Product",
    items: [
      {
        title: "Features",
        href: "/",
      },
      {
        title: "Pricing",
        href: "/pricing",
      },
      {
        title: "Docs",
        href: "/docs",
      },
    ],
  },
  {
    group: "Company",
    items: [
      {
        title: "Terms",
        href: "/terms",
      },
      {
        title: "Privacy",
        href: "/privacy",
      },
    ],
  },
];

export default function FooterSection() {
  return (
    <footer role="contentinfo" className="bg-background py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 md:grid-cols-5">
          <div className="space-y-6 md:col-span-2 md:space-y-12">
            <Link href="/" aria-label="go home" className="block size-fit">
              <Logo className="w-28 h-8" />
            </Link>
          </div>

          <div className="col-span-3 grid gap-6 sm:grid-cols-3">
            {links.map((link, index) => (
              <div key={index} className="space-y-4 text-sm">
                <span className="block font-medium">{link.group}</span>

                <div className="flex flex-wrap gap-4 sm:flex-col">
                  {link.items.map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      className="text-muted-foreground hover:text-primary block duration-150"
                    >
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            <div className="space-y-4">
              <span className="block font-medium">Community</span>
              <div className="flex flex-wrap gap-3 text-sm">
                <Link
                  href="https://x.com/ddubovetzky"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X/Twitter"
                  className="text-muted-foreground hover:text-primary block"
                >
                  <svg
                    className="size-5"
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M10.488 14.651L15.25 21h7l-7.858-10.478L20.93 3h-2.65l-5.117 5.886L8.75 3h-7l7.51 10.015L2.32 21h2.65zM16.25 19L5.75 5h2l10.5 14z"
                    ></path>
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div
          aria-hidden
          className="h-px border-t border-dashed [--color-border:var(--color-border-illustration)] pt-8 mt-8"
        />
        <div className="flex flex-wrap justify-between gap-4">
          <span className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Synthome, All rights reserved{" "}
          </span>

          {/* <span className="text-sm text-emerald-500">All Systems Normal</span> */}
        </div>
      </div>
    </footer>
  );
}
