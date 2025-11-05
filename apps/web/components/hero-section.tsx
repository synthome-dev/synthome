import HeroHeader from "@/components/header";
import { ImageIllustration } from "@/components/image-illustration";

export default function HeroSection() {
  return (
    <>
      {/* <HeroHeader /> */}
      <main role="main" className="overflow-hidden">
        <section>
          <div className="bg-muted pt-32">
            <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-12">
              <div className="text-center">
                <h1 className="text-foreground mx-auto text-balance text-5xl font-semibold lg:text-6xl xl:text-7xl xl:tracking-tight">
                  Composable AI Media Toolkit
                </h1>

                <div className="mx-auto mb-20 mt-4 max-w-3xl">
                  <p className="text-muted-foreground mb-6 text-balance text-lg lg:text-xl">
                    Build flexible AI video workflows by combining text-to-video
                    and image-to-video models, captions, sound effects, and
                    seamless scene merging.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <ImageIllustration />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
