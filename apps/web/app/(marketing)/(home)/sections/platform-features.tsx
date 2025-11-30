"use client";

import CodeBlock from "@/components/code-block";
import { Container } from "@/components/container";
import { Amazon } from "@/components/ui/svgs/amazon";
import { ClaudeAiIcon } from "@/components/ui/svgs/claudeAiIcon";
import { Cloudflare } from "@/components/ui/svgs/cloudflare";
import { Openai } from "@/components/ui/svgs/openai";
import { FALIcon, Replicate } from "@/components/ui/svgs/provider-icons";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

export function PlatformFeatures() {
  return (
    <section>
      <style jsx>{`
        @keyframes beam-move {
          to {
            stroke-dashoffset: -780;
          }
        }

        @keyframes beam-move-down {
          to {
            stroke-dashoffset: 780;
          }
        }
      `}</style>
      <Container className="**:data-[slot=content]:py-0 border-dashed">
        <div className="relative bg-background">
          <div className=" @4xl:grid-cols-2 @4xl:*:p-8 @5xl:*:p-12 @max-4xl:divide-y @4xl:divide-x grid border-b *:p-4">
            <div className="row-span-2 grid grid-rows-subgrid gap-8">
              <div className="relative self-center mx-auto max-w-xs sm:max-w-sm">
                <CodeBlock
                  lineNumbers
                  code={`await compose(
  generateVideo({
    model: videoModel("bytedance/seedance-1-pro", "replicate"),
    image: generateImage({
      model: imageModel("google/nano-banana", "replicate"),
      prompt: "A scenic view of mountains during sunrise",
    })
  })
)`}
                  lang="typescript"
                  maxHeight={360}
                  className="[&_pre]:h-20 [&_pre]:min-h-[14.3rem] [&_pre]:rounded-xl [&_pre]:border-none [&_pre]:!bg-transparent ring ring-foreground/5 shadow-md shadow-black/5 rounded-2xl no-scrollbar"
                />
              </div>
              <div className="mx-auto max-w-sm">
                <h3 className="text-balance font-semibold">Compose</h3>
                <p className="text-muted-foreground mt-3 text-balance">
                  One model's output becomes the next model's input. Build
                  multi-step pipelines in one call.
                </p>
              </div>
            </div>
            <div className="row-span-2 grid grid-rows-subgrid gap-8">
              <div className="@4xl:px-8 mx-auto w-full max-w-md self-center">
                <div className="flex items-center justify-center">
                  <div
                    aria-hidden
                    className="flex items-center gap-3 max-sm:hidden"
                  >
                    <div className="bg-border-illustration h-px w-6" />

                    <div className="ml-auto h-4 w-6 bg-[repeating-linear-gradient(45deg,var(--color-border-illustration),var(--color-border-illustration)_1px,transparent_1px,transparent_6px)]" />
                    <div className="ring-border-illustration bg-card size-2 rotate-45 ring-1" />
                  </div>

                  <div className="mx-auto hidden w-fit scale-75 rounded-xl border p-1">
                    <div className="bg-background ring-foreground/5 grid grid-rows-[auto_1fr_auto] rounded-lg p-2 shadow-md ring-1">
                      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1">
                        <div className="flex size-2">
                          <div className="bg-foreground m-auto size-0.5 rounded-full"></div>
                        </div>
                        <div className="h-2 bg-[repeating-linear-gradient(90deg,var(--color-border-illustration),var(--color-border-illustration)_2px,transparent_2px,transparent_6px)]"></div>
                        <div className="flex size-2">
                          <div className="bg-foreground m-auto size-0.5 rounded-full"></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-[auto_1fr_auto]">
                        <div className="w-2 bg-[repeating-linear-gradient(var(--color-border-illustration),var(--color-border-illustration)_2px,transparent_2px,transparent_6px)]"></div>
                        <div className="p-2">
                          <div className="bg-muted size-16 rounded-2xl border p-1">
                            <div className="ring-foreground/10 inset-shadow-sm inset-shadow-white bg-linear-to-b flex size-full rounded-[12px] from-emerald-50 to-indigo-200 shadow-xl shadow-indigo-600/35 ring-1"></div>
                          </div>
                        </div>
                        <div className="w-2 bg-[repeating-linear-gradient(var(--color-border-illustration),var(--color-border-illustration)_2px,transparent_2px,transparent_6px)]"></div>
                      </div>
                      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1">
                        <div className="flex size-2">
                          <div className="bg-foreground m-auto size-0.5 rounded-full"></div>
                        </div>
                        <div className="h-2 bg-[repeating-linear-gradient(90deg,var(--color-border-illustration),var(--color-border-illustration)_2px,transparent_2px,transparent_6px)]"></div>
                        <div className="flex size-2">
                          <div className="bg-foreground m-auto size-0.5 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mx-auto w-fit rounded-xl border p-1">
                    <div className="bg-background ring-foreground/5 grid grid-rows-[auto_1fr_auto] rounded-lg p-1 shadow-md ring-1">
                      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1">
                        <div className="flex size-2">
                          <div className="bg-foreground size-0.75 m-auto rounded-full"></div>
                        </div>
                        <div className="h-1 bg-[repeating-linear-gradient(90deg,var(--color-border-illustration),var(--color-border-illustration)_2px,transparent_2px,transparent_6px)]"></div>
                        <div className="flex size-2">
                          <div className="bg-foreground size-0.75 m-auto rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center px-2 py-1">
                        <span className="font-mono text-xs">Synthome</span>
                      </div>
                      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1">
                        <div className="flex size-2">
                          <div className="bg-foreground size-0.75 m-auto rounded-full"></div>
                        </div>
                        <div className="h-1 bg-[repeating-linear-gradient(90deg,var(--color-border-illustration),var(--color-border-illustration)_2px,transparent_2px,transparent_6px)]"></div>
                        <div className="flex size-2">
                          <div className="bg-foreground size-0.75 m-auto rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    aria-hidden
                    className="flex items-center gap-3 max-sm:hidden"
                  >
                    <div className="ring-border-illustration bg-card size-2 rotate-45 ring-1" />
                    <div className="ml-auto h-4 w-6 bg-[repeating-linear-gradient(0deg,var(--color-border-illustration),var(--color-border-illustration)_1px,transparent_1px,transparent_6px)]" />
                    <div className="bg-border-illustration h-px w-6" />
                  </div>
                </div>
                <div className="relative mx-auto flex w-14 justify-center">
                  <svg
                    width="48"
                    height="84"
                    viewBox="0 0 48 84"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute inset-0 mx-auto w-fit"
                  >
                    <path
                      d="M12 0L12 61.395C12 62.4251 11.6026 63.4155 10.8906 64.1599L2.10943 73.3401C1.3974 74.0845 0.999999 75.0749 0.999999 76.105L0.999998 84"
                      stroke="var(--color-white)"
                      className="drop-shadow-emerald-100 drop-shadow-xs animate-[beam-move_4.4s_linear_infinite]"
                      strokeLinecap="round"
                      strokeDasharray="42 278"
                    />
                    <path
                      d="M24 0L24 63L24 74.5L24 84"
                      stroke="var(--color-white)"
                      className="drop-shadow-blue-100 drop-shadow-xs animate-[beam-move_5.4s_linear_infinite] delay-[1s]"
                      strokeLinecap="round"
                      strokeDasharray="42 278"
                    />
                    <path
                      d="M47.0078 84L47.0078 52.3045C47.0078 51.2414 46.5846 50.222 45.8316 49.4714L37.1771 40.8452C36.4241 40.0947 36.0009 39.0753 36.0009 38.0121L36.0009 2.07412e-06"
                      stroke="var(--color-white)"
                      className="drop-shadow-purple-300 drop-shadow-xs animate-[beam-move_5.4s_linear_infinite] delay-[2s]"
                      strokeLinecap="round"
                      strokeDasharray="42 278"
                    />
                  </svg>

                  <svg
                    width="48"
                    height="84"
                    viewBox="0 0 48 84"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 0L12 61.395C12 62.4251 11.6026 63.4155 10.8906 64.1599L2.10943 73.3401C1.3974 74.0845 0.999999 75.0749 0.999999 76.105L0.999998 84"
                      stroke="var(--border-illustration)"
                    />
                    <path
                      d="M24 0L24 63L24 74.5L24 84"
                      stroke="var(--border-illustration)"
                    />
                    <path
                      d="M47.0078 84L47.0078 52.3045C47.0078 51.2414 46.5846 50.222 45.8316 49.4714L37.1771 40.8452C36.4241 40.0947 36.0009 39.0753 36.0009 38.0121L36.0009 2.07412e-06"
                      stroke="var(--border-illustration)"
                    />
                  </svg>
                </div>
                <div className="relative flex items-center justify-center">
                  <div className="z-1 relative mx-auto w-fit rounded-xl border p-1">
                    <div className="bg-background ring-foreground/5 grid grid-rows-[auto_1fr_auto] rounded-lg p-1 shadow-md ring-1">
                      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1">
                        <div className="flex size-2">
                          <div className="bg-foreground size-0.75 m-auto rounded-full"></div>
                        </div>
                        <div className="h-1 bg-[repeating-linear-gradient(90deg,var(--color-border-illustration),var(--color-border-illustration)_2px,transparent_2px,transparent_6px)]"></div>
                        <div className="flex size-2">
                          <div className="bg-foreground size-0.75 m-auto rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center px-2">
                        <span className="flex items-center gap-2 font-mono text-xs">
                          <span>Providers</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1">
                        <div className="flex size-2">
                          <div className="bg-foreground size-0.75 m-auto rounded-full"></div>
                        </div>
                        <div className="h-1 bg-[repeating-linear-gradient(90deg,var(--color-border-illustration),var(--color-border-illustration)_2px,transparent_2px,transparent_6px)]"></div>
                        <div className="flex size-2">
                          <div className="bg-foreground size-0.75 m-auto rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 mx-auto max-w-sm">
                <h3 className="text-balance font-semibold">Orchestration</h3>
                <p className="text-muted-foreground mt-3 text-balance">
                  We handle dependencies, retries, and execution order. You
                  define the pipeline.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:*:nth-3:border-r-0 @4xl:*:p-8 @5xl:*:p-12 @max-4xl:*:nth-3:border-b-0 @max-4xl:*:nth-2:border-r-0 @max-4xl:divide-y @4xl:grid-cols-3 relative grid grid-cols-1 divide-x *:p-4">
            <div className="space-y-1.5">
              <div>
                <IntegrationsGroup>
                  <div className="grid grid-cols-3 gap-2">
                    <IntegrationCard>
                      <Openai className="!w-8" />
                    </IntegrationCard>
                    <IntegrationCard>
                      <ClaudeAiIcon className="!w-8" />
                    </IntegrationCard>
                    <IntegrationCard>
                      <Plus className="m-auto size-5 text-foreground/50" />
                    </IntegrationCard>
                  </div>
                </IntegrationsGroup>
              </div>
              <h3 className="mt-3 font-medium">AI Agents</h3>
              <p className="text-muted-foreground line-clamp-2 text-sm">
                Pipelines are just JSON. Agents build them, executeFromPlan()
                runs them.
              </p>
            </div>
            <div className="space-y-1.5">
              <div>
                <IntegrationsGroup>
                  <div className="grid grid-cols-3 gap-2">
                    <IntegrationCard>
                      <Replicate className="!w-8" />
                    </IntegrationCard>
                    <IntegrationCard>
                      <FALIcon className="!w-8" />
                    </IntegrationCard>
                    <IntegrationCard>
                      <Plus className="m-auto size-5 text-foreground/50" />
                    </IntegrationCard>
                  </div>
                </IntegrationsGroup>
              </div>
              <h3 className="mt-3 font-medium">Providers</h3>
              <p className="text-muted-foreground line-clamp-3 text-sm">
                Replicate, Fal, ElevenLabs, Hume, and more. Bring your keys,
                switch providers without rewriting code.
              </p>
            </div>
            <div className="space-y-1.5">
              <div>
                <IntegrationsGroup>
                  <div className="grid grid-cols-3 gap-2">
                    <IntegrationCard>
                      <Cloudflare className="!w-8" />
                    </IntegrationCard>
                    <IntegrationCard>
                      <Amazon className="!w-8" />
                    </IntegrationCard>
                    <IntegrationCard>
                      <Plus className="m-auto size-5 text-foreground/50" />
                    </IntegrationCard>
                  </div>
                </IntegrationsGroup>
              </div>

              <h3 className="mt-3 font-medium">Storage</h3>
              <p className="text-muted-foreground line-clamp-2 text-sm">
                Any S3-compatible storage. Your bucket, your URLs, no expiring
                links.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

const IntegrationCard = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "bg-background ring-foreground/10 flex aspect-square size-full rounded-lg border border-transparent shadow ring-1 *:m-auto *:size-5",
        className
      )}
    >
      {children}
    </div>
  );
};

const IntegrationsGroup = ({
  children,
  label,
  className,
}: {
  children?: React.ReactNode;
  label?: string;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "ring-foreground/5 relative z-20 col-span-2 row-span-2 grid grid-rows-subgrid gap-1.5 self-center rounded-2xl border border-transparent bg-zinc-50 p-2 shadow ring-1",
        className
      )}
    >
      {children}
    </div>
  );
};
