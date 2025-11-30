import Header from "@/components/header";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8 ">
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <header className="mb-12 border-b border-border pb-8">
            <h1 className="text-4xl font-bold tracking-tight">
              Terms of Service
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Last updated: November 29, 2025
            </p>
          </header>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Agreement</h2>
            <p className="mb-4">
              These Terms govern your use of Synthome (synthome.dev), operated
              by MaitoAI, LLC, a Delaware company located at 1111b South
              Governors Ave STE 25502, Dover, DE 19904, United States.
            </p>
            <p>
              By creating an account or using our SDK and APIs, you agree to
              these Terms on behalf of your organization.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">The Service</h2>
            <p>
              Synthome provides a TypeScript SDK and API for building AI media
              pipelines. You can generate videos, images, and audio using
              various AI models, then combine them through operations like
              merging, layering, and captioning. We handle the orchestration,
              job management, and delivery of results to your storage or ours.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Accounts</h2>
            <p className="mb-4">
              Synthome accounts are organization-based. You can invite team
              members to your organization. The person who creates the account
              is responsible for all activity within the organization, including
              actions taken by team members.
            </p>
            <p>
              You must be at least 13 years old to use Synthome. If you are
              under 18, you need parental consent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Pricing and Payment</h2>
            <p className="mb-4">
              Synthome offers a free tier with 200 actions per month. Paid plans
              start at $50/month, which includes 10,000 actions. Additional
              usage is billed at $5 per 1,000 actions, charged at the end of
              your billing cycle.
            </p>
            <p className="mb-4">
              Subscriptions renew automatically each month. You can cancel
              anytime from your dashboard. Cancellation stops future charges but
              does not refund the current billing period.
            </p>
            <p>
              Payments are processed by Stripe. Prices do not include taxes,
              which may be added based on your location.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">AI Providers</h2>
            <p className="mb-4">
              Synthome orchestrates AI models from third-party providers
              including Replicate, Fal, ElevenLabs, Hume, and Google Cloud. You
              can use your own API keys for these providers or rely on
              Synthome's accounts where available.
            </p>
            <p>
              Each provider has its own terms of service. You are responsible
              for complying with them. We are not liable for provider outages,
              rate limits, or policy changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Content</h2>
            <p className="mb-4">
              You own what you create. The prompts, media, and outputs you
              generate through Synthome belong to you, subject to any rights
              held by third parties (like voices or images you use as inputs).
            </p>
            <p className="mb-4">
              You grant us permission to process your content as needed to
              provide the Service. We do not use your content to train models or
              for marketing without your permission.
            </p>
            <p>
              You are responsible for having the rights to any content you
              upload, including voices, likenesses, and copyrighted material.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Storage</h2>
            <p>
              Generated outputs can be stored on Synthome's infrastructure or
              uploaded directly to your S3-compatible storage (like Cloudflare
              R2 or Amazon S3). Content on Synthome storage can be deleted by
              you at any time. We do not guarantee indefinite storage.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Acceptable Use</h2>
            <p className="mb-4">Do not use Synthome to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Generate illegal content or content that exploits minors</li>
              <li>
                Create deceptive deepfakes or impersonate people without consent
              </li>
              <li>
                Produce harassment, hate speech, or content inciting violence
              </li>
              <li>Infringe copyrights, trademarks, or other rights</li>
              <li>Circumvent security measures or abuse the API</li>
              <li>Resell access to the Service without authorization</li>
            </ul>
            <p className="mt-4">
              We may suspend or terminate accounts that violate these rules.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">AI Limitations</h2>
            <p>
              AI-generated content may be inaccurate, biased, or unexpected.
              Review outputs before publishing or using them in production. We
              do not guarantee specific results, quality, or accuracy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Availability</h2>
            <p>
              We work to keep Synthome available but cannot guarantee
              uninterrupted service. Maintenance, provider issues, or unforeseen
              problems may cause downtime.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Intellectual Property
            </h2>
            <p>
              Synthome's SDK, APIs, documentation, and branding belong to us.
              You may use our SDK under its license terms. You may not copy,
              reverse engineer, or resell our software.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Copyright Claims</h2>
            <p>
              If you believe content on Synthome infringes your copyright, email{" "}
              <a
                href="mailto:support@synthome.dev"
                className="text-primary hover:underline"
              >
                support@synthome.dev
              </a>{" "}
              with details of the work, location of the infringing content, and
              your contact information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Liability</h2>
            <p className="mb-4">
              Synthome is provided "as is" without warranties. We disclaim all
              implied warranties including merchantability and fitness for a
              particular purpose.
            </p>
            <p className="mb-4">
              We are not liable for indirect, incidental, or consequential
              damages. Our total liability is limited to the amount you paid us
              in the 12 months before the claim arose.
            </p>
            <p>These limitations do not apply where prohibited by law.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Indemnification</h2>
            <p>
              You agree to indemnify us against claims arising from your
              content, your use of the Service, or your violation of these
              Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Termination</h2>
            <p>
              You can close your account anytime. We may suspend or terminate
              accounts for violations, non-payment, or if required by law. On
              termination, your right to use the Service ends, but provisions
              that should survive (like liability limits) will continue.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Changes</h2>
            <p>
              We may update these Terms. Material changes will be communicated
              at least 30 days before taking effect. Continued use after changes
              means you accept them.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Legal</h2>
            <p className="mb-4">
              These Terms are governed by Delaware law. Disputes will be
              resolved in Delaware courts.
            </p>
            <p className="mb-4">
              If any part of these Terms is unenforceable, the rest remains in
              effect. These Terms are the complete agreement between you and
              Synthome.
            </p>
            <p>
              You cannot transfer your rights under these Terms without our
              consent. We may transfer ours in connection with a company sale or
              reorganization.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact</h2>
            <p>
              Questions? Email{" "}
              <a
                href="mailto:support@synthome.dev"
                className="text-primary hover:underline"
              >
                support@synthome.dev
              </a>{" "}
              or write to MaitoAI, LLC, 1111b South Governors Ave STE 25502,
              Dover, DE 19904, United States.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
