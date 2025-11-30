import Header from "@/components/header";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8 ">
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground mb-8">
            Last updated: November 29, 2025
          </p>

          <p className="text-base leading-relaxed mb-8">
            This Privacy Policy describes how MaitoAI, LLC ("Synthome", "we",
            "our") handles information when you use synthome.dev, our SDK, and
            APIs (the "Service").
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">About Us</h2>
            <p className="mb-3">
              MaitoAI, LLC is a Delaware limited liability company. Our address
              is 1111b South Governors Ave STE 25502, Dover, DE 19904, United
              States. You can reach us at{" "}
              <a
                href="mailto:support@synthome.dev"
                className="text-primary hover:underline"
              >
                support@synthome.dev
              </a>
              .
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">
              Information We Collect
            </h2>

            <h3 className="text-lg font-semibold mb-2 mt-6">
              Account Information
            </h3>
            <p className="mb-3">
              When you create an organization account, we collect names, email
              addresses, and authentication credentials for you and your team
              members. Authentication is handled through Clerk.
            </p>

            <h3 className="text-lg font-semibold mb-2 mt-6">Billing Data</h3>
            <p className="mb-3">
              Stripe processes your payments. We receive subscription status,
              usage counts, and billing history. We do not store credit card
              numbers.
            </p>

            <h3 className="text-lg font-semibold mb-2 mt-6">Usage Data</h3>
            <p className="mb-3">
              We track API calls, pipeline executions, and feature usage to
              calculate billing and improve the Service. This includes
              timestamps, model selections, and operation types.
            </p>

            <h3 className="text-lg font-semibold mb-2 mt-6">
              Content You Process
            </h3>
            <p className="mb-3">
              When you run pipelines, we temporarily process your prompts,
              uploaded media, and configuration. Generated outputs are stored
              either on Synthome storage or your own S3-compatible CDN,
              depending on your configuration.
            </p>

            <h3 className="text-lg font-semibold mb-2 mt-6">
              Provider API Keys
            </h3>
            <p className="mb-3">
              If you add API keys for providers like Replicate, Fal, ElevenLabs,
              or Hume, we store them encrypted and use them only to execute your
              pipelines.
            </p>

            <h3 className="text-lg font-semibold mb-2 mt-6">Technical Data</h3>
            <p className="mb-3">
              We automatically collect IP addresses, browser information, and
              device data for security and debugging purposes.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">
              How We Use Your Data
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Execute your AI media pipelines</li>
              <li>Calculate and process billing</li>
              <li>Provide customer support</li>
              <li>Secure accounts and prevent abuse</li>
              <li>Improve and debug the Service</li>
              <li>Send service-related communications</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">AI Model Providers</h2>
            <p className="mb-3">
              To generate media, we send your prompts and inputs to AI providers
              you select (Replicate, Fal, ElevenLabs, Hume, Google Cloud). Each
              provider has its own privacy practices. We configure providers to
              not train on your data where that option exists, but you should
              review their policies.
            </p>
            <p>We do not use your content to train any models.</p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Data Sharing</h2>
            <p className="mb-3">We share data with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Service providers:</strong> Clerk (authentication),
                Stripe (payments), and infrastructure providers
              </li>
              <li>
                <strong>AI providers:</strong> The providers you configure for
                pipeline execution
              </li>
              <li>
                <strong>Legal requirements:</strong> When required by law or to
                protect rights and safety
              </li>
            </ul>
            <p className="mt-3">We do not sell your data.</p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Data Storage</h2>
            <p className="mb-3">
              We process and store data in the United States. Account data is
              retained while your account is active and for a reasonable period
              after closure. Pipeline outputs stored on Synthome storage can be
              deleted by you at any time. Logs are retained for up to 180 days.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Security</h2>
            <p>
              We use encryption in transit and at rest, access controls, and
              secure credential storage. No system is perfectly secure, but we
              take reasonable measures to protect your data.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
            <p className="mb-3">
              Depending on your location, you may have rights to access,
              correct, delete, or export your data. Contact us at{" "}
              <a
                href="mailto:support@synthome.dev"
                className="text-primary hover:underline"
              >
                support@synthome.dev
              </a>{" "}
              to make a request.
            </p>
            <p>
              For business customers needing a Data Processing Agreement,
              contact us at the same address.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Cookies</h2>
            <p>
              We use essential cookies for authentication and site
              functionality. We may use analytics cookies to understand how the
              Service is used.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Children</h2>
            <p>
              The Service is not intended for anyone under 13. We do not
              knowingly collect data from children.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Changes</h2>
            <p>
              We may update this policy. Material changes will be communicated
              via email or through the Service before taking effect.
            </p>
          </section>

          <section className="mb-10">
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
