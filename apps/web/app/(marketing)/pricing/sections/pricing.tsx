import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";

export function Pricing() {
  return (
    <section className="bg-muted/50">
      <Container className="**:data-[slot=content]:pt-0  border-b **:data-[slot=content]:pb-0">
        <div className="border-b [--color-border:var(--color-border-illustration)] border-dashed">
          <div
            aria-hidden
            className="border-b [--color-border:var(--color-border-illustration)] h-3 w-full bg-[repeating-linear-gradient(-45deg,var(--color-foreground),var(--color-foreground)_1px,transparent_1px,transparent_4px)] opacity-5"
          />
        </div>
        <div className="@4xl:grid-cols-3 grid *:p-6 bg-background">
          <div className="@max-4xl:p-9 row-span-4 grid grid-rows-subgrid gap-8">
            <div className="self-end">
              <CardTitle className="text-lg font-medium">Free</CardTitle>
              <div className="text-muted-foreground mt-1 text-balance text-sm">
                Free forever. Build and experiment with AI video pipelines.
              </div>
            </div>

            <div>
              <span className="text-3xl font-semibold">$0</span>
              <div className="text-muted-foreground text-sm">Free forever</div>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="#">Get Started</Link>
            </Button>

            <ul role="list" className="space-y-3 text-sm">
              {[
                "10GB Cloud Storage",
                "Access to All AI Models",
                "Full SDK Access",
                "Composable Pipelines",
                "Webhook Support",
                "Community Support",
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check
                    className="text-muted-foreground size-3"
                    strokeWidth={3.5}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="ring-foreground/10 bg-card rounded-(--radius) @4xl:my-2 @max-4xl:mx-1 row-span-4 grid grid-rows-subgrid gap-8 border-transparent shadow-xl ring-1 backdrop-blur">
            <div className="self-end">
              <CardTitle className="text-lg font-medium">Pro</CardTitle>
              <CardDescription className="text-muted-foreground mt-1 text-balance text-sm">
                For teams shipping AI video products to production.
              </CardDescription>
            </div>

            <div>
              <span className="text-3xl font-semibold">$49</span>
              <div className="text-muted-foreground text-sm">Per month</div>
            </div>
            <Button asChild className="w-full">
              <Link href="#">Get Started</Link>
            </Button>

            <ul role="list" className="space-y-3 text-sm">
              {[
                "Everything in Free, plus:",
                "10,000 Actions Included",
                "$5 per 1,000 Additional Actions",
                "Priority Support",
                "Team Collaboration",
              ].map((item, index) => (
                <li
                  key={index}
                  className="group flex items-center gap-2 first:font-medium"
                >
                  <Check
                    className="text-muted-foreground size-3 group-first:hidden"
                    strokeWidth={3.5}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="@max-4xl:p-9 row-span-4 grid grid-rows-subgrid gap-8">
            <div className="self-end">
              <CardTitle className="text-lg font-medium">Enterprise</CardTitle>
              <CardDescription className="text-muted-foreground mt-1 text-balance text-sm">
                Custom solutions for large-scale deployments.
              </CardDescription>
            </div>

            <div>
              <span className="text-3xl font-semibold">Custom</span>
              <div className="text-muted-foreground text-sm">Contact us</div>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="mailto:dmitry@synthome.dev?subject=Enterprise%20Inquiry">
                Contact Sales
              </Link>
            </Button>

            <ul role="list" className="space-y-3 text-sm">
              {[
                "Everything in Pro, plus:",
                "Private Cloud Deployment",
                "Custom Action Limits",
                "Dedicated Support",
                "SLA Guarantees",
                "Custom Integrations",
                "Volume Discounts",
              ].map((item, index) => (
                <li
                  key={index}
                  className="group flex items-center gap-2 first:font-medium"
                >
                  <Check
                    className="text-muted-foreground size-3 group-first:hidden"
                    strokeWidth={3.5}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t [--color-border:var(--color-border-illustration)] border-dashed">
          <div
            aria-hidden
            className="border-b [--color-border:var(--color-border-illustration)] h-3 w-full bg-[repeating-linear-gradient(-45deg,var(--color-foreground),var(--color-foreground)_1px,transparent_1px,transparent_4px)] opacity-5"
          />
        </div>
      </Container>
    </section>
  );
}
