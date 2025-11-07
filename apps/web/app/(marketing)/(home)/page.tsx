import { Waitlist } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <>
      <section className="bg-background relative overflow-hidden">
        <div className="mask-b-from-55% dither mask-b-to-75% mask-radial-from-45% mask-radial-at-bottom mask-radial-[125%_80%] lg:aspect-3/2 absolute inset-0 opacity-15">
          <Image
            src="https://res.cloudinary.com/dohqjvu9k/image/upload/v1759207511/constellation_uvxuml.webp"
            alt="gradient background"
            className="size-full object-cover"
            width={2342}
            height={1561}
            priority
            fetchPriority="high"
          />
        </div>
        <div className="mask-b-from-55% mask-b-to-75% mask-radial-from-45% mask-radial-at-bottom mask-radial-[125%_80%] lg:aspect-7/5 absolute inset-0">
          <Image
            src="https://res.cloudinary.com/dohqjvu9k/image/upload/v1759207511/constellation_uvxuml.webp"
            alt="gradient background"
            className="size-full object-cover"
            width={2342}
            height={1561}
            priority
            fetchPriority="high"
          />
        </div>

        <div className="pb-20 pt-24 md:pt-32 lg:pt-48">
          <div className="relative z-10 mx-auto grid max-w-5xl items-end gap-4 px-6">
            <span className="text-primary font-mono text-sm uppercase mb-2">
              synthome | closed beta
            </span>
            <div>
              <h1 className="text-balance text-5xl font-semibold md:max-w-4xl lg:text-6xl">
                Composable AI Media Toolkit
                {/* <span className="max-md:hidden">built</span> for{" "}
                <span className="bg-linear-to-b from-foreground/50 to-foreground/95 bg-clip-text text-transparent [-webkit-text-stroke:0.5px_var(--color-foreground)]">
                  SaaS that scales 1
                </span> */}
              </h1>
            </div>
            <div className="max-w-3xl">
              <p className="text-muted-foreground mb-6 text-balance text-lg lg:text-xl">
                Build flexible AI video, image, or audio workflows by combining
                models from Google Cloud, Fal.ai, or Replicate with power of
                FFmpeg
              </p>
              <Button asChild size="sm">
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
              {/* <Button
                asChild
                className="bg-foreground/10 ring-foreground/20 hover:bg-foreground/15 ml-3 backdrop-blur"
                variant="outline"
                size="sm"
              >
                <Link href="#">Watch Demo</Link>
              </Button> */}
            </div>
          </div>
          <div className="mx-auto w-full flex justify-center my-10">
            <Waitlist appearance={{ theme: dark }} />
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
