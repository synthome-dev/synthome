import { FAQs } from "@/app/(marketing)/pricing/sections/faqs";
import { Pricing } from "@/app/(marketing)/pricing/sections/pricing";

export default function PricingPage() {
  return (
    <>
      <section id="home" className="bg-muted/50">
        <div className="relative mx-auto max-w-5xl px-6 pt-32 text-center sm:pt-44 pb-24">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-foreground text-balance text-5xl font-semibold sm:text-6xl lg:tracking-tight">
              Start free, pay as you grow
            </h1>
            <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-balance text-lg">
              Everything you need to build AI media pipelines
            </p>
          </div>
        </div>
      </section>
      <Pricing />
      {/* <Testimonial />
      <Comparator /> */}
      <FAQs />
    </>
  );
}
