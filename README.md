<p align="center">
  <img src="apps/web/public/favicon.svg" alt="Synthome" width="80" height="80" />
</p>

<h1 align="center">Synthome</h1>

<p align="center">
  Composable AI video pipelines.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@synthome/sdk"><img src="https://img.shields.io/npm/v/@synthome/sdk?style=flat-square" alt="npm"></a>
  <a href="https://discord.gg/4TdA9UPeJe"><img src="https://img.shields.io/discord/1444715314356158488?style=flat-square&label=discord" alt="Discord"></a>
  <a href="https://github.com/synthome-dev/synthome/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-blue?style=flat-square" alt="License"></a>
</p>

---

### Getting Started

1. Create your API key at [synthome.dev](https://synthome.dev)
2. Install the SDK

```bash
npm install @synthome/sdk
```

3. Read the [documentation](https://synthome.dev/docs)

### FAQ

#### How is this different from using Replicate/Fal directly?

Synthome orchestrates multi-step pipelines across providers. Instead of manually chaining API calls, handling webhooks, and stitching media together, you compose operations declaratively and Synthome handles the execution, polling, and media processing.

#### Can I bring my own API keys?

Yes. You provide your own Replicate, Fal, ElevenLabs, etc. keys. Synthome orchestrates the pipeline but doesn't proxy your provider costs.

### Contributing

We're still working on our contribution guide. Reach out to us on [Discord](https://discord.gg/4TdA9UPeJe) if you'd like to contribute.

---

**Join the community** [Discord](https://discord.gg/4TdA9UPeJe) | [X](https://x.com/ddubovetzky)
