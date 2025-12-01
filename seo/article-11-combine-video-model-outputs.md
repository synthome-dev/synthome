# How to Combine Outputs From Multiple Video Models

Generating videos with different AI models is straightforward. Combining them into a cohesive output is where things get messy. Frame rates don't match, durations vary, resolutions differ, and codecs conflict. This guide shows you how to standardize, align, and merge video outputs from multiple models into unified pipelines.

---

## Why Combine Multiple Video Models?

Different video models have different strengths:

- **Text-to-video models**: Generate from scratch but limited control
- **Image-to-video models**: Consistent composition, shorter clips
- **Video-to-video models**: Style transfer, upscaling, effects

**Real-world use case:** A multi-scene product video

```
Scene 1: Text-to-video (product in action)
Scene 2: Image-to-video (product closeup from photo)
Scene 3: Text-to-video (customer testimonial scene)
→ Merge into one 15-second video
```

Each model produces different technical specs. Your job: make them compatible.

## The Technical Challenges

### 1. Frame Rate Mismatches

```typescript
// Model A outputs 24 fps
const video1 = await generateVideo({ model: "modelA", prompt: "Scene 1" });

// Model B outputs 30 fps
const video2 = await generateVideo({ model: "modelB", prompt: "Scene 2" });

// ❌ Merging creates judder and sync issues
const merged = await mergeVideos([video1, video2]);
```

**The problem:** Mismatched frame rates cause stuttering during playback.

### 2. Resolution Differences

```typescript
// 1080p video
const hd = await generateVideo({ resolution: "1920x1080" });

// 720p video
const sd = await generateVideo({ resolution: "1280x720" });

// ❌ One video will be stretched or letterboxed
const merged = await mergeVideos([hd, sd]);
```

**The problem:** Inconsistent resolutions look unprofessional.

### 3. Duration Variations

```typescript
// Request 5 seconds
const video1 = await generateVideo({ duration: 5 });
// Actual: 4.8 seconds

const video2 = await generateVideo({ duration: 5 });
// Actual: 5.2 seconds

// ❌ Timing calculations break
```

**The problem:** Models don't respect exact duration requests.

### 4. Codec Incompatibilities

```typescript
// H.264 codec
const video1 = await modelA.generate();

// VP9 codec
const video2 = await modelB.generate();

// ❌ Can't merge without re-encoding
```

**The problem:** Different codecs require re-encoding, adding latency and quality loss.

### 5. Audio Track Mismatches

```typescript
// Has audio track
const videoWithAudio = await generate({ includeAudio: true });

// No audio track
const silentVideo = await generate({ includeAudio: false });

// ❌ Merge creates audio gaps
```

## Solution: Standardization Pipeline

Before merging, normalize all videos to the same specs:

```typescript
interface VideoStandard {
  resolution: "1920x1080" | "1280x720" | "3840x2160";
  fps: 24 | 30 | 60;
  codec: "h264" | "h265";
  duration: number;
  audioTrack: boolean;
}

const STANDARD: VideoStandard = {
  resolution: "1920x1080",
  fps: 30,
  codec: "h264",
  duration: 5,
  audioTrack: false,
};

async function standardizeVideo(
  videoUrl: string,
  standard: VideoStandard,
): Promise<string> {
  // Use FFmpeg or a video processing API
  const normalized = await ffmpeg({
    input: videoUrl,
    output: {
      resolution: standard.resolution,
      fps: standard.fps,
      codec: standard.codec,
      duration: standard.duration,
      stripAudio: !standard.audioTrack,
    },
  });

  return normalized.url;
}
```

## Step-by-Step: Combining Videos

### Step 1: Generate Videos

```typescript
async function generateSceneVideos(scenes: string[]): Promise<string[]> {
  const videos = await Promise.all(
    scenes.map((prompt) =>
      generateVideo({
        model: "appropriate-model",
        prompt,
      }),
    ),
  );

  return videos;
}

const videos = await generateSceneVideos([
  "Product being unboxed, soft lighting",
  "Close-up of product features, macro shot",
  "Person using product happily, lifestyle shot",
]);
```

### Step 2: Inspect Video Properties

```typescript
async function getVideoMetadata(url: string) {
  const probe = await ffprobe(url);

  return {
    duration: probe.format.duration,
    width: probe.streams[0].width,
    height: probe.streams[0].height,
    fps: probe.streams[0].r_frame_rate,
    codec: probe.streams[0].codec_name,
    hasAudio: probe.streams.some((s) => s.codec_type === "audio"),
  };
}

// Inspect all videos
for (const url of videos) {
  const meta = await getVideoMetadata(url);
  console.log(meta);
}

// Output:
// { duration: 4.8, width: 1920, height: 1080, fps: 24, codec: "h264", hasAudio: false }
// { duration: 5.1, width: 1280, height: 720, fps: 30, codec: "h264", hasAudio: false }
// { duration: 5.2, width: 1920, height: 1080, fps: 30, codec: "h265", hasAudio: false }
```

### Step 3: Standardize All Videos

```typescript
async function standardizeVideos(
  videoUrls: string[],
  standard: VideoStandard,
): Promise<string[]> {
  console.log(`Standardizing ${videoUrls.length} videos...`);

  const normalized = await Promise.all(
    videoUrls.map((url) => standardizeVideo(url, standard)),
  );

  console.log("All videos standardized");
  return normalized;
}

const standardVideos = await standardizeVideos(videos, STANDARD);
```

### Step 4: Merge Videos

```typescript
async function mergeVideos(videoUrls: string[]): Promise<string> {
  console.log(`Merging ${videoUrls.length} videos...`);

  // Use FFmpeg concat
  const merged = await ffmpeg.concat({
    inputs: videoUrls,
    output: "merged.mp4",
  });

  return merged.url;
}

const finalVideo = await mergeVideos(standardVideos);
console.log("Final video:", finalVideo);
```

## Complete Implementation

Here's the full pipeline:

```typescript
import ffmpeg from "fluent-ffmpeg";
import fetch from "node-fetch";

interface MergeConfig {
  targetResolution: string;
  targetFps: number;
  targetCodec: string;
  targetDuration?: number;
}

const DEFAULT_CONFIG: MergeConfig = {
  targetResolution: "1920x1080",
  targetFps: 30,
  targetCodec: "libx264",
};

export async function combineVideoOutputs(
  videoUrls: string[],
  config: MergeConfig = DEFAULT_CONFIG,
): Promise<string> {
  console.log(`Combining ${videoUrls.length} video outputs...`);

  // Step 1: Download all videos
  const localPaths = await Promise.all(
    videoUrls.map((url, i) => downloadVideo(url, `input-${i}.mp4`)),
  );

  // Step 2: Standardize each video
  const standardizedPaths = await Promise.all(
    localPaths.map((path, i) =>
      standardizeVideoFile(path, `normalized-${i}.mp4`, config),
    ),
  );

  // Step 3: Create concat file
  const concatFile = createConcatFile(standardizedPaths);

  // Step 4: Merge with FFmpeg
  const outputPath = "merged-output.mp4";

  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(concatFile)
      .inputOptions(["-f concat", "-safe 0"])
      .videoCodec(config.targetCodec)
      .outputOptions(["-preset fast", "-crf 23"])
      .output(outputPath)
      .on("end", () => {
        console.log("Merge complete");
        resolve();
      })
      .on("error", (err) => {
        console.error("Merge failed:", err);
        reject(err);
      })
      .run();
  });

  // Step 5: Upload to CDN
  const cdnUrl = await uploadToCDN(outputPath);

  // Cleanup local files
  await cleanup([...localPaths, ...standardizedPaths, concatFile, outputPath]);

  return cdnUrl;
}

async function standardizeVideoFile(
  inputPath: string,
  outputPath: string,
  config: MergeConfig,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const [width, height] = config.targetResolution.split("x");

    ffmpeg(inputPath)
      .size(`${width}x${height}`)
      .fps(config.targetFps)
      .videoCodec(config.targetCodec)
      .audioCodec("aac")
      .outputOptions(["-preset fast", "-crf 23", "-pix_fmt yuv420p"])
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", reject)
      .run();
  });
}

function createConcatFile(videoPaths: string[]): string {
  const content = videoPaths.map((path) => `file '${path}'`).join("\n");

  const concatPath = "concat-list.txt";
  fs.writeFileSync(concatPath, content);

  return concatPath;
}

async function downloadVideo(url: string, filename: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.buffer();
  fs.writeFileSync(filename, buffer);
  return filename;
}

async function uploadToCDN(filePath: string): Promise<string> {
  // Upload to S3/R2/etc
  // Return public URL
  return "https://cdn.example.com/merged-video.mp4";
}

async function cleanup(paths: string[]): Promise<void> {
  for (const path of paths) {
    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
    }
  }
}
```

## Using a Video Processing API

Instead of running FFmpeg locally, use a managed API:

```typescript
async function combineWithAPI(videoUrls: string[]): Promise<string> {
  const response = await fetch("https://api.video-processor.com/merge", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.API_KEY}` },
    body: JSON.stringify({
      inputs: videoUrls,
      output: {
        resolution: "1920x1080",
        fps: 30,
        codec: "h264",
      },
    }),
  });

  const job = await response.json();

  // Poll for completion
  const result = await pollJob(job.id);

  return result.url;
}
```

## Duration Alignment Strategies

### Strategy 1: Trim to Shortest

```typescript
async function trimToShortest(videos: VideoMetadata[]): Promise<number> {
  const shortest = Math.min(...videos.map((v) => v.duration));
  console.log(`Trimming all videos to ${shortest}s`);
  return shortest;
}
```

### Strategy 2: Pad to Longest

```typescript
async function padToLongest(videos: VideoMetadata[]): Promise<number> {
  const longest = Math.max(...videos.map((v) => v.duration));
  console.log(`Padding all videos to ${longest}s`);
  return longest;
}

// Add freeze frame to end
async function addPadding(videoPath: string, targetDuration: number) {
  const currentDuration = await getDuration(videoPath);
  const paddingNeeded = targetDuration - currentDuration;

  if (paddingNeeded <= 0) return videoPath;

  // Freeze last frame for padding duration
  await ffmpeg(videoPath)
    .outputOptions([
      `-filter_complex [0:v]trim=0:${currentDuration},setpts=PTS-STARTPTS[v0];[0:v]trim=${currentDuration}:${currentDuration},setpts=PTS-STARTPTS+${paddingNeeded}/TB[v1];[v0][v1]concat=n=2:v=1[out]`,
      "-map [out]",
    ])
    .save("padded.mp4");

  return "padded.mp4";
}
```

### Strategy 3: Target Duration

```typescript
async function enforceExactDuration(
  videoPath: string,
  targetDuration: number,
): Promise<string> {
  await ffmpeg(videoPath)
    .setDuration(targetDuration)
    .save("exact-duration.mp4");

  return "exact-duration.mp4";
}
```

## Handling Audio Tracks

### Remove All Audio

```typescript
async function stripAudio(videoPath: string): Promise<string> {
  await ffmpeg(videoPath).noAudio().save("silent.mp4");

  return "silent.mp4";
}
```

### Add Background Music

```typescript
async function addBackgroundMusic(
  videoPath: string,
  audioPath: string,
): Promise<string> {
  await ffmpeg()
    .input(videoPath)
    .input(audioPath)
    .complexFilter([
      "[1:a]aloop=loop=-1:size=2e+09[looped]", // Loop audio
      "[looped]volume=0.3[bg]", // Lower volume
      "[bg]aformat=sample_rates=44100[out]",
    ])
    .outputOptions(["-map 0:v", "-map [out]", "-shortest"])
    .save("with-music.mp4");

  return "with-music.mp4";
}
```

## Using an SDK for Simplification

Manual video processing is complex. Here's the same workflow with an SDK:

```typescript
import { compose, merge, generateVideo, videoModel } from "@synthome/sdk";

async function combineMultipleModels(scenes: string[]) {
  const result = await compose(
    merge(
      scenes.map((prompt) =>
        generateVideo({
          model: videoModel("auto-select-best", "auto"),
          prompt,
        }),
      ),
    ),
  ).execute();

  return result.result?.url;
}

// Usage
const videoUrl = await combineMultipleModels([
  "Product unboxing, soft lighting",
  "Product features closeup, macro",
  "Happy customer using product",
]);
```

**What the SDK handles:**

- Automatic standardization (resolution, FPS, codec)
- Duration alignment
- Audio track normalization
- Format conversion
- Merging and re-encoding

## Common Pitfalls

### Pitfall 1: Quality Loss from Re-encoding

```typescript
// ❌ Multiple re-encodes degrade quality
const video1 = await normalize(rawVideo1); // Re-encode 1
const video2 = await normalize(rawVideo2); // Re-encode 2
const merged = await merge([video1, video2]); // Re-encode 3
```

**Solution:** Minimize re-encoding passes

```typescript
// ✅ Single re-encode during merge
const merged = await mergeAndNormalize([rawVideo1, rawVideo2]);
```

### Pitfall 2: File Size Explosion

```typescript
// ❌ Using lossless settings
const normalized = await ffmpeg(input)
  .outputOptions(["-qscale:v 1"]) // Lossless = huge files
  .save(output);
```

**Solution:** Use appropriate CRF values

```typescript
// ✅ Balanced quality and size
const normalized = await ffmpeg(input)
  .outputOptions(["-crf 23"]) // Good quality, reasonable size
  .save(output);
```

### Pitfall 3: Blocking the Event Loop

```typescript
// ❌ Synchronous FFmpeg blocks Node.js
execSync(`ffmpeg -i input.mp4 output.mp4`);
```

**Solution:** Use async/promises

```typescript
// ✅ Non-blocking
await ffmpegAsync(input, output);
```

## Performance Optimization

### Parallel Standardization

```typescript
// ✅ Standardize all videos in parallel
const standardized = await Promise.all(
  videos.map((v) => standardizeVideo(v, config)),
);
```

### Streaming Processing

```typescript
// Process videos as they complete generation
for await (const videoUrl of generateVideosStream(scenes)) {
  const standardized = await standardizeVideo(videoUrl);
  await addToMergeQueue(standardized);
}
```

## Wrapping Up

Combining outputs from multiple video models requires:

1. **Standardization**: Normalize resolution, FPS, codec, duration
2. **Alignment**: Match durations through trimming or padding
3. **Merging**: Concatenate standardized videos
4. **Quality control**: Minimize re-encoding passes

**Key takeaways:**

- Always inspect video metadata before merging
- Standardize to the lowest common denominator or a target spec
- Use parallel processing for multiple videos
- Minimize re-encoding to preserve quality
- Consider managed APIs for complex processing

Start with simple merges, then add standardization as needed for your use case.

---

**Further reading:**

- Learn about advanced FFmpeg filters
- Explore video quality optimization techniques
- Study audio synchronization strategies
