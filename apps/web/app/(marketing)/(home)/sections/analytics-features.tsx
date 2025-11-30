import { CalendarDays, Clock2, Zap } from 'lucide-react'
import { MapIllustration } from '@/components/illustrations/map-illustration'
import { VisualizationIllustration } from '@/components/illustrations/visualization-illustration'
import { Container } from '@/components/container'

export function AnalyticsFeatures() {
    return (
        <section>
            <Container>
                <div className="mx-auto w-full max-w-5xl px-6 xl:px-0">
                    <div className="mx-auto max-w-2xl space-y-4 text-center">
                        <span className="text-foreground font-mono text-sm uppercase">
                            <span className="text-muted-foreground">[02]</span> Analytics Platform
                        </span>
                        <h2 className="text-foreground mt-6 text-balance text-4xl font-semibold lg:text-5xl">Transform your data into visual insights</h2>
                        <p className="text-muted-foreground text-balance text-lg">Our powerful analytics platform helps you visualize complex data, identify trends, and make data-driven decisions with confidence.</p>
                    </div>
                </div>
            </Container>
            <Container className="**:data-[slot=content]:py-0">
                <div className="relative">
                    <div className="@4xl:grid-cols-2 @4xl:*:p-8 @5xl:*:p-12 @max-4xl:divide-y @4xl:divide-x grid border-b *:p-4">
                        <div className="row-span-2 grid grid-rows-subgrid gap-8">
                            <div className="mask-radial-from-35% @4xl:-mx-12 relative self-center">
                                <MapIllustration />
                            </div>
                            <div className="mx-auto max-w-sm text-center">
                                <h3 className="text-balance font-semibold">Global Data Visualization</h3>
                                <p className="text-muted-foreground mt-3 text-balance">Track worldwide metrics with interactive maps and region-specific analytics.</p>
                            </div>
                        </div>
                        <div className="row-span-2 grid grid-rows-subgrid gap-8">
                            <div className="@4xl:px-8 mx-auto w-full max-w-md self-center">
                                <VisualizationIllustration />
                            </div>

                            <div className="relative z-10 mx-auto max-w-sm text-center">
                                <h3 className="text-balance font-semibold">Advanced Analytics Engine</h3>
                                <p className="text-muted-foreground mt-3 text-balance">Harness the power of predictive modeling and trend analysis to make data-driven decisions.</p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:*:nth-3:border-r-0 @4xl:*:p-8 @5xl:*:p-12 @max-4xl:*:nth-3:border-b-0 @max-4xl:*:nth-2:border-r-0 @max-4xl:divide-y @4xl:grid-cols-3 relative grid grid-cols-2 divide-x *:p-4">
                        <div className="space-y-1.5">
                            <Clock2 className="stroke-primary size-4 fill-indigo-500/25" />
                            <h3 className="mt-3 font-medium">Speed Is Everything</h3>
                            <p className="text-muted-foreground line-clamp-2 text-sm">Tailark is a fast and efficient AI-powered code editor that can help you write code faster and more efficiently.</p>
                        </div>
                        <div className="space-y-1.5">
                            <Zap className="stroke-primary size-4 fill-indigo-500/25" />
                            <h3 className="mt-3 font-medium">Speed Is Everything</h3>
                            <p className="text-muted-foreground line-clamp-2 text-sm">Tailark is a fast and efficient AI-powered code editor that can help you write code faster and more efficiently.</p>
                        </div>
                        <div className="space-y-1.5">
                            <CalendarDays className="stroke-primary size-4 fill-indigo-500/25" />
                            <h3 className="mt-3 font-medium">Speed Is Everything</h3>
                            <p className="text-muted-foreground line-clamp-2 text-sm">Tailark is a fast and efficient AI-powered code editor that can help you write code faster and more efficiently.</p>
                        </div>
                        <div className="space-y-1.5 md:hidden">
                            <CalendarDays className="stroke-primary size-4 fill-indigo-500/25" />
                            <h3 className="mt-3 font-medium">Speed Is Everything</h3>
                            <p className="text-muted-foreground line-clamp-2 text-sm">Tailark is a fast and efficient AI-powered code editor that can help you write code faster and more efficiently.</p>
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    )
}