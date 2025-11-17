import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { WaitlistModal } from "@/components/waitlist-modal";

export default function Home() {
  return (
    <>
      <section className="bg-background relative overflow-hidden min-h-screen">
        <div className="mask-b-from-55% dither mask-b-to-75% mask-radial-from-45% mask-radial-at-bottom mask-radial-[125%_80%] lg:aspect-3/2 absolute inset-0 opacity-15">
          <Image
            src="/hero.png"
            alt="gradient background"
            className="size-full object-cover object-bottom brightness-75 rotate-180 scale-x-[-1]"
            width={2342}
            height={1561}
            priority
            fetchPriority="high"
          />
        </div>
        <div className="mask-b-from-55% mask-b-to-75% mask-radial-from-45% mask-radial-at-bottom mask-radial-[125%_80%] lg:aspect-7/5 absolute inset-0">
          <Image
            src="/hero.png"
            alt="gradient background"
            className="size-full object-cover object-bottom brightness-50 rotate-180 scale-x-[-1]"
            width={2342}
            height={1561}
            priority
            fetchPriority="high"
          />
        </div>

        <div className="pb-20 pt-24 md:pt-32 lg:pt-48">
          <div className="relative z-10 mx-auto grid max-w-5xl items-end gap-4 px-6">
            <span className="text-primary font-mono text-sm uppercase mb-2">
              closed beta
            </span>
            <div>
              <h1 className="text-balance text-5xl font-semibold md:max-w-4xl lg:text-6xl">
                Build AI video, image, and audio pipelines with a simple
                composable API
                {/* <span className="max-md:hidden">built</span> for{" "}
                <span className="bg-linear-to-b from-foreground/50 to-foreground/95 bg-clip-text text-transparent [-webkit-text-stroke:0.5px_var(--color-foreground)]">
                  SaaS that scales 1
                </span> */}
              </h1>
            </div>
            <div className="max-w-3xl">
              <p className="text-muted-foreground mb-6 text-balance text-lg lg:text-xl">
                Connect models like lego blocks — Synthome manages processing,
                storage, retries, and rendering from start to finish
              </p>
              <WaitlistModal />
              <Button
                asChild
                className="bg-foreground/10 ring-foreground/20 hover:bg-foreground/15 ml-3 backdrop-blur"
                variant="outline"
                size="sm"
              >
                <Link href="#">
                  Follow on{" "}
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
              </Button>
            </div>
          </div>
          {/* <HeroIllustration /> */}
        </div>
      </section>
      {/* <LogoCloud />
            <HowItWorks />
            <PlatformFeatures />
            <MoreFeatures />
            <StatsSection />
            <TestimonialsSection />
            <CallToAction /> */}
    </>
  );
}
