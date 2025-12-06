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
        title: "Blog",
        href: "/blog",
      },
      {
        title: "Changelog",
        href: "/changelog",
      },
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
                <Link
                  href="https://discord.gg/9s79bsnS"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X/Twitter"
                  className="text-muted-foreground hover:text-[#5865F2] block"
                >
                  <svg
                    viewBox="0 0 256 199"
                    width="256"
                    height="199"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="xMidYMid"
                    className="size-5"
                  >
                    <path
                      d="M216.856 16.597A208.502 208.502 0 0 0 164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046-19.692-2.961-39.203-2.961-58.533 0-1.832-4.4-4.55-9.933-6.846-14.046a207.809 207.809 0 0 0-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193A161.094 161.094 0 0 0 79.735 175.3a136.413 136.413 0 0 1-21.846-10.632 108.636 108.636 0 0 0 5.356-4.237c42.122 19.702 87.89 19.702 129.51 0a131.66 131.66 0 0 0 5.355 4.237 136.07 136.07 0 0 1-21.886 10.653c4.006 8.02 8.638 15.67 13.873 22.848 21.142-6.58 42.646-16.637 64.815-33.213 5.316-56.288-9.08-105.09-38.056-148.36ZM85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18s10.149-26.2 23.015-26.2c12.867 0 23.236 11.804 23.015 26.2.02 14.375-10.148 26.18-23.015 26.18Zm85.051 0c-12.645 0-23.014-11.805-23.014-26.18s10.148-26.2 23.014-26.2c12.867 0 23.236 11.804 23.015 26.2 0 14.375-10.148 26.18-23.015 26.18Z"
                      fill="currentColor"
                    />
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
