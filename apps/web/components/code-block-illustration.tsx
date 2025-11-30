"use client";
import CodeBlock from "@/components/code-block";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

type CodeBlockType = "generate" | "multi-scene" | "talking-head" | "captions";

export default function CodeBlockIllustration() {
  const [code, setCode] = useState<CodeBlockType>("generate");
  const generateRef = useRef<HTMLButtonElement>(null);
  const multiSceneRef = useRef<HTMLButtonElement>(null);
  const talkingHeadRef = useRef<HTMLButtonElement>(null);
  const captionsRef = useRef<HTMLButtonElement>(null);
  const [indicatorLeft, setIndicatorLeft] = useState(0);
  const [indicatorWidth, setIndicatorWidth] = useState(0);

  const codeBlockConfigs: Array<{
    name: string;
    value: CodeBlockType;
    ref: React.RefObject<HTMLButtonElement | null>;
  }> = useMemo(
    () => [
      { name: "Generate Video", value: "generate", ref: generateRef },
      { name: "Multi-Scene", value: "multi-scene", ref: multiSceneRef },
      { name: "Talking Head", value: "talking-head", ref: talkingHeadRef },
      { name: "With Captions", value: "captions", ref: captionsRef },
    ],
    []
  );

  useEffect(() => {
    const activeConfig = codeBlockConfigs.find(
      (config) => config.value === code
    );
    const activeRef = activeConfig ? activeConfig.ref : generateRef;

    if (activeRef.current) {
      const parentElement = activeRef.current.parentElement;
      if (parentElement) {
        const parentLeft = parentElement.getBoundingClientRect().left;
        const buttonLeft = activeRef.current.getBoundingClientRect().left;
        const buttonWidth = activeRef.current.offsetWidth;

        const newIndicatorLeft = buttonLeft - parentLeft + 16;
        const newIndicatorWidth = buttonWidth;
        setIndicatorLeft(newIndicatorLeft);
        setIndicatorWidth(newIndicatorWidth);
      }
    }
  }, [code, codeBlockConfigs]);

  const codes: Record<CodeBlockType, string> = {
    generate: `import { compose, generateVideo, videoModel } from "@synthome/sdk";

const execution = await compose(
  generateVideo({
    model: videoModel("bytedance/seedance-1-pro", "replicate"),
    image: generateImage({
      model: imageModel("google/nano-banana", "replicate"),
      prompt: "A scenic view of mountains during sunrise",
      aspectRatio: "9:16",
    })
    duration: 5,
  }),
).execute();`,

    "multi-scene": `import { compose, generateVideo, merge, videoModel } from "@synthome/sdk";

const execution = await compose(
  merge([
    generateVideo({
      model: videoModel("bytedance/seedance-1-pro", "replicate"),
      prompt: "Scene 1: A rocket launching into space",
    }),
    generateVideo({
      model: videoModel("bytedance/seedance-1-pro", "replicate"),
      prompt: "Scene 2: Earth from orbit",
    }),
    "https://example.com/outro.mp4",
  ]),
).execute();`,

    "talking-head": `import { compose, generateVideo, generateAudio, videoModel, audioModel } from "@synthome/sdk";

const execution = await compose(
  generateVideo({
    model: videoModel("veed/fabric-1.0", "fal"),
    prompt: "A professional presenter",
    image: "https://example.com/portrait.jpg",
    audio: generateAudio({
      model: audioModel("elevenlabs/turbo-v2.5", "elevenlabs"),
      text: "Welcome to our product demo.",
      voiceId: "EXAVITQu4vr4xnSDxMaL",
    }),
  }),
).execute();`,

    captions: `import { compose, generateVideo, generateAudio, merge, captions, videoModel, audioModel } from "@synthome/sdk";

const execution = await compose(
  captions({
    video: merge([
      generateVideo({
        model: videoModel("bytedance/seedance-1-pro", "replicate"),
        prompt: "Product showcase video",
      }),
      generateAudio({
        model: audioModel("elevenlabs/turbo-v2.5", "elevenlabs"),
        text: "Introducing our new product.",
        voiceId: "EXAVITQu4vr4xnSDxMaL",
      }),
    ]),
    model: audioModel("vaibhavs10/incredibly-fast-whisper", "replicate"),
    style: { preset: "tiktok" },
  }),
).execute();`,
  };

  return (
    <div className="relative z-10 overflow-hidden pt-6">
      <div className="relative z-10 px-3">
        <div className="relative mt-4 flex gap-1">
          <motion.span
            animate={{ x: indicatorLeft, width: indicatorWidth }}
            layout
            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            className="bg-foreground/5 border-foreground/5 absolute inset-y-0 -left-4 flex rounded-full border"
          />

          {codeBlockConfigs.map(({ name, value, ref }) => {
            return (
              <button
                key={name}
                ref={ref}
                onClick={() => setCode(value)}
                data-state={code === value ? "active" : ""}
                className="data-[state=active]:text-foreground z-10 flex h-8 items-center gap-1 rounded-full px-3 text-sm duration-150 hover:opacity-50 data-[state=active]:hover:opacity-100"
              >
                <span className="text-nowrap font-medium">{name}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="h-92">
        <CodeBlock
          code={codes[code]}
          lang="typescript"
          maxHeight={360}
          lineNumbers
          className="[&_pre]:h-92 [&_pre]:min-h-[12rem] [&_pre]:rounded-xl [&_pre]:border-none [&_pre]:!bg-transparent"
        />
      </div>
    </div>
  );
}
