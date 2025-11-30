import { Container } from "@/components/container";
import { NpmISynthome } from "@/components/npm-i-synthome";
import { Button } from "@/components/ui/button";
import Link from "next/link";
// import { LayoutIllustration } from '@/app/grid-1/components/illustrations/layout-illustration'

export function CallToAction() {
  return (
    <section className="relative">
      <Container className="**:data-[slot=content]:py-0 relative">
        <div className="border-b [--color-border:var(--color-border-illustration)] border-dashed">
          <div
            aria-hidden
            className="h-3 w-full bg-[repeating-linear-gradient(-45deg,var(--color-foreground),var(--color-foreground)_1px,transparent_1px,transparent_4px)] opacity-5"
          />
        </div>
        <div className="relative overflow-hidden pl-8 pt-8 md:p-20 bg-background">
          <div className="max-w-xl max-md:pr-8">
            <div className="relative">
              <h2 className="text-foreground text-balance text-4xl font-semibold lg:text-5xl">
                Start building today
              </h2>
              <p className="text-foreground mb-6 mt-4 text-balance text-lg">
                One SDK. Any AI media model. Start composing.
              </p>

              <div className="flex gap-2">
                <Button asChild>
                  <Link href="https://dashboard.synthome.dev/sign-up">
                    Get API Key
                  </Link>
                </Button>
                <NpmISynthome />
              </div>
            </div>
          </div>
        </div>
        <div className="border-t [--color-border:var(--color-border-illustration)] border-dashed">
          <div
            aria-hidden
            className="h-3 w-full bg-[repeating-linear-gradient(-45deg,var(--color-foreground),var(--color-foreground)_1px,transparent_1px,transparent_4px)] opacity-5"
          />
        </div>
      </Container>
      <div className="border-b"></div>
    </section>
  );
}
