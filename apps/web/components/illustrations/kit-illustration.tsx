import { BookOpen, Gem, MoonStar } from 'lucide-react'

export const KitIllustration = () => {
    return (
        <div
            aria-hidden
            className="h-fit">
            <div className="relative mx-auto mt-auto [--color-primary:var(--color-emerald-500)] sm:px-8">
                <div className="absolute inset-x-8 bottom-12 z-10 mx-auto sm:w-3/5">
                    <div className="bg-linear-to-b blur-xs pointer-events-none absolute inset-y-6 left-0 w-2 rounded-2xl from-transparent via-white to-purple-500 opacity-75"></div>
                    <div className="ring-foreground/10 bg-illustration/75 inset-shadow-sm inset-shadow-white/4 rounded-2xl border border-transparent p-6 text-xs shadow-2xl shadow-black ring-1 backdrop-blur">
                        <div className="mb-0.5 text-sm font-semibold">Compaign</div>
                        <div className="text-muted-foreground/65 mb-4 flex gap-2 text-sm">
                            <span>Loyalty program</span>
                            <span>loyalty program</span>
                        </div>
                        <div className="@sm:grid-cols-2 mb-4 grid gap-2">
                            <div className="bg-foreground/5 border-border-illustration flex gap-2 rounded-md border p-2">
                                <div className="bg-primary w-1 rounded-full"></div>

                                <div>
                                    <div className="text-sm font-medium">Start Date</div>
                                    <div className="text-muted-foreground line-clamp-1">Feb 6, 2024 at 00:00</div>
                                </div>
                            </div>
                            <div className="bg-foreground/5 border-border-illustration flex gap-2 rounded-md border p-2">
                                <div className="bg-primary w-1 rounded-full"></div>

                                <div>
                                    <div className="text-sm font-medium">End Date</div>
                                    <div className="text-muted-foreground line-clamp-1">Feb 6, 2024 at 00:00</div>
                                </div>
                            </div>
                        </div>

                        <p>
                            <span className="text-muted-foreground/65">Connected to 12</span> <span className="text-primary font-medium">Marketing Campaigns</span>.
                        </p>
                    </div>
                </div>
                <div className="bg-card blur-xs ml-auto h-80 w-4/5 rounded-2xl px-6 py-4 opacity-50">
                    <div className="space-y-2">
                        <div>Favorite Kits</div>
                        <div className="*:hover:bg-muted -mx-2 flex flex-col gap-0.5 *:cursor-pointer *:rounded-md *:p-2">
                            <div className="flex items-center gap-1">
                                <QuartzKitLogo />
                                <div className="text-xs">Quartz</div>
                                <div className="text-muted-foreground ml-auto text-xs">Now</div>
                            </div>
                            <div className="flex items-center gap-1">
                                <DuskKitLogo />
                                <div className="text-xs">Dusk</div>
                                <div className="text-muted-foreground ml-auto text-xs">12h ago</div>
                            </div>
                            <div className="flex items-center gap-1">
                                <MistKitLogo />
                                <div className="text-xs">Mist</div>
                                <div className="text-muted-foreground ml-auto text-xs">2 days ago</div>
                            </div>
                            <div className="flex items-center gap-1">
                                <QuartzKitLogo />
                                <div className="text-xs">Quartz</div>
                                <div className="text-muted-foreground ml-auto text-xs">Now</div>
                            </div>
                            <div className="flex items-center gap-1">
                                <DuskKitLogo />
                                <div className="text-xs">Dusk</div>
                                <div className="text-muted-foreground ml-auto text-xs">12h ago</div>
                            </div>

                            <div className="flex items-center gap-1">
                                <QuartzKitLogo />
                                <div className="text-xs">Quartz</div>
                                <div className="text-muted-foreground ml-auto text-xs">Now</div>
                            </div>
                            <div className="flex items-center gap-1">
                                <MistKitLogo />
                                <div className="text-xs">Mist</div>
                                <div className="text-muted-foreground ml-auto text-xs">2 days ago</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const QuartzKitLogo = () => (
    <div className="bg-linear-to-b relative flex size-5 items-center justify-center rounded from-amber-400 to-rose-500 shadow-md shadow-black/25 before:absolute before:inset-px before:rounded-[3px] before:border before:border-white/40 before:ring-1 before:ring-black/25 dark:before:border-transparent dark:before:ring-white/25">
        <div className="absolute inset-x-px inset-y-1.5 border-y border-dotted border-white/25"></div>
        <div className="absolute inset-x-1.5 inset-y-px border-x border-dotted border-white/25"></div>
        <Gem className="size-3 fill-white stroke-white drop-shadow" />
    </div>
)

const DuskKitLogo = () => (
    <div className="border-background dark:inset-ring dark:inset-ring-white/25 bg-linear-to-b dark:inset-shadow-2xs dark:inset-shadow-white/25 relative flex size-5 items-center justify-center rounded border from-purple-300 to-blue-600 shadow-md shadow-black/20 ring-1 ring-black/10 dark:border-0 dark:shadow-white/10 dark:ring-black/50">
        <div className="absolute inset-x-0 inset-y-1.5 border-y border-dotted border-white/25"></div>
        <div className="absolute inset-x-1.5 inset-y-0 border-x border-dotted border-white/25"></div>
        <MoonStar className="size-3 fill-white stroke-white drop-shadow" />
    </div>
)

const MistKitLogo = () => (
    <div className="border-background dark:inset-ring dark:inset-ring-white/25 bg-linear-to-b dark:inset-shadow-2xs dark:inset-shadow-white/25 relative flex size-5 items-center justify-center rounded border from-lime-300 to-teal-600 shadow-md shadow-black/20 ring-1 ring-black/10 dark:border-0 dark:shadow-white/10 dark:ring-black/50">
        <div className="absolute inset-1 aspect-square rounded-full border border-white/35 bg-black/15"></div>
        <div className="absolute inset-px aspect-square rounded-full border border-dashed border-white/25"></div>
        <BookOpen className="size-3 fill-white stroke-white drop-shadow-sm" />
    </div>
)