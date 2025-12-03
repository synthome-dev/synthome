import { Hono } from "hono";
import { unlink } from "fs/promises";
import { processMedia, type FFmpegOptions } from "./operations/process-media";
import { mergeVideos, mergeMedia } from "./operations/merge-videos";
import type { MergeVideosOptions, MergeMediaOptions } from "./core/types";
import { layerMedia } from "./operations/layer-media";
import type { LayerMediaOptions } from "./core/types";
import { presets } from "./core/constants";
import {
  burnSubtitles,
  type BurnSubtitlesOptions,
} from "./operations/burn-subtitles";
import { CaptionService, type TranscriptWord } from "./captions";

/**
 * Stream a file response and clean up the file after streaming completes
 * This avoids loading entire file into RAM
 */
async function streamFileResponse(
  filePath: string,
  contentType: string,
  filename: string,
): Promise<Response> {
  const file = Bun.file(filePath);
  const fileSize = file.size;

  // Create a TransformStream to track when streaming is complete
  const { readable, writable } = new TransformStream();

  // Start streaming in the background and clean up when done
  (async () => {
    try {
      const reader = file.stream().getReader();
      const writer = writable.getWriter();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await writer.write(value);
      }

      await writer.close();
    } catch (error) {
      console.error("[StreamFile] Error streaming file:", error);
    } finally {
      // Clean up the temp file after streaming
      try {
        await unlink(filePath);
        console.log(`[StreamFile] Cleaned up temp file: ${filePath}`);
      } catch (e) {
        console.error(`[StreamFile] Failed to clean up: ${filePath}`, e);
      }
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": fileSize.toString(),
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

const app = new Hono();

// Helper to validate and parse FFmpeg options
const parseFFmpegOptions = (formData: FormData): FFmpegOptions | null => {
  const options: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (key !== "file" && typeof value === "string") {
      options[key] = value;
    }
  });

  if (!options.outputFormat) return null;
  return options as unknown as FFmpegOptions;
};

// Generic conversion endpoint that accepts FFmpeg options
app.post("/convert", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    const options = parseFFmpegOptions(formData);

    if (!file) return c.json({ error: "No file provided" }, 400);
    if (!options) return c.json({ error: "Output format is required" }, 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const outputBuffer = await processMedia(buffer, options);

    c.header(
      "Content-Type",
      `${file.type.split("/")[0]}/${options.outputFormat}`,
    );
    c.header(
      "Content-Disposition",
      `attachment; filename="converted-${Date.now()}.${options.outputFormat}"`,
    );
    return c.body(new Uint8Array(outputBuffer));
  } catch (error) {
    console.error("Error:", error);
    return c.json({ error: "Failed to process media" }, 500);
  }
});

// Convenience endpoints for common operations
app.post("/extract-audio", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    const format = (formData.get("format") as "mp3" | "aac" | "wav") || "mp3";

    if (!file) return c.json({ error: "No file provided" }, 400);
    if (!file.type.startsWith("video/"))
      return c.json({ error: "Invalid file type" }, 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const outputBuffer = await processMedia(
      buffer,
      presets.extractAudio(format),
    );

    c.header("Content-Type", `audio/${format}`);
    c.header(
      "Content-Disposition",
      `attachment; filename="audio-${Date.now()}.${format}"`,
    );
    return c.body(new Uint8Array(outputBuffer));
  } catch (error) {
    console.error("Error:", error);
    return c.json({ error: "Failed to extract audio" }, 500);
  }
});

app.post("/compress-video", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    const quality =
      (formData.get("quality") as "low" | "medium" | "high") || "medium";

    if (!file) return c.json({ error: "No file provided" }, 400);
    if (!file.type.startsWith("video/"))
      return c.json({ error: "Invalid file type" }, 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const outputBuffer = await processMedia(
      buffer,
      presets.compressVideo(quality),
    );

    c.header("Content-Type", "video/mp4");
    c.header(
      "Content-Disposition",
      `attachment; filename="compressed-${Date.now()}.mp4"`,
    );
    return c.body(new Uint8Array(outputBuffer));
  } catch (error) {
    console.error("Error:", error);
    return c.json({ error: "Failed to compress video" }, 500);
  }
});

app.post("/create-gif", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    const fps = Number(formData.get("fps")) || 10;

    if (!file) return c.json({ error: "No file provided" }, 400);
    if (!file.type.startsWith("video/"))
      return c.json({ error: "Invalid file type" }, 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const outputBuffer = await processMedia(buffer, presets.createGif(fps));

    c.header("Content-Type", "image/gif");
    c.header(
      "Content-Disposition",
      `attachment; filename="animation-${Date.now()}.gif"`,
    );
    return c.body(new Uint8Array(outputBuffer));
  } catch (error) {
    console.error("Error:", error);
    return c.json({ error: "Failed to create GIF" }, 500);
  }
});

app.post("/thumbnail", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    const time = (formData.get("time") as string) || "00:00:01";
    const width = Number(formData.get("width")) || undefined;
    const height = Number(formData.get("height")) || undefined;

    if (!file) return c.json({ error: "No file provided" }, 400);
    if (!file.type.startsWith("video/"))
      return c.json({ error: "Invalid file type" }, 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const outputBuffer = await processMedia(
      buffer,
      presets.thumbnail(time, { width, height }),
    );

    c.header("Content-Type", "image/jpeg");
    c.header(
      "Content-Disposition",
      `attachment; filename="thumbnail-${Date.now()}.jpg"`,
    );
    return c.body(new Uint8Array(outputBuffer));
  } catch (error) {
    console.error("Error:", error);
    return c.json({ error: "Failed to create thumbnail" }, 500);
  }
});

app.post("/merge", async (c) => {
  try {
    const body = await c.req.json<MergeVideosOptions | MergeMediaOptions>();

    // Check if this is the new format (has 'items' array) or legacy format (has 'videos' array)
    if ("items" in body && Array.isArray(body.items)) {
      // New MergeMediaOptions format
      if (body.items.length === 0) {
        return c.json({ error: "At least 1 item required for merging" }, 400);
      }

      console.log("[Merge API] Processing new format request:", {
        itemCount: body.items.length,
        audioCount: body.audio?.length || 0,
      });

      // Returns file path - we stream it to avoid loading into RAM
      const outputPath = await mergeMedia(body as MergeMediaOptions);

      return streamFileResponse(
        outputPath,
        "video/mp4",
        `merged-${Date.now()}.mp4`,
      );
    } else if ("videos" in body && Array.isArray(body.videos)) {
      // Legacy MergeVideosOptions format
      if (body.videos.length < 2) {
        return c.json({ error: "At least 2 videos required for merging" }, 400);
      }

      console.log("[Merge API] Processing legacy format request:", {
        videoCount: body.videos.length,
      });

      // Returns file path - we stream it to avoid loading into RAM
      const outputPath = await mergeVideos(body as MergeVideosOptions);

      return streamFileResponse(
        outputPath,
        "video/mp4",
        `merged-${Date.now()}.mp4`,
      );
    } else {
      return c.json(
        { error: "Invalid request format. Expected 'items' or 'videos' array" },
        400,
      );
    }
  } catch (error) {
    console.error("Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return c.json({ error: `Failed to merge media: ${errorMessage}` }, 500);
  }
});

app.post("/layer", async (c) => {
  try {
    const body = await c.req.json<LayerMediaOptions>();

    if (!body.layers || body.layers.length === 0) {
      return c.json({ error: "At least 1 layer is required" }, 400);
    }

    console.log("[Layer API] Processing request:", {
      layerCount: body.layers.length,
      outputDuration: body.outputDuration,
      outputWidth: body.outputWidth,
      outputHeight: body.outputHeight,
    });

    // Returns file path - we stream it to avoid loading into RAM
    const outputPath = await layerMedia(body);

    return streamFileResponse(
      outputPath,
      "video/mp4",
      `layered-${Date.now()}.mp4`,
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return c.json({ error: `Failed to layer media: ${errorMessage}` }, 500);
  }
});

app.post("/burn-subtitles", async (c) => {
  try {
    const body = await c.req.json<BurnSubtitlesOptions>();

    if (!body.videoUrl) {
      return c.json({ error: "videoUrl is required" }, 400);
    }
    if (!body.subtitleContent) {
      return c.json({ error: "subtitleContent is required" }, 400);
    }

    // Returns file path - we stream it to avoid loading into RAM
    const outputPath = await burnSubtitles(body);

    return streamFileResponse(
      outputPath,
      "video/mp4",
      `captioned-${Date.now()}.mp4`,
    );
  } catch (error) {
    console.error("Error:", error);
    return c.json({ error: "Failed to burn subtitles" }, 500);
  }
});

app.post("/generate-subtitles", async (c) => {
  try {
    const body = await c.req.json<{
      words: TranscriptWord[];
      preset?: string;
      overrides?: any;
      videoWidth?: number;
      videoHeight?: number;
    }>();

    if (!body.words || !Array.isArray(body.words)) {
      return c.json({ error: "words array is required" }, 400);
    }

    const captionService = new CaptionService();
    const subtitleContent = captionService.generateSubtitleContent({
      words: body.words,
      preset: body.preset,
      overrides: body.overrides,
      videoWidth: body.videoWidth,
      videoHeight: body.videoHeight,
    });

    return c.json({ subtitleContent });
  } catch (error) {
    console.error("Error:", error);
    return c.json({ error: "Failed to generate subtitles" }, 500);
  }
});

app.get("/", (c) =>
  c.json({
    status: "ok",
    endpoints: {
      "/convert": "Generic conversion with custom FFmpeg options",
      "/extract-audio": "Extract audio from video (MP3, AAC, WAV)",
      "/compress-video": "Compress video with quality presets",
      "/create-gif": "Convert video to GIF",
      "/thumbnail": "Generate video thumbnail",
      "/merge": "Merge multiple videos into one",
      "/layer": "Layer multiple media with placement and effects",
      "/burn-subtitles": "Burn subtitles into video",
      "/generate-subtitles": "Generate ASS subtitle content from transcript",
    },
  }),
);

const server = {
  port: Bun.env.PORT ? parseInt(Bun.env.PORT) : 3200,
  hostname: "::", // Listen on IPv6 (and IPv4 via dual-stack) for Railway private networking
  fetch: app.fetch,
};

export default server;
