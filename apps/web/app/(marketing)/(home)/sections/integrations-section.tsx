import { cn } from '@/lib/utils'
import Link from 'next/link'

import { Openai as OpenAI } from '@/components/ui/svgs/openai'
import { Linear } from '@/components/ui/svgs/linear'
import { Vercel } from '@/components/ui/svgs/vercel'
import { Cloudflare } from '@/components/ui/svgs/cloudflare'
import { ClaudeAiIcon as ClaudeAI } from '@/components/ui/svgs/claudeAiIcon'
import { Gemini } from '@/components/ui/svgs/gemini'
import { GooglePalm } from '@/components/ui/svgs/googlePalm'
import { Mediawiki } from '@/components/ui/svgs/mediawiki'
import { Replit } from '@/components/ui/svgs/replit'
import { Vscodium } from '@/components/ui/svgs/vscodium'
import { Button } from '@/components/ui/button'

import { Container } from '@/components/container'

export function IntegrationsSection() {
    return (
        <section>
            <Container>
                <div className="mx-auto w-full max-w-5xl px-6 xl:px-0">
                    <div className="mx-auto max-w-2xl space-y-4 text-center">
                        <span className="text-foreground font-mono text-sm uppercase">
                            <span className="text-muted-foreground">[03]</span> Integrations
                        </span>
                        <h2 className="text-foreground mt-6 text-balance text-4xl font-semibold lg:text-5xl">Connect all your preferred applications</h2>
                        <p className="text-muted-foreground mb-6 text-balance text-lg">Tailark provides a seamless integration experience, allowing you to connect and synchronize data from multiple sources with ease.</p>
                        <Button
                            variant="outline"
                            size="sm"
                            asChild>
                            <Link href="#">See all integrations</Link>
                        </Button>
                    </div>
                </div>
            </Container>
            <Container className="**:data-[slot=content]:pt-0">
                <div className="border-b">
                    <div className="relative mx-auto max-w-4xl border-x">
                        <div className="grid grid-cols-4 gap-0 *:relative *:flex *:aspect-square *:items-center *:justify-center sm:grid-cols-8 md:grid-cols-12">
                            <Integration isHighlighted>
                                <Cloudflare className="size-6" />
                            </Integration>
                            <Integration
                                isHighlighted
                                className="col-start-3">
                                <Gemini className="size-6" />
                            </Integration>
                            <Integration className="col-start-5 max-sm:hidden lg:border-t-0">
                                <Vercel className="size-6" />
                            </Integration>
                            <Integration className="col-start-7 max-sm:hidden lg:border-t-0">
                                <Vscodium className="*:fill-foreground size-6" />
                            </Integration>
                            <Integration
                                isHighlighted
                                className="col-start-9 max-md:hidden">
                                <Linear className="size-6" />
                            </Integration>
                            <Integration className="col-start-11 max-md:hidden lg:border-t-0">
                                <Replit className="*:fill-foreground size-6" />
                            </Integration>
                            <Integration className="col-start-2 row-start-2 lg:border-b-0">
                                <OpenAI className="size-6" />
                            </Integration>
                            <Integration
                                isHighlighted
                                className="col-start-4 row-start-2">
                                <ClaudeAI className="size-6" />
                            </Integration>
                            <Integration
                                isHighlighted
                                className="col-start-6 row-start-2 max-sm:hidden">
                                <GooglePalm className="size-6" />
                            </Integration>
                            <Integration className="col-start-8 row-start-2 max-sm:hidden lg:border-b-0">
                                <OpenAI className="size-6" />
                            </Integration>
                            <Integration className="col-start-10 row-span-2 max-md:hidden lg:border-b-0">
                                <Vercel className="size-6" />
                            </Integration>
                            <Integration
                                isHighlighted
                                className="col-start-12 row-start-2 max-md:hidden">
                                <Mediawiki className="size-6" />
                            </Integration>
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    )
}

const Integration = ({ children, isHighlighted = false, className }: { children: React.ReactNode; isHighlighted?: boolean; className?: string }) => {
    return <div className={cn(isHighlighted ? 'bg-card ring-border-illustration shadow-md shadow-black/10 ring-1' : 'border-border-illustration bg-foreground/3 border *:size-6', className)}>{children}</div>
}