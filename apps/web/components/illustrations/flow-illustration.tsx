import { ScanIllustration } from '@/components/illustrations/scan-illustration'
import Image from 'next/image'

export const FlowIllustration = () => {
    return (
        <div
            aria-hidden
            className="scale-85 relative h-fit">
            <div className="bg-linear-to-r/increasing absolute -inset-x-8 bottom-0 top-1/3 aspect-square rounded-full from-purple-300 via-amber-300 to-red-200 opacity-25 blur-xl [clip-path:inset(-25%_0_74%_0)]" />
            <div className="z-1 bg-card mask-b-from-25% mask-b-to-35% border-foreground/10 absolute -inset-x-8 bottom-0 top-1/3 aspect-square rounded-full border-x border-t"></div>

            <div className="z-2 relative mx-auto flex items-center justify-center gap-6">
                <div className="bg-radial -rotate-16 relative aspect-square w-24 opacity-75 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] group-hover:opacity-95">
                    <Image
                        src="https://res.cloudinary.com/dohqjvu9k/image/upload/v1757918276/portrait_vsoxqd.jpg"
                        alt="tailark hero section portrait"
                        className="size-full object-cover"
                        width={200}
                        height={133}
                    />
                </div>
                <div className="bg-card ring-border-illustration flex w-40 min-w-40 flex-col items-center justify-center overflow-hidden rounded-xl shadow-md ring-1">
                    <ScanIllustration />
                </div>
                <div className="bg-radial rotate-16 relative aspect-square w-24 opacity-75 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] group-hover:opacity-95">
                    <Image
                        src="https://res.cloudinary.com/dohqjvu9k/image/upload/v1757918276/portrait_vsoxqd.jpg"
                        alt="tailark hero section portrait"
                        className="size-full object-cover"
                        width={200}
                        height={133}
                    />
                </div>
            </div>
        </div>
    )
}