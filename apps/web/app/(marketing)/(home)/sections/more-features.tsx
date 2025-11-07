import { Card } from '@/components/ui/card'
import { CompletePaymentIllustration } from '@/components/illustrations/complete-payment-illustration'
import { LinkPaymentIllustration } from '@/components/illustrations/link-payment-illustration'

export function MoreFeatures() {
    return (
        <section>
            <div className="@container py-16 [--color-card:transparent] lg:py-24">
                <div className="mx-auto w-full max-w-5xl px-6">
                    <div>
                        <span className="text-primary font-mono text-sm uppercase">What you get</span>
                        <div className="mt-8 grid items-end gap-6 md:grid-cols-2">
                            <h2 className="text-foreground text-4xl font-semibold md:text-5xl">Payment flows that convert and scale</h2>
                            <div className="lg:pl-12">
                                <p className="text-muted-foreground text-balance">Launch polished checkouts, Link one‑tap verification, and flexible methods—built with developer‑first blocks for speed and reliability.</p>
                            </div>
                        </div>
                    </div>
                    <div className="@xl:grid-cols-2 mt-16 grid gap-6 [--color-border:color-mix(in_oklab,var(--color-foreground)10%,transparent)] *:shadow-lg *:shadow-black/5 lg:-mx-8">
                        <Card className="group grid grid-rows-[auto_1fr] gap-8 rounded-2xl p-8">
                            <div>
                                <h3 className="text-foreground font-semibold">Complete payments securely</h3>
                                <p className="text-muted-foreground mt-3 text-balance">Offer card or bank transfers with a polished checkout. Capture details, validate, and confirm—all in a compliant, branded flow.</p>
                            </div>

                            <CompletePaymentIllustration />
                        </Card>

                        <Card className="group grid grid-rows-[auto_1fr] gap-8 overflow-hidden rounded-2xl p-8">
                            <div>
                                <h3 className="text-foreground font-semibold">One‑tap checkout with Link</h3>
                                <p className="text-muted-foreground mt-3 text-balance">Recognize saved details and verify with a one‑time code to finish purchases in seconds—no forms, no friction.</p>
                            </div>

                            <LinkPaymentIllustration />
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    )
}