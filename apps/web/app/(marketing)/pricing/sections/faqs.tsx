import { Container } from "@/components/container";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";

export function FAQs() {
  const faqItems = [
    {
      group: "Pricing & Billing",
      items: [
        {
          id: "pricing-1",
          question: "What counts as an action?",
          answer:
            "An action is any individual operation in your pipeline - generating a video, generating an image, generating audio, merging videos, adding captions, or applying layers. For example, a pipeline that generates 2 videos, merges them, and adds captions would count as 4 actions.",
        },
        {
          id: "pricing-2",
          question: "What happens if I exceed my action limit on the Pro plan?",
          answer:
            "On the Pro plan, you get 10,000 actions included. If you exceed this limit, we charge $5 per 1,000 additional actions. You'll never be cut off mid-project - we'll notify you when you're approaching your limit.",
        },
        {
          id: "pricing-3",
          question: "Can I use the Free plan for production?",
          answer:
            "Yes! The Free plan includes 10GB storage, access to all AI models, and full SDK access. It's designed for developers to build and ship real products. The only difference with Pro is the included actions and overage pricing.",
        },
      ],
    },
    {
      group: "Models & Providers",
      items: [
        {
          id: "models-1",
          question: "What if I need a model you don't support yet?",
          answer:
            "If we're missing a model from a provider we already support, just request it and we'll add it within 48 hours. For new providers, reach out to discuss integration timelines.",
        },
        {
          id: "models-2",
          question: "Can I use my own API keys?",
          answer:
            "Yes, we support Bring Your Own Keys (BYOK). You can use your own API keys from providers like Replicate, Fal, ElevenLabs, and Hume. Configure them in the dashboard or pass them directly in your code.",
        },
        {
          id: "models-3",
          question: "Can I switch providers without changing my code?",
          answer:
            "Yes. Our unified API abstracts away provider differences. If the same model is available on multiple providers, you can switch between them without rewriting your pipeline logic.",
        },
      ],
    },
    {
      group: "Platform & Features",
      items: [
        {
          id: "platform-1",
          question: "How does storage work?",
          answer:
            "You get 10GB of cloud storage on the Free plan. You can also connect your own S3-compatible storage (Cloudflare R2, Amazon S3, etc.) to have results uploaded directly to your bucket with permanent URLs.",
        },
        {
          id: "platform-2",
          question: "Do you support webhooks?",
          answer:
            "Yes, webhooks are available on all plans. When your pipeline completes, we'll send a POST request to your specified URL with the results. We use HMAC-SHA256 signature verification for security.",
        },
        {
          id: "platform-3",
          question: "Can I use this with AI agents?",
          answer:
            "Absolutely. Pipelines can be exported as JSON execution plans, which AI agents can generate dynamically. Use executeFromPlan() to run these plans directly - perfect for content generation at scale.",
        },
      ],
    },
  ];

  return (
    <section id="faqs">
      <Container className="md:**:data-[slot=content]:py-0 border-b-dashed mt-2 border-b">
        <div className="grid max-md:gap-8 md:grid-cols-5 md:divide-x">
          <div className="max-w-lg max-md:px-6 md:col-span-2 md:p-10 lg:p-12">
            <h2 className="text-foreground text-4xl font-semibold">FAQs</h2>
            <p className="text-muted-foreground mt-4 text-balance text-lg">
              Your questions answered
            </p>
            <p className="text-muted-foreground mt-6 max-md:hidden">
              Can't find what you're looking for? Contact our{" "}
              <Link
                href="#"
                className="text-primary font-medium hover:underline"
              >
                customer support team
              </Link>
            </p>
          </div>

          <div className="space-y-12 md:col-span-3 md:px-4 md:pb-4 md:pt-10 lg:pt-12">
            {faqItems.map((item) => (
              <div className="space-y-4" key={item.group}>
                <h3 className="text-foreground pl-6 text-lg font-semibold">
                  {item.group}
                </h3>
                <Accordion type="single" collapsible className="-space-y-1">
                  {item.items.map((item) => (
                    <AccordionItem
                      key={item.id}
                      value={item.id}
                      className="data-[state=open]:bg-card data-[state=open]:ring-foreground/5 group peer rounded-xl border-none px-6 py-1 data-[state=open]:border-none data-[state=open]:shadow data-[state=open]:ring-1"
                    >
                      <AccordionTrigger className="not-group-last:border-b cursor-pointer rounded-none text-base transition-none hover:no-underline data-[state=open]:border-transparent hover:[&>svg]:translate-y-1 hover:data-[state=open]:[&>svg]:translate-y-0">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground text-base">
                          {item.answer}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </div>

        <p className="text-muted-foreground mt-12 px-6 md:hidden">
          Can't find what you're looking for? Contact our{" "}
          <Link href="#" className="text-primary font-medium hover:underline">
            customer support team
          </Link>
        </p>
      </Container>
       
    </section>
  );
}
