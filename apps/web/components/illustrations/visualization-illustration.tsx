export const MainIllustration = () => {
    return (
        <div className="bg-foreground/5 inset-shadow-sm inset-shadow-white/5 ring-foreground/10 relative z-10 rounded-lg p-5 pb-4 shadow-xl shadow-black/5 ring-1">
            <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground text-sm">56 GB / 128 GB</span>
                    <span className="text-foreground">45%</span>
                </div>
                <div className="before:bg-linear-to-r before:z-1 bg-foreground/5 after:bg-linear-to-r after:blur-xs relative my-1.5 h-1.5 rounded-full before:absolute before:inset-0 before:w-3/5 before:rounded-full before:from-white before:to-indigo-500 after:absolute after:inset-0 after:w-3/5 after:from-white after:to-indigo-900 after:opacity-50" />
            </div>
        </div>
    )
}

export const VisualizationIllustration = () => {
    return (
        <div className="mask-radial-from-50% mask-radial-at-center mask-radial-to-[75%_50%] group relative -mx-8 -my-8 max-md:-mx-6">
            <div className="grid grid-cols-5 items-center gap-2">
                <div className="*:ring-foreground/5 grid h-full grid-rows-[1fr_auto_1fr] space-y-2 *:rounded-2xl *:ring-1">
                    <div></div>
                    <div className="bg-card/50 h-24"></div>
                    <div></div>
                </div>
                <div className="col-span-3 grid grid-rows-[1fr_auto_1fr] space-y-2">
                    <div className="bg-card/50 ring-foreground/5 flex rounded-b-xl p-6 ring-1"></div>
                    <div className="relative">
                        <div className="absolute inset-0 bg-gray-900 blur-2xl"></div>
                        <div className="bg-background/75 ring-foreground/10 relative rounded-2xl p-2 shadow-2xl shadow-black/55 ring-1">
                            <MainIllustration />
                        </div>
                    </div>
                    <div className="bg-card/50 ring-foreground/5 rounded-t-xl p-6 ring-1"></div>
                </div>
                <div className="*:ring-foreground/5 grid h-full grid-rows-[1fr_auto_1fr] space-y-2 *:rounded-2xl *:ring-1">
                    <div></div>
                    <div className="bg-card/50 h-24"></div>
                    <div></div>
                </div>
            </div>
        </div>
    )
}