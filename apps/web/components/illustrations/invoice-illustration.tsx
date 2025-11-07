import { cn } from '@/lib/utils'
import { LogoIcon } from '@/components/logo'
import { DocumentIllustation } from '@/components/illustrations/document-illustration'

export const InvoiceIllustration = ({ className }: { className?: string }) => {
    return (
        <div
            aria-hidden
            className={cn('relative', className)}>
            <div className="bg-linear-to-b blur-xs pointer-events-none absolute inset-y-6 left-0 w-2 rounded-2xl from-transparent via-blue-700 to-emerald-500 opacity-35"></div>
            <div className="bg-linear-to-r blur-xs pointer-events-none absolute inset-x-12 top-0 h-2 rounded-2xl from-transparent via-white to-indigo-500 opacity-15"></div>
            <div className="z-1 pointer-events-none absolute inset-0 rounded-2xl bg-blue-900 opacity-5 mix-blend-lighten"></div>

            <div className="ring-foreground/10 bg-card/95 relative overflow-hidden rounded-2xl p-8 text-sm shadow-lg shadow-black/5 ring-1 backdrop-blur">
                <div className="mb-6 flex items-start justify-between [--color-background:color-mix(in_oklab,var(--color-foreground)10%,var(--color-zinc-950))]">
                    <div className="space-y-0.5">
                        <LogoIcon />
                        <div className="mt-4 font-mono text-xs">INV-456789</div>
                        <div className="mt-1 -translate-x-1 font-mono text-2xl font-semibold">$284,342.57</div>
                        <div className="text-xs font-medium">Due in 15 days</div>
                    </div>
                    <DocumentIllustation />
                </div>

                <div className="mb-12 space-y-1.5 [--color-border:color-mix(in_oklab,var(--color-foreground)10%,transparent)]">
                    <div className="grid grid-cols-[auto_1fr] items-center">
                        <span className="text-muted-foreground w-18 block">To</span>
                        <span className="bg-border h-2 w-1/4 rounded-full px-2" />
                    </div>

                    <div className="grid grid-cols-[auto_1fr] items-center">
                        <span className="text-muted-foreground w-18 block">From</span>
                        <span className="bg-border h-2 w-1/2 rounded-full px-2" />
                    </div>

                    <div className="grid grid-cols-[auto_1fr] items-center">
                        <span className="text-muted-foreground w-18 block">Address</span>
                        <span className="bg-border h-2 w-2/3 rounded-full px-2" />
                    </div>
                </div>
            </div>
        </div>
    )
}