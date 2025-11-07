export const PaymentIllustration = () => (
    <div
        aria-hidden
        className="relative [--color-primary-foreground:var(--color-white)] [--color-primary:var(--color-indigo-500)]">
        <div className="bg-linear-to-b blur-xs pointer-events-none absolute inset-y-6 left-0 w-2 rounded-2xl from-indigo-500 via-white to-purple-500 opacity-35"></div>
        <div className="bg-linear-to-r blur-xs pointer-events-none absolute inset-x-12 top-0 h-2 rounded-2xl from-transparent via-sky-500 to-emerald-500 opacity-40"></div>
        <div className="z-1 pointer-events-none absolute inset-0 rounded-2xl bg-blue-900 opacity-5 mix-blend-lighten"></div>
        <div className="inset-shadow-sm inset-shadow-white/3 ring-foreground/10 bg-card/95 relative space-y-5 rounded-2xl p-8 ring-1 backdrop-blur">
            <div>
                <div className="text-foreground mb-3 text-sm font-medium">Email</div>
                <div className="bg-background ring-foreground/10 col-span-2 flex h-8 items-center justify-between rounded-md border border-transparent px-2 shadow ring-1">
                    <span className="text-muted-foreground text-sm">irung@tailark.com</span>
                </div>
            </div>
            <div className="text-foreground mb-3 text-sm font-medium">Card Information</div>
            <div className="relative grid grid-cols-2 -space-y-px [--input-radius:theme(borderRadius.lg)]">
                <div className="bg-background ring-foreground/10 col-span-2 flex h-8 items-center justify-between rounded-t-md border border-transparent px-2 shadow ring-1">
                    <span className="text-muted-foreground text-sm">1234 123456 12345</span>
                    <svg
                        aria-hidden="true"
                        className="h-2.5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 256 83">
                        <defs>
                            <linearGradient
                                id="logosVisa0"
                                x1="45.974%"
                                x2="54.877%"
                                y1="-2.006%"
                                y2="100%">
                                <stop
                                    offset="0%"
                                    stopColor="#222357"></stop>
                                <stop
                                    offset="100%"
                                    stopColor="#254aa5"></stop>
                            </linearGradient>
                        </defs>
                        <path
                            fill="url(#logosVisa0)"
                            d="M132.397 56.24c-.146-11.516 10.263-17.942 18.104-21.763c8.056-3.92 10.762-6.434 10.73-9.94c-.06-5.365-6.426-7.733-12.383-7.825c-10.393-.161-16.436 2.806-21.24 5.05l-3.744-17.519c4.82-2.221 13.745-4.158 23-4.243c21.725 0 35.938 10.724 36.015 27.351c.085 21.102-29.188 22.27-28.988 31.702c.069 2.86 2.798 5.912 8.778 6.688c2.96.392 11.131.692 20.395-3.574l3.636 16.95c-4.982 1.814-11.385 3.551-19.357 3.551c-20.448 0-34.83-10.87-34.946-26.428m89.241 24.968c-3.967 0-7.31-2.314-8.802-5.865L181.803 1.245h21.709l4.32 11.939h26.528l2.506-11.939H256l-16.697 79.963zm3.037-21.601l6.265-30.027h-17.158zm-118.599 21.6L88.964 1.246h20.687l17.104 79.963zm-30.603 0L53.941 26.782l-8.71 46.277c-1.022 5.166-5.058 8.149-9.54 8.149H.493L0 78.886c7.226-1.568 15.436-4.097 20.41-6.803c3.044-1.653 3.912-3.098 4.912-7.026L41.819 1.245H63.68l33.516 79.963z"
                            transform="matrix(1 0 0 -1 0 82.668)"></path>
                    </svg>
                </div>
                <div className="ring-foreground/10 bg-background flex h-8 items-center rounded-bl-md border border-transparent px-2 shadow ring-1">
                    <span className="text-muted-foreground text-sm">MM/YY</span>
                </div>
                <div className="ring-foreground/10 bg-background flex h-8 items-center rounded-br-md border border-transparent px-2 shadow ring-1">
                    <span className="text-muted-foreground text-sm">CVV</span>
                </div>
            </div>
        </div>
    </div>
)