import { InvoiceIllustration } from '@/components/illustrations/invoice-illustration'
import { InvoiceSigningIllustration } from '@/components/illustrations/invoice-signing-illustration'
import { PaymentIllustration } from '@/components/illustrations/payment-illustration'
import Image from 'next/image'

export function HowItWorks() {
    return (
        <section>
            <div className="@container relative pb-12 pt-24 [--color-card:color-mix(in_oklab,var(--color-zinc-900)_70%,var(--color-background))] md:py-40">
                <div className="mask-b-from-55% dither mask-b-to-75% mask-radial-from-45% mask-radial-at-bottom mask-radial-[125%_80%] absolute inset-0 aspect-video opacity-75 mix-blend-overlay">
                    <Image
                        src="https://res.cloudinary.com/dohqjvu9k/image/upload/v1759207511/constellation_uvxuml.webp"
                        alt="gradient background"
                        className="size-full object-cover object-bottom"
                        width={2342}
                        height={1561}
                    />
                </div>
                <div className="relative mx-auto w-full max-w-5xl px-6">
                    <div className="mb-16">
                        <span className="text-primary font-mono text-sm uppercase">How it works</span>
                        <div className="mt-8 grid items-end gap-6 md:grid-cols-2">
                            <h2 className="text-foreground text-4xl font-semibold md:text-5xl">Build your MRR in minutes</h2>
                            <div className="lg:pl-12">
                                <p className="text-muted-foreground text-balance">Our platform combines cutting-edge AI models with intuitive interfaces to streamline your development workflow and boost productivity.</p>
                            </div>
                        </div>
                    </div>
                    <div className="@max-4xl:max-w-sm mx-auto lg:-mx-12">
                        <div className="@max-4xl:gap-12 @4xl:grid-cols-3 grid">
                            <div className="row-span-2 grid grid-rows-subgrid gap-8">
                                <div className="@max-4xl:-ml-1 relative self-end">
                                    <div className="absolute inset-0 size-3/5 rounded-full bg-blue-400 opacity-10 blur-xl"></div>
                                    <IllustrationPerspective>
                                        <PaymentIllustration />
                                    </IllustrationPerspective>
                                </div>
                                <div className="@4xl:px-12">
                                    <h3 className="text-balance font-semibold">1. Add payment information</h3>
                                    <p className="text-muted-foreground mt-4">
                                        Securely add your <span className="text-foreground font-medium">payment details</span> to get started with our services.
                                    </p>
                                </div>
                            </div>
                            <div className="row-span-2 grid grid-rows-subgrid gap-8">
                                <div className="@max-4xl:-ml-1 relative self-end">
                                    <div className="absolute inset-0 size-3/5 rounded-full bg-indigo-400 opacity-10 blur-xl"></div>
                                    <IllustrationPerspective>
                                        <InvoiceSigningIllustration />
                                    </IllustrationPerspective>
                                </div>
                                <div className="@4xl:px-12">
                                    <h3 className="text-balance font-semibold">2. Sign documents</h3>
                                    <p className="text-muted-foreground mt-4">
                                        Digitally sign and <span className="text-foreground font-medium">authorize transactions</span> with ease.
                                    </p>
                                </div>
                            </div>
                            <div className="row-span-2 grid grid-rows-subgrid gap-8">
                                <div className="@max-4xl:-ml-1 relative self-end">
                                    <div className="absolute inset-0 size-3/5 rounded-full bg-blue-400 opacity-10 blur-xl"></div>
                                    <IllustrationPerspective>
                                        <InvoiceIllustration />
                                    </IllustrationPerspective>
                                </div>
                                <div className="@4xl:px-12">
                                    <h3 className="text-balance font-semibold">3. Receive confirmation</h3>
                                    <p className="text-muted-foreground mt-4">
                                        Get instant <span className="text-foreground font-medium">confirmation receipts</span> for all your completed transactions.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

const IllustrationPerspective = ({ children }: { children: React.ReactNode }) => (
    <div className="perspective-dramatic mask-radial-from-60% mask-radial-at-top-left mask-radial-[100%_100%] @4xl:pl-4 @md:pt-6 self-end pl-2 pt-2">
        <div>{children}</div>
    </div>
)