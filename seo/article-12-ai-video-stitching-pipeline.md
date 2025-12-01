# How to Stitch AI Video Segments Into a Unified Pipeline

Creating multi-scene AI videos means generating individual segments, then stitching them into a cohesive final product. This guide covers scene orchestration, caption synchronization, audio alignment, and the automation patterns that turn separate clips into polished videos.

---

## Why Stitch Video Segments?

Long-form AI video generation (30+ seconds) is expensive and unreliable. The solution: generate short segments (3-5 seconds each), then stitch them together.

**Benefits:**

- **Higher success rate**: Short generations fail less often
- **Better quality**: Models perform better on short clips
- **Faster iteration**: Re-generate individual scenes, not the entire video
- **Cost efficiency**: Only pay to regenerate failed segments

**Use cases:**

- Product demos with multiple scenes
- Educational videos with chapters
- Social media montages
- Storytelling with scene transitions

## The Stitching Pipeline

```
Generate Segments → Normalize → Add Transitions → Sync Audio → Add Captions → Final Video
```

Each step handles a specific aspect of unification.

## Step 1: Generate Segments in Parallel

```typescript
interface VideoSegment {
  prompt: string;
  duration: number;
  order: number;
}

async function generateSegments(segments: VideoSegment[]): Promise<string[]> {
  console.log(`Generating ${segments.length} video segments...`);

  // Generate all segments in parallel
  const videos = await Promise.all(
    segments.map(async (segment) => {
      const url = await generateVideo({
        prompt: segment.prompt,
        duration: segment.duration,
      });

      return { url, order: segment.order };
    }),
  );

  // Sort by order
  const sorted = videos.sort((a, b) => a.order - b.order);

  return sorted.map((v) => v.url);
}

// Usage
const segments = [
  { prompt: "Person opening laptop, morning light", duration: 3, order: 0 },
  { prompt: "Hands typing on keyboard, close-up", duration: 3, order: 1 },
  {
    prompt: "Screen showing completed work, satisfaction",
    duration: 3,
    order: 2,
  },
];

const videoUrls = await generateSegments(segments);
```

## Step 2: Normalize Segments

Before stitching, ensure all segments have consistent technical specs:

```typescript
interface NormalizationConfig {
  resolution: string;
  fps: number;
  codec: string;
}

async function normalizeSegments(
  videoUrls: string[],
  config: NormalizationConfig,
): Promise<string[]> {
  console.log("Normalizing segments...");

  return Promise.all(
    videoUrls.map(async (url, index) => {
      const normalized = await ffmpeg({
        input: url,
        output: {
          resolution: config.resolution,
          fps: config.fps,
          codec: config.codec,
          filename: `normalized-${index}.mp4`,
        },
      });

      return normalized.path;
    }),
  );
}

const normalized = await normalizeSegments(videoUrls, {
  resolution: "1920x1080",
  fps: 30,
  codec: "h264",
});
```

## Step 3: Add Transitions

Smooth transitions between segments improve perceived quality:

```typescript
type TransitionType = "fade" | "dissolve" | "wipe" | "none";

async function addTransitions(
  segments: string[],
  transitionType: TransitionType = "fade",
  transitionDuration: number = 0.5,
): Promise<string> {
  if (transitionType === "none") {
    return concatenateDirectly(segments);
  }

  const filterComplex = buildTransitionFilter(
    segments.length,
    transitionType,
    transitionDuration,
  );

  return new Promise((resolve, reject) => {
    const command = ffmpeg();

    // Add all inputs
    segments.forEach((path) => command.input(path));

    // Apply transition filter
    command
      .complexFilter(filterComplex)
      .outputOptions(["-map", "[out]"])
      .output("with-transitions.mp4")
      .on("end", () => resolve("with-transitions.mp4"))
      .on("error", reject)
      .run();
  });
}

function buildTransitionFilter(
  segmentCount: number,
  type: TransitionType,
  duration: number,
): string {
  const filters: string[] = [];

  for (let i = 0; i < segmentCount - 1; i++) {
    if (type === "fade") {
      filters.push(
        `[${i}:v]fade=t=out:st=${duration}:d=${duration}[v${i}out]`,
        `[${i + 1}:v]fade=t=in:st=0:d=${duration}[v${i + 1}in]`,
      );
    }
  }

  // Concatenate all segments
  const inputs = filters.map((_, i) => `[v${i}out]`).join("");
  filters.push(`${inputs}concat=n=${segmentCount}:v=1:a=0[out]`);

  return filters.join(";");
}
```

## Step 4: Sync Audio/Narration

Add voiceover narration that syncs with the stitched video:

```typescript
interface NarrationSegment {
  text: string;
  startTime: number; // Seconds into the video
  duration: number;
}

async function addNarration(
  videoPath: string,
  narration: NarrationSegment[],
): Promise<string> {
  // Generate audio for all narration segments
  const audioSegments = await Promise.all(
    narration.map(async (segment) => {
      const audioUrl = await generateAudio({
        text: segment.text,
        voice: "professional-female",
      });

      return {
        url: audioUrl,
        startTime: segment.startTime,
        duration: segment.duration,
      };
    }),
  );

  // Mix audio segments with video
  return mixAudioSegments(videoPath, audioSegments);
}

async function mixAudioSegments(
  videoPath: string,
  segments: Array<{ url: string; startTime: number; duration: number }>,
): Promise<string> {
  // Download audio files
  const audioPaths = await Promise.all(
    segments.map(async (seg, i) => {
      const path = `audio-${i}.mp3`;
      await downloadFile(seg.url, path);
      return { path, startTime: seg.startTime };
    }),
  );

  // Build FFmpeg filter for audio mixing
  const audioFilters = audioPaths.map(
    (audio, i) =>
      `[${i + 1}:a]adelay=${audio.startTime * 1000}|${audio.startTime * 1000}[a${i}]`,
  );

  const mixFilter =
    audioPaths.map((_, i) => `[a${i}]`).join("") +
    `amix=inputs=${audioPaths.length}:duration=first[aout]`;

  return new Promise((resolve, reject) => {
    const command = ffmpeg().input(videoPath);

    // Add all audio inputs
    audioPaths.forEach((a) => command.input(a.path));

    command
      .complexFilter([...audioFilters, mixFilter])
      .outputOptions(["-map 0:v", "-map [aout]"])
      .output("with-narration.mp4")
      .on("end", () => resolve("with-narration.mp4"))
      .on("error", reject)
      .run();
  });
}
```

## Step 5: Add Synchronized Captions

Burn captions that match the narration timing:

```typescript
interface Caption {
  text: string;
  startTime: number;
  endTime: number;
}

async function addCaptions(
  videoPath: string,
  captions: Caption[],
): Promise<string> {
  // Generate SRT subtitle file
  const srtPath = generateSRT(captions);

  // Burn subtitles into video
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([
        `-vf subtitles=${srtPath}:force_style='FontName=Arial,FontSize=24,PrimaryColour=&Hffffff,OutlineColour=&H000000,Outline=2'`,
      ])
      .output("with-captions.mp4")
      .on("end", () => resolve("with-captions.mp4"))
      .on("error", reject)
      .run();
  });
}

function generateSRT(captions: Caption[]): string {
  const srtContent = captions
    .map((caption, index) => {
      const startTime = formatSRTTime(caption.startTime);
      const endTime = formatSRTTime(caption.endTime);

      return `${index + 1}\n${startTime} --> ${endTime}\n${caption.text}\n`;
    })
    .join("\n");

  const srtPath = "captions.srt";
  fs.writeFileSync(srtPath, srtContent);

  return srtPath;
}

function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(millis, 3)}`;
}

function pad(num: number, size: number = 2): string {
  return num.toString().padStart(size, "0");
}
```

## Complete Stitching Pipeline

Here's the full implementation:

```typescript
export async function stitchVideoSegments(
  segments: VideoSegment[],
  narration: NarrationSegment[],
  options?: StitchingOptions,
): Promise<string> {
  console.log("=== Starting Video Stitching Pipeline ===");

  // Step 1: Generate all segments in parallel
  console.log("Step 1: Generating video segments...");
  const videoUrls = await generateSegments(segments);

  // Step 2: Normalize segments
  console.log("Step 2: Normalizing segments...");
  const normalized = await normalizeSegments(videoUrls, {
    resolution: "1920x1080",
    fps: 30,
    codec: "h264",
  });

  // Step 3: Add transitions
  console.log("Step 3: Adding transitions...");
  const withTransitions = await addTransitions(
    normalized,
    options?.transitionType || "fade",
    options?.transitionDuration || 0.5,
  );

  // Step 4: Add narration
  console.log("Step 4: Adding narration...");
  const withNarration = await addNarration(withTransitions, narration);

  // Step 5: Add captions
  console.log("Step 5: Adding captions...");
  const captions = await transcribeAndAlign(withNarration);
  const final = await addCaptions(withNarration, captions);

  // Step 6: Upload to CDN
  console.log("Step 6: Uploading to CDN...");
  const cdnUrl = await uploadToCDN(final);

  // Cleanup
  await cleanupTempFiles([
    ...normalized,
    withTransitions,
    withNarration,
    final,
  ]);

  console.log("=== Pipeline Complete ===");
  console.log("Final video:", cdnUrl);

  return cdnUrl;
}

// Usage
const finalVideo = await stitchVideoSegments(
  [
    { prompt: "Morning routine, person waking up", duration: 3, order: 0 },
    { prompt: "Making coffee, kitchen scene", duration: 3, order: 1 },
    { prompt: "Starting work on laptop, focused", duration: 3, order: 2 },
  ],
  [
    { text: "Start your day right", startTime: 0, duration: 2 },
    { text: "With the perfect morning routine", startTime: 3, duration: 3 },
    { text: "Productivity begins here", startTime: 6, duration: 3 },
  ],
);
```

## Using an SDK for Automatic Stitching

Manual stitching requires significant FFmpeg knowledge. Here's the same pipeline with an SDK:

```typescript
import {
  compose,
  generateVideo,
  merge,
  captions,
  generateAudio,
  videoModel,
  audioModel,
} from "@synthome/sdk";

async function stitchWithSDK(
  scenes: string[],
  narrationText: string,
): Promise<string> {
  const execution = await compose(
    captions({
      video: merge(
        scenes.map((prompt) =>
          generateVideo({
            model: videoModel("animate-diff", "replicate"),
            prompt,
            duration: 3,
          }),
        ),
      ),
      audio: generateAudio({
        model: audioModel("elevenlabs/turbo-v2.5", "elevenlabs"),
        text: narrationText,
        voiceId: "professional-female",
      }),
    }),
  ).execute();

  return execution.result!.url;
}

// Usage
const video = await stitchWithSDK(
  [
    "Morning routine, person waking up",
    "Making coffee, kitchen scene",
    "Starting work on laptop, focused",
  ],
  "Start your day right with the perfect morning routine. Productivity begins here.",
);
```

**What the SDK handles:**

- Parallel segment generation
- Automatic normalization
- Transition detection and application
- Audio/video synchronization
- Caption generation and timing
- CDN upload

## Advanced: Scene-Aware Stitching

Detect scene content and adjust transitions automatically:

```typescript
async function detectSceneType(videoUrl: string): Promise<string> {
  // Use vision model to analyze scene content
  const analysis = await analyzeVideo(videoUrl);

  if (analysis.includes("indoor")) return "indoor";
  if (analysis.includes("outdoor")) return "outdoor";
  if (analysis.includes("closeup")) return "closeup";

  return "general";
}

async function chooseTransition(
  scene1Type: string,
  scene2Type: string,
): Promise<TransitionType> {
  // Indoor → Outdoor: Use fade
  if (scene1Type === "indoor" && scene2Type === "outdoor") return "fade";

  // Closeup → Wide: Use dissolve
  if (scene1Type === "closeup" && scene2Type !== "closeup") return "dissolve";

  // Default: Quick cut
  return "none";
}
```

## Performance Optimization

### Streaming Approach

Process segments as they complete:

```typescript
async function* generateSegmentsStream(
  segments: VideoSegment[],
): AsyncGenerator<string> {
  const promises = segments.map((s) => generateVideo({ prompt: s.prompt }));

  for (const promise of promises) {
    yield await promise;
  }
}

async function stitchStreaming(segments: VideoSegment[]): Promise<string> {
  const completedSegments: string[] = [];

  for await (const segmentUrl of generateSegmentsStream(segments)) {
    completedSegments.push(segmentUrl);
    console.log(`Completed ${completedSegments.length}/${segments.length}`);
  }

  return mergeSegments(completedSegments);
}
```

## Wrapping Up

Stitching AI video segments into unified pipelines requires:

1. **Parallel generation**: Generate segments simultaneously
2. **Normalization**: Standardize technical specs
3. **Transitions**: Smooth scene changes
4. **Audio sync**: Align narration with visuals
5. **Captions**: Add synchronized text overlays

**Key takeaways:**

- Generate short segments for reliability
- Normalize before stitching
- Use transitions for professional polish
- Sync audio/captions precisely
- Consider SDKs for automatic orchestration

Start with simple concatenation, then add transitions and captions as needed.

---

**Further reading:**

- Learn about advanced FFmpeg filters
- Explore caption styling techniques
- Study audio mixing strategies
