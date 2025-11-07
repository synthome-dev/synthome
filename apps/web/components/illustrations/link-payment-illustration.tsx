export const LinkPaymentIllustration = () => (
    <div className="relative -mx-8 my-auto">
        <div className="mask-radial-at-top blur-xs mask-radial-from-65% mask-radial-[100%_100%] absolute inset-0 backdrop-blur">
            <div className="size-full [background:radial-gradient(125%_125%_at_50%_10%,transparent_40%,var(--color-emerald-600)_100%)]"></div>
            <div className="absolute inset-x-0 top-6 grid h-fit grid-cols-2 pt-12">
                <div className="-rotate-12">
                    <MainIllustration />
                </div>
                <div className="rotate-12">
                    <MainIllustration />
                </div>
            </div>
        </div>
        <div className="relative z-10 h-full px-8 py-12 sm:px-20">
            <MainIllustration />
        </div>
    </div>
)

const MainIllustration = () => (
    <div
        aria-hidden
        className="relative shadow-2xl shadow-black [--color-primary-foreground:var(--color-white)] [--color-primary:var(--color-emerald-500)]">
        <div className="inset-shadow-sm inset-shadow-white/3 ring-foreground/10 bg-background/75 relative space-y-5 rounded-2xl p-2 ring-1 backdrop-blur-xl">
            <div>
                <div className="text-muted-foreground px-2 pb-2 text-sm">irung@tailark.com</div>

                <div className="bg-foreground/5 ring-foreground/10 flex flex-col gap-2 rounded-md border border-transparent p-4 shadow ring-1">
                    <div className="text-foreground mb-1 text-sm font-medium">Checkout with Link</div>
                    <div className="text-muted-foreground text-sm">It looks like you've saved info to checkout with Link before. Enter the code sent to your phone to complete your purchase.</div>

                    <div className="mx-auto mb-3 mt-5 grid w-56 grid-cols-2 gap-4">
                        <div className="*:hover:ring-foreground/15 grid grid-cols-3 gap-1.5">
                            <div className="border-border-illustration bg-background/75 relative flex h-8 items-center justify-center rounded border font-mono text-sm shadow-xl shadow-black/65 ring-1 ring-emerald-500 hover:!ring-emerald-500">
                                <div className="absolute -inset-px rounded bg-emerald-500/15"></div>
                                <div className="absolute inset-x-1.5 bottom-1 h-px bg-emerald-300/50"></div>0
                            </div>
                            <div className="bg-background/75 ring-foreground/10 h-8 rounded border border-transparent shadow-xl shadow-black/65 ring-1"></div>
                            <div className="bg-background/75 ring-foreground/10 h-8 rounded border border-transparent shadow-xl shadow-black/65 ring-1"></div>
                        </div>
                        <div className="*:hover:ring-foreground/15 grid grid-cols-3 gap-1.5">
                            <div className="bg-background/75 ring-foreground/10 h-8 rounded border border-transparent shadow-xl shadow-black/65 ring-1"></div>
                            <div className="bg-background/75 ring-foreground/10 h-8 rounded border border-transparent shadow-xl shadow-black/65 ring-1"></div>
                            <div className="bg-background/75 ring-foreground/10 h-8 rounded border border-transparent shadow-xl shadow-black/65 ring-1"></div>
                        </div>
                    </div>
                </div>
                <div className="text-muted-foreground px-2 pt-2 text-xs">Powered by Link</div>
            </div>
        </div>
    </div>
)