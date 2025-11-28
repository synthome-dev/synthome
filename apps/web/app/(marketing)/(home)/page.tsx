import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

import { AnalyticsFeatures } from "@/app/(marketing)/(home)/sections/analytics-features";
import { IntegrationsSection } from "@/app/(marketing)/(home)/sections/integrations-section";
import { Manifesto } from "@/app/(marketing)/(home)/sections/manifesto";
import { PlatformFeatures } from "@/app/(marketing)/(home)/sections/platform-features";
import { TestimonialsSection } from "@/app/(marketing)/(home)/sections/testimonials-section";
import { CallToAction } from "@/components/call-to-action";
import { Container } from "@/components/container";
import { LogoCloud } from "@/components/logo-cloud";

export default function Home() {
  return (
    <>
      <section
        id="home"
        className="overflow-hidden border-b [--color-border:var(--border-illustration)]"
      >
        <div className="relative">
          <div
            aria-hidden
            className="dither-md mask-x-from-65% mask-x-to-95% mask-y-from-75% pointer-events-none absolute -inset-x-12 -bottom-24 top-1/4 mt-auto 2xl:mx-auto 2xl:max-w-7xl"
          >
            <div className="size-full">
              <Image
                src="https://res.cloudinary.com/dohqjvu9k/image/upload/v1759215689/grid-1-bg_byeo9b.webp"
                alt="tailark hero section background"
                className="size-full object-cover object-bottom brightness-125 contrast-75"
                width={1152}
                height={767}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1152px"
                priority
                fetchPriority="high"
              />
            </div>
          </div>
          <div className="relative mx-auto max-w-5xl px-6 pt-32 text-center sm:pt-44">
            <div className="relative mx-auto max-w-3xl text-center">
              <h1 className="text-foreground text-balance text-5xl font-semibold sm:text-6xl">
                Modern Solutions for Customer{" "}
                <span className="relative text-indigo-500">
                  <svg
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 -bottom-3 w-full"
                    viewBox="0 0 283 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1.24715 19.3744C72.4051 10.3594 228.122 -4.71194 281.724 7.12332"
                      stroke="url(#paint0_linear_pl)"
                      strokeWidth="4"
                    />
                    <defs>
                      <linearGradient
                        id="paint0_linear_pl"
                        x1="282"
                        y1="5.49999"
                        x2="40"
                        y2="13"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="var(--color-indigo-300)" />
                        <stop offset="1" stopColor="var(--color-blue-200)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="relative">Engagement</span>
                </span>
              </h1>
              <p className="text-muted-foreground mb-9 mt-7 text-balance text-lg">
                Our comprehensive analytics and experimentation platform
                empowers your team to make data-driven decisions.
              </p>
              <Button
                asChild
                size="lg"
                className="border-transparent px-4 text-sm shadow-xl shadow-indigo-950/30"
              >
                <Link href="#">Start Testing for free</Link>
              </Button>
              <span className="text-muted-foreground mt-3 block text-center text-sm">
                No credit card required!
              </span>
            </div>
          </div>
          <Container className="bg-background **:data-[slot=content]:py-0 mt-8 sm:mt-16">
            <div
              aria-hidden
              className="h-3 w-full bg-[repeating-linear-gradient(-45deg,var(--color-foreground),var(--color-foreground)_1px,transparent_1px,transparent_4px)] opacity-5"
            />
            <div className="-mx-12 -mt-4 px-12 pt-4">
              <div className="bg-background ring-foreground/5 p-1 shadow-2xl shadow-indigo-900/35 ring-1">
                <div className="bg-background sm:aspect-3/2 relative origin-top overflow-hidden border-l-8 border-t-4 border-transparent">
                  <Image
                    className="object-top-left min-w-xl size-full object-cover"
                    src="https://res.cloudinary.com/dohqjvu9k/image/upload/v1757920810/circle_un3f39.png"
                    alt="Oxymor overview"
                    width={1152}
                    height={768}
                    priority
                    fetchPriority="high"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1152px"
                  />
                </div>
              </div>
            </div>
          </Container>
        </div>
        <LogoCloud />
      </section>
      <Manifesto />
      <PlatformFeatures />
      <AnalyticsFeatures />
      <IntegrationsSection />
      <TestimonialsSection />
      <CallToAction />
    </>
  );
}
