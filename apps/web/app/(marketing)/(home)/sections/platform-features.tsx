import { Card } from "@/components/ui/card";

import { ScheduleIllustation } from "@/components/illustrations/schedule-illustration";
import { KitIllustration } from "@/components/illustrations/kit-illustration";
import { ReplyIllustration } from "@/components/illustrations/reply-illustration";
import { VisualizationIllustration } from "@/components/illustrations/visualization-illustration";
import { Container } from "@/components/container";

export function PlatformFeatures() {
  return (
    <section>
      <Container>
        <div className="mx-auto w-full max-w-5xl px-6 xl:px-0">
          <div className="mx-auto max-w-2xl space-y-4 text-center">
            <span className="text-foreground font-mono text-sm uppercase">
              <span className="text-muted-foreground">[01]</span> Platform
            </span>
            <h2 className="text-foreground mt-6 text-balance text-4xl font-semibold lg:text-5xl">
              Cutting-Edge tools to build subscriptions
            </h2>
            <p className="text-muted-foreground text-balance text-lg">
              Our platform combines cutting-edge AI models with intuitive
              interfaces to streamline your development workflow and boost
              productivity.
            </p>
          </div>
        </div>
      </Container>
      <div className="@container [--color-card:transparent]">
        <div className="mx-auto w-full max-w-5xl px-6">
          <div className="@2xl:grid-cols-2 @2xl:grid-rows-4 mt-16 grid gap-6 [--color-border:color-mix(in_oklab,var(--color-foreground)10%,transparent)] *:shadow-lg *:shadow-black/5 lg:-mx-8">
            <Card className="@2xl:row-span-3 group grid grid-rows-[auto_1fr] rounded-2xl p-0">
              <div className="text-balance p-8">
                <h3 className="text-foreground font-semibold">
                  Component Kits & Campaigns
                </h3>
                <p className="text-muted-foreground mt-3">
                  Browse favorite kits, manage campaign timelines, and connect
                  initiatives—all from a single organized view.
                </p>
              </div>
              <KitIllustration />
            </Card>

            <Card className="@2xl:row-span-2 grid grid-rows-[auto_1fr] gap-8 overflow-hidden rounded-2xl p-8">
              <div className="text-balance">
                <h3 className="text-foreground font-semibold">
                  Schedule & Compose
                </h3>
                <p className="text-muted-foreground mt-3">
                  Plan with calendar shortcuts and write with rich text
                  tools—bold, italics, underline, and more—without leaving your
                  flow.
                </p>
              </div>

              <ScheduleIllustation />
            </Card>

            <Card className="@2xl:row-span-2 @xl:@max-3xl:col-start-2 @max-3xl:row-start-1 group grid grid-rows-[auto_1fr] gap-8 overflow-hidden rounded-2xl p-8">
              <div className="text-balance">
                <h3 className="text-foreground font-semibold">
                  Dashboards & Usage
                </h3>
                <p className="text-muted-foreground mt-3">
                  Visualize key metrics with live cards and progress bars to
                  monitor usage and spot trends at a glance.
                </p>
              </div>

              <div aria-hidden className="flex flex-col justify-center">
                <VisualizationIllustration />
              </div>
            </Card>

            <Card className="bg-linear-to-l @md:grid-cols-[1fr_auto] grid gap-8 overflow-hidden rounded-2xl from-slate-900/50 p-8">
              <div className="text-balance">
                <h3 className="text-foreground font-semibold">
                  Mentions & Files
                </h3>
                <p className="text-muted-foreground mt-2">
                  Keep conversations in context with @mentions,.
                </p>
              </div>
              <div className="@max-md:row-start-1 @md:-mr-12 -mr-16 -mt-8 max-w-xs">
                <ReplyIllustration />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
