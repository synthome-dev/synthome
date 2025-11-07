import Image from 'next/image'

export const HeroIllustration = () => {
    return (
        <div className="@container perspective-dramatic [mask-image:radial-gradient(ellipse_80%_95%_at_50%_0%,#000_80%,transparent_100%)] max-lg:pt-12">
            <div className="rotate-x-[0.125deg] before:z-1 before:bg-linear-to-b relative mx-auto max-w-6xl px-3 before:absolute before:inset-0 before:inset-x-4 before:top-0 before:rounded-2xl before:from-blue-950 before:opacity-20 before:mix-blend-color lg:px-12 lg:pt-20 lg:before:inset-x-12 lg:before:top-20">
                <div className="bg-linear-to-b from-foreground rotate-66 absolute inset-0 z-10 mx-auto w-8 -translate-y-44 rounded-full opacity-5 blur-xl"></div>
                <div className="bg-linear-to-b from-foreground rotate-66 absolute inset-0 z-10 mx-auto w-16 -translate-y-32 translate-x-44 rounded-full opacity-20 blur-2xl"></div>
                <div className="bg-foreground/5 border-foreground/5 rounded-[15px] border p-0.5">
                    <div className="bg-background sm:aspect-3/2 ring-foreground/10 relative aspect-square origin-top overflow-hidden rounded-xl p-1 pl-3 shadow ring-1">
                        <Image
                            className="object-top-left size-full object-cover"
                            src="https://res.cloudinary.com/dohqjvu9k/image/upload/v1757920811/circle-dark_cv2taw.png"
                            alt="product illustration"
                            width={1123}
                            height={748}
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1123px"
                            priority
                            fetchPriority="high"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}