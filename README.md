<p align="center">
  <img src="apps/web/public/favicon.svg" alt="Synthome" width="80" height="80" />
</p>

<h1 align="center">Synthome</h1>

<p align="center">
  Composable AI media pipelines.
</p>

<p align="center">
  <a href="https://synthome.dev">Website</a> • <a href="https://synthome.dev/docs">Documentation</a> • <a href="https://discord.gg/4TdA9UPeJe">Discord</a>
</p>

---

## What is Synthome?

Synthome is the simplest way to build **multi-model AI media workflows** — all in TypeScript.

AI video and image models behave differently across providers.
Different inputs, different outputs, different response formats, different async handling.
Building even a simple pipeline becomes a mess of glue code, retries, polling, and media stitching.

Synthome standardizes all of this.

**You write a clean pipeline → Synthome handles:**

- Model invocation (Fal, Replicate, ElevenLabs, Hume, etc.)
- Async job execution & retries
- Media storage
- Input/output normalization
- Multi-step orchestration
- JSON-defined pipelines (AI-generated or manual)

It’s like **OpenRouter, but for AI media pipelines** — and fully composable.

### Try in 5 Minutes (Getting Started)

1. Create your API key at [synthome.dev](https://synthome.dev)
2. Install the SDK

```bash
npm install @synthome/sdk
```

3. Read the docs https://synthome.dev/docs

### FAQ

#### How is this different from using Replicate/Fal directly?

Synthome orchestrates multi-step pipelines across providers. Instead of manually chaining API calls, handling webhooks, and stitching media together, you compose operations declaratively and Synthome handles the execution, polling, and media processing.

#### Can I bring my own API keys?

Yes. You provide your own Replicate, Fal, ElevenLabs, etc. keys. Synthome orchestrates the pipeline but doesn't proxy your provider costs.

### Contributing

We're still working on our contribution guide. Reach out to us on [Discord](https://discord.gg/4TdA9UPeJe) if you'd like to contribute.

---

**Join the community** [Discord](https://discord.gg/4TdA9UPeJe) | [X](https://x.com/ddubovetzky)
