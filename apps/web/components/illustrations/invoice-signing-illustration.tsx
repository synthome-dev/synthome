import { LogoIcon } from '@/components/logo'
import { cn } from '@/lib/utils'

export const InvoiceSigningIllustration = ({ className }: { className?: string }) => {
    return (
        <div
            aria-hidden
            className={cn('relative', className)}>
            <div className="bg-linear-to-b blur-xs pointer-events-none absolute inset-y-6 left-0 w-2 rounded-2xl from-indigo-500 via-white to-purple-500 opacity-15"></div>
            <div className="bg-linear-to-r blur-xs pointer-events-none absolute inset-x-12 top-0 h-2 rounded-2xl from-transparent via-white to-indigo-500 opacity-35"></div>
            <div className="z-1 pointer-events-none absolute inset-0 rounded-2xl bg-indigo-900 opacity-5 mix-blend-lighten"></div>

            <div className="bg-card/95 ring-foreground/10 relative overflow-hidden rounded-2xl p-8 text-sm shadow-lg shadow-black/5 ring-1 backdrop-blur">
                <div className="space-y-0.5">
                    <LogoIcon />
                    <div className="mt-4 font-mono text-xs">INV-456789</div>
                    <div className="mt-1 -translate-x-1 font-mono text-2xl font-semibold">$284,342.57</div>
                    <div className="text-xs font-medium">Due in 15 days</div>
                </div>

                <div className="border-foreground/15 bg-background mt-6 flex h-24 items-center justify-center rounded-md border backdrop-blur">
                    <div className="border-b px-6 font-serif">Sign here</div>
                </div>
            </div>
        </div>
    )
}