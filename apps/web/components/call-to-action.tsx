import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function CallToAction() {
    return (
        <section className="py-20">
            <div className="relative mx-auto max-w-5xl px-6">
                <div className="relative mx-auto max-w-2xl text-center">
                    <h2 className="text-balance text-4xl font-semibold md:text-5xl">
                        Build, Sell and Scale <span className="bg-linear-to-b from-foreground/50 to-foreground/95 bg-clip-text text-transparent [-webkit-text-stroke:0.5px_var(--color-foreground)]">Your Business</span>
                    </h2>
                    <p className="text-muted-foreground mb-6 mt-4 text-balance">Join a community of over 1000+ companies and developers who have already discovered the power of Tailark. </p>

                    <Button
                        asChild
                        size="sm">
                        <Link href="#">Get Started</Link>
                    </Button>
                    <Button
                        asChild
                        className="bg-foreground/10 ring-foreground/20 hover:bg-foreground/15 ml-3 backdrop-blur"
                        variant="outline"
                        size="sm">
                        <Link href="#">Contact Sales</Link>
                    </Button>
                </div>
            </div>
        </section>
    )
}