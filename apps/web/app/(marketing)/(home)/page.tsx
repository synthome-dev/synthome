import { Button } from "@/components/ui/button";
import Link from "next/link";

import { PlatformFeatures } from "@/app/(marketing)/(home)/sections/platform-features";
import { CallToAction } from "@/components/call-to-action";
import CodeDemoSection from "@/components/code-demo-hero";
import { Container } from "@/components/container";
import { NpmISynthome } from "@/components/npm-i-synthome";

export default function Home() {
  return (
    <>
      <section id="home" className="overflow-hidden">
        <div className="relative">
          <div className="relative mx-auto max-w-5xl px-6 pt-32 text-center sm:pt-44">
            <div className="relative mx-auto max-w-3xl text-center">
              <h1 className="text-foreground text-balance text-5xl font-semibold sm:text-6xl">
                Build AI video, image, and audio pipelines with a simple
                composable API
              </h1>
              <p className="text-muted-foreground mb-9 mt-7 text-balance text-lg">
                Connect models like lego blocks — Synthome manages processing,
                storage, retries, and rendering from start to finish
              </p>
              <div className="flex gap-2 items-center justify-center">
                <Button
                  asChild
                  className="border-transparent px-4 text-sm shadow-xl shadow-indigo-950/30"
                >
                  <Link href="https://dashboard.synthome.dev/sign-up">
                    Get API Key
                  </Link>
                </Button>
                <NpmISynthome />
              </div>
            </div>
          </div>
          <Container className="**:data-[slot=content]:py-0 mt-8 sm:mt-16">
            <div className="border-b [--color-border:var(--color-border-illustration)] border-dashed">
              <div
                aria-hidden
                className="border-b [--color-border:var(--color-border-illustration)] h-3 w-full bg-[repeating-linear-gradient(-45deg,var(--color-foreground),var(--color-foreground)_1px,transparent_1px,transparent_4px)] opacity-5"
              />
            </div>
            <CodeDemoSection />
            <div className="border-t [--color-border:var(--color-border-illustration)] border-dashed">
              <div
                aria-hidden
                className="h-3 w-full bg-[repeating-linear-gradient(-45deg,var(--color-foreground),var(--color-foreground)_1px,transparent_1px,transparent_4px)] opacity-5"
              />
            </div>
          </Container>
        </div>
        {/* <LogoCloud /> */}
      </section>
      {/* <Manifesto /> */}
      <PlatformFeatures />
      {/* <AnalyticsFeatures />
      <IntegrationsSection />
      <TestimonialsSection /> */}
      <CallToAction />
    </>
  );
}
