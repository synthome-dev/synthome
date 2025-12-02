import { Container } from "@/components/container";
import { Hulu } from "@/components/ui/svgs/hulu";
import { Stripe } from "@/components/ui/svgs/stripe";
import { TailwindcssWordmark as Tailwindcss } from "@/components/ui/svgs/tailwindcssWordmark";
import {
    ADAM_AVATAR,
    BERNARD_AVATAR,
    GLODIE_AVATAR,
    MESCHAC_AVATAR,
    SHADCN_AVATAR,
    THEO_AVATAR,
} from "@/lib/const";

const TESTIMONIALS = [
  {
    name: "Meschac Irung",
    role: "Frontend Engineer, Hulu",
    avatar: MESCHAC_AVATAR,
    testimonial:
      "Integrating Tailark into our streaming platform was seamless. The performance gains were immediate, and our user engagement metrics have increased by 25% since implementation.",
  },
  {
    name: "Bernard Ngandu",
    role: "Backend, Stripe",
    avatar: BERNARD_AVATAR,
    testimonial:
      "As a payment processor, security and reliability are paramount. Tailark delivers on both fronts, with robust testing capabilities that have helped us identify and resolve edge cases before deployment.",
  },
  {
    name: "Glodie Lukose",
    role: "Engineer, Prime Video",
    avatar: GLODIE_AVATAR,
    testimonial:
      "The A/B testing capabilities have revolutionized how we roll out new features. We can now make data-driven decisions with confidence, leading to a 30% improvement in user retention.",
  },
  {
    name: "Theo Balick",
    role: "CTO, Tailark",
    avatar: THEO_AVATAR,
    testimonial:
      "Building Tailark has been a journey of continuous improvement. Seeing how our platform empowers developers to create better user experiences makes all the hard work worthwhile.",
  },
];

export function TestimonialsSection() {
  return (
    <section>
      <Container>
        <div className="mx-auto w-full max-w-5xl px-6 xl:px-0">
          <div className="mx-auto max-w-2xl space-y-4 text-center">
            <span className="text-foreground font-mono text-sm uppercase">
              Testimonials
            </span>
            <h2 className="text-foreground mt-6 text-balance text-4xl font-semibold lg:text-5xl">
              What our customers are saying about Synthome
            </h2>
            <p className="text-muted-foreground text-balance text-lg">
              Join the increasing number of customers and advocates who rely on
              Tailark for seamless and effective user A/B testing.
            </p>
          </div>
        </div>
      </Container>
      <Container className="**:data-[slot=content]:py-0">
        <div className="lg:*:nth-4:rounded-r-none lg:*:nth-5:rounded-br-none lg:*:nth-6:rounded-b-none lg:*:nth-5:rounded-tl-none lg:*:nth-3:rounded-l-none lg:*:nth-2:rounded-tl-none lg:*:nth-2:rounded-br-none lg:*:nth-1:rounded-t-none grid gap-4 sm:grid-cols-2 sm:grid-rows-4 lg:grid-cols-3 lg:grid-rows-3 lg:gap-px">
          {TESTIMONIALS.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              name={testimonial.name}
              role={testimonial.role}
              avatar={testimonial.avatar}
              testimonial={testimonial.testimonial}
            />
          ))}

          <div className="bg-card ring-foreground/5 row-start-1 flex flex-col justify-between gap-8 border border-transparent p-8 shadow-lg ring-1 lg:col-start-1">
            <div className="space-y-6">
              <Tailwindcss height={20} width={136} />
              <p className="text-balance text-lg">
                "We've streamlined our entire design process thanks to Tailark.
                The platform allows us to iterate faster and optimize our
                component library, leading to a more consistent user experience
                across all our projects."
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="ring-foreground/10 aspect-square size-9 overflow-hidden rounded-lg border border-transparent shadow-md shadow-black/15 ring-1">
                <img
                  src={ADAM_AVATAR}
                  alt="Adam Wathan"
                  className="h-full w-full object-cover"
                  width={460}
                  height={460}
                  loading="lazy"
                />
              </div>
              <div className="space-y-px">
                <p className="text-sm font-medium">Adam Wathan</p>
                <p className="text-muted-foreground text-xs">
                  CEO, Tailwind Labs
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card ring-foreground/5 row-start-3 flex flex-col justify-between gap-8 border border-transparent p-8 shadow-lg ring-1 sm:col-start-2 lg:row-start-2">
            <div className="space-y-6">
              <Hulu height={20} width={56} />
              <p className="text-balance text-lg">
                "Tailark has transformed how we approach frontend development at
                Hulu. The testing framework helped us reduce bugs by 40% and
                accelerated our feature deployment pipeline significantly."
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="ring-foreground/10 aspect-square size-9 overflow-hidden rounded-lg border border-transparent shadow-md shadow-black/15 ring-1">
                <img
                  src={SHADCN_AVATAR}
                  alt="Shadcn"
                  className="h-full w-full object-cover"
                  width={460}
                  height={460}
                  loading="lazy"
                />
              </div>
              <div className="space-y-px">
                <p className="text-sm font-medium">Shadcn</p>
                <p className="text-muted-foreground text-xs">
                  Frontend Engineer, Hulu
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card ring-foreground/5 flex flex-col justify-between gap-8 border border-transparent p-8 shadow-lg ring-1 sm:row-start-2 lg:col-start-3 lg:row-start-3 lg:rounded-bl-none lg:rounded-tr-none">
            <div className="space-y-6">
              <Stripe height={24} width={56} />
              <p className="text-balance text-lg">
                "The analytics dashboard in Tailark gives us unprecedented
                visibility into user behavior. We've been able to make targeted
                improvements that increased our conversion rates by 18%."
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="ring-foreground/10 aspect-square size-9 overflow-hidden rounded-lg border border-transparent shadow-md shadow-black/15 ring-1">
                <img
                  src={GLODIE_AVATAR}
                  alt="Glodie Lukose"
                  className="h-full w-full object-cover"
                  width={460}
                  height={460}
                  loading="lazy"
                />
              </div>
              <div className="space-y-px">
                <p className="text-sm font-medium">Glodie Lukose</p>
                <p className="text-muted-foreground text-xs">
                  Engineer, Stripe
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

type TestimonialCardProps = {
  name: string;
  role: string;
  avatar: string;
  testimonial: string;
};

const TestimonialCard = ({
  name,
  role,
  avatar,
  testimonial,
}: TestimonialCardProps) => {
  return (
    <div className="ring-foreground/5 flex flex-col justify-end gap-8 border border-transparent p-8 ring-1">
      <p className='text-foreground self-end text-balance text-lg before:mr-1 before:content-["\201C"] after:ml-1 after:content-["\201D"]'>
        {testimonial}
      </p>
      <div className="flex items-center gap-3">
        <div className="ring-foreground/10 aspect-square size-9 overflow-hidden rounded-lg border border-transparent shadow-md shadow-black/15 ring-1">
          <img
            src={avatar}
            alt={name}
            className="h-full w-full object-cover"
            width={460}
            height={460}
            loading="lazy"
          />
        </div>
        <div className="space-y-px">
          <p className="text-sm font-medium">{name}</p>
          <p className="text-muted-foreground text-xs">{role}</p>
        </div>
      </div>
    </div>
  );
};
