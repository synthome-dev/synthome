import type { Audio, Scene } from "@repo/db";
import {
  getAllAudioByProjectId,
  getAllScenesByProjectId,
  getProjectById,
} from "@repo/db";
import type { VideoFormat } from "@repo/providers";
import { storage } from "@repo/storage";
import { ResourceCache } from "@repo/video-render";
import puppeteer from "puppeteer-core";
import { getVideoDimensions } from "./utils/format-dimensions";
import { getWatermarkPosition } from "./utils/watermark-position";

class BrowserManager {
  private browserWSEndpoint: string;

  constructor(browserWSEndpoint: string) {
    this.browserWSEndpoint = browserWSEndpoint;
  }

  async createConfiguredPage(): Promise<{ page: any; browser: any }> {
    const browser = await puppeteer.connect({
      browserWSEndpoint: this.browserWSEndpoint,
    });

    const page = await browser.newPage();

    // Forward console messages from browser context to Node.js console
    this.setupConsoleForwarding(page);

    // Navigate to an allowed origin to avoid CORS issues
    await page.goto("https://app.***REMOVED***");

    // Load required scripts
    await this.loadRequiredScripts(page);

    return { page, browser };
  }

  private setupConsoleForwarding(page: any): void {
    page.on("console", (msg: any) => {
      const type = msg.type();
      const text = msg.text();
      const prefix = "[Browser]";

      switch (type) {
        case "log":
          console.log(`${prefix} ${text}`);
          break;
        case "error":
          console.error(`${prefix} ${text}`);
          break;
        case "warn":
          console.warn(`${prefix} ${text}`);
          break;
        case "info":
          console.info(`${prefix} ${text}`);
          break;
        default:
          console.log(`${prefix} [${type}] ${text}`);
      }
    });
  }

  private async loadRequiredScripts(page: any): Promise<void> {
    await page.addScriptTag({
      url: "https://unpkg.com/mp4-muxer@5.2.1/build/mp4-muxer.js",
    });

    await page.addScriptTag({
      url: "https://unpkg.com/@diffusionstudio/core@2.0.2/dist/core.umd.js",
    });

    // Wait for both scripts to load
    await page.waitForFunction(
      () => typeof (window as any).Mp4Muxer !== "undefined"
    );
    await page.waitForFunction(
      () => typeof (window as any).core !== "undefined"
    );
  }

  async cleanup(browser: any): Promise<void> {
    await browser.disconnect();
  }
}

function prepareBrowserUtils(additionalUtils?: Record<string, string>): {
  ResourceCacheSource: string;
  [key: string]: string;
} {
  return {
    ResourceCacheSource: ResourceCache.toString(),
    ...additionalUtils,
  };
}

function processBrowserResult<
  T extends { ok: boolean; blob?: number[]; error?: string },
>(result: T, operationName: string): number[] {
  const { ok, blob, error } = result;

  if (!ok) {
    console.error(`[Video Render] ${operationName} failed:`, error);
    throw new Error(error || `Failed to ${operationName}`);
  }

  return blob!;
}

async function uploadVideoBlob(
  blob: number[] | Blob,
  filename: string,
  contentType = "video/mp4"
): Promise<string> {
  let buffer: Buffer;

  if (Array.isArray(blob)) {
    // Convert array back to Buffer
    buffer = Buffer.from(blob);
  } else {
    // Convert Blob to Buffer
    const arrayBuffer = await blob.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  }

  // Upload the video
  const { url } = await storage.upload(`videos/${filename}`, buffer, {
    contentType,
  });

  return url!;
}

export class VideoRenderService {
  private browserManager: BrowserManager;

  constructor(browserWSEndpoint?: string) {
    const endpoint = browserWSEndpoint || process.env.BROWSER_WS_ENDPOINT || "";
    if (!endpoint) {
      throw new Error("BROWSER_WS_ENDPOINT is required");
    }
    this.browserManager = new BrowserManager(endpoint);
  }

  async cropVideoTo4x5(videoUrl: string): Promise<string> {
    const { page, browser } = await this.browserManager.createConfiguredPage();

    try {
      console.log(
        "[Video Render] Scripts loaded successfully for 4:5 cropping"
      );

      const utils = prepareBrowserUtils();

      const result = (await page.evaluate(cropVideoTo4x5Browser, {
        videoUrl,
        utils,
      })) as { ok: boolean; blob?: number[]; error?: string };

      const blob = processBrowserResult(result, "4:5 cropping");

      console.log(
        "[Video Render] Video cropped to 4:5 successfully. Starting upload..."
      );

      const filename = `cropped-4x5-${Date.now()}.mp4`;
      const url = await uploadVideoBlob(blob, filename);

      console.log("[Video Render] Cropped 4:5 video uploaded to:", url);

      return url;
    } finally {
      await this.browserManager.cleanup(browser);
    }
  }

  async cropVideo(
    videoUrl: string,
    cropPixels: number = 54,
    aspectRatio: "9:16" | "16:9" | "1:1" | "4:5" = "16:9"
  ): Promise<string> {
    const { page, browser } = await this.browserManager.createConfiguredPage();

    try {
      console.log(
        "[Video Render] Scripts loaded successfully for video cropping"
      );

      const utils = prepareBrowserUtils();

      const result = (await page.evaluate(cropVideoBrowser, {
        videoUrl,
        cropPixels,
        aspectRatio,
        utils,
      })) as { ok: boolean; blob?: number[]; error?: string };

      const blob = processBrowserResult(result, "video cropping");

      console.log(
        "[Video Render] Video cropped successfully. Starting upload..."
      );

      const filename = `${videoUrl.split("/").pop()}`;
      const url = await uploadVideoBlob(blob, filename);

      return url;
    } finally {
      await this.browserManager.cleanup(browser);
    }
  }

  async renderProject(
    projectId: string,
    aspectRatio: "9:16" | "16:9" | "1:1" | "4:5",
    bRollItems?: Array<{
      url: string;
      duration: number;
      aspectRatio?: string;
      type?: "video" | "image";
    }>,
    textOverlay?: string
  ): Promise<string> {
    const [audio, scenes, project] = await Promise.all([
      getAllAudioByProjectId({ projectId }),
      getAllScenesByProjectId({ projectId }),
      getProjectById({ id: projectId }),
    ]);

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    // Determine which aspect ratio to render
    // If aspectRatio is provided, use it; otherwise use project format
    const renderAspectRatio = aspectRatio;

    const { page, browser } = await this.browserManager.createConfiguredPage();

    try {
      console.log("Scripts loaded successfully");

      const utils = prepareBrowserUtils({
        getVideoDimensionsSource: getVideoDimensions.toString(),
        getWatermarkPositionSource: getWatermarkPosition.toString(),
      });

      // Map scenes to use the correct video field based on aspect ratio
      const aspectRatioFieldMap = {
        "9:16": "video9_16",
        "16:9": "video16_9",
        "1:1": "video1_1",
        "4:5": "video4_5",
      } as const;

      const videoField =
        aspectRatioFieldMap[
          renderAspectRatio as keyof typeof aspectRatioFieldMap
        ];

      const mappedScenes = scenes.map((scene) => {
        const videoUrl = (scene as any)[videoField] || scene.video;
        return {
          ...scene,
          video: videoUrl, // Use the video from the correct aspect ratio field
        };
      });

      const result = (await page.evaluate(renderVideo, {
        timeline: { scenes: mappedScenes, audio },
        showWatermark: true,
        format: renderAspectRatio as VideoFormat,
        bRollItems: bRollItems || [],
        aspectRatio: renderAspectRatio,
        textOverlay: textOverlay || undefined,
        utils,
      })) as { ok: boolean; blob?: number[]; error?: string };

      const blob = processBrowserResult(result, "project rendering");

      console.log("Video rendered successfully. Starting upload...");

      const filename = `render/${projectId}-${renderAspectRatio}.mp4`;
      const url = await uploadVideoBlob(blob, filename);

      return url;
    } finally {
      await this.browserManager.cleanup(browser);
    }
  }
}

// Browser-side cropping function
async function cropVideoTo4x5Browser({
  videoUrl,
  utils,
}: {
  videoUrl: string;
  utils: {
    ResourceCacheSource: string;
  };
}) {
  try {
    // Access core from window object in browser context
    const { Composition, Encoder, VideoSource, VideoClip, Timestamp } = (
      window as any
    ).core;

    if (!Composition || !Encoder || !VideoSource || !VideoClip || !Timestamp) {
      return {
        ok: false,
        error: "Video rendering library not available in browser context",
      };
    }

    // Recreate ResourceCache from source string
    const ResourceCache = eval(`(${utils.ResourceCacheSource})`);
    const resourceCache = new ResourceCache();

    // Get the proper video URL using ResourceCache
    const processedVideoUrl = await resourceCache.getOrCreateResource(
      videoUrl,
      "video"
    );

    // Load the source video to get its dimensions and duration
    const videoSource = await VideoSource.from(processedVideoUrl);
    const videoDuration = 8;

    // Calculate crop dimensions for 4:5 aspect ratio
    // Input is 1:1 (1080x1080), we want 4:5 (864x1080)
    const originalSize = 1080;
    const targetWidth = Math.floor(originalSize * 0.8); // 864 for 4:5 ratio
    const targetHeight = originalSize; // Keep height at 1080

    // Create composition with 4:5 dimensions
    const composition = new Composition({
      width: targetWidth,
      height: targetHeight,
    });

    // Clear composition first
    composition.pause();
    composition.clear();

    // Calculate how much to crop from each side
    const cropFromSide = (originalSize - targetWidth) / 2;
    const offsetPercentage = (cropFromSide / targetWidth) * 100;

    // Create video clip with horizontal cropping
    const videoClip = new VideoClip(videoSource, {
      muted: false,
      position: "center",
      height: "100%",
      width: `${(originalSize / targetWidth) * 100}%`, // Scale to fill width
      delay: new Timestamp(0),
      duration: new Timestamp(videoDuration * 1000),
      volume: 1,
      // Center the video horizontally
      left: `-${offsetPercentage}%`,
    });

    await composition.add(videoClip);

    // Set composition duration
    composition.duration = new Timestamp(videoDuration * 1000).frames;

    // Render the composition
    const encoder = new Encoder(composition);
    const blob = await encoder.render();

    if (!blob) {
      return { ok: false, error: "Failed to render cropped video" };
    }

    // Convert Blob to array for transfer
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const array = Array.from(uint8Array);

    return { ok: true, blob: array };
  } catch (error) {
    console.error("Error in cropVideoTo4x5Browser:", {
      errorMessage: error instanceof Error ? error.message : String(error),
      errorType: error?.constructor?.name,
    });
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

async function cropVideoBrowser({
  videoUrl,
  cropPixels,
  aspectRatio,
  utils,
}: {
  videoUrl: string;
  cropPixels: number;
  aspectRatio: "9:16" | "16:9" | "1:1" | "4:5";
  utils: {
    ResourceCacheSource: string;
  };
}) {
  try {
    // Access core from window object in browser context
    const { Composition, Encoder, VideoSource, VideoClip, Timestamp } = (
      window as any
    ).core;

    if (!Composition || !Encoder || !VideoSource || !VideoClip || !Timestamp) {
      return {
        ok: false,
        error: "Video rendering library not available in browser context",
      };
    }

    // Recreate ResourceCache from source string
    const ResourceCache = eval(`(${utils.ResourceCacheSource})`);
    const resourceCache = new ResourceCache();

    // Get the proper video URL using ResourceCache
    const processedVideoUrl = await resourceCache.getOrCreateResource(
      videoUrl,
      "video"
    );

    // Load the source video to get its dimensions and duration
    const videoSource = await VideoSource.from(processedVideoUrl);
    const videoDuration = 8;

    // Calculate dimensions based on aspect ratio
    let originalWidth: number;
    let originalHeight: number;

    // All videos are rendered at 720p resolution from Vertex AI
    switch (aspectRatio) {
      case "9:16":
        originalWidth = 720;
        originalHeight = 1280;
        break;
      case "16:9":
        originalWidth = 1280;
        originalHeight = 720;
        break;
      case "1:1":
        originalWidth = 720;
        originalHeight = 720;
        break;
      case "4:5":
        originalWidth = 720;
        originalHeight = 900;
        break;
      default:
        // Default to 16:9 if unknown
        originalWidth = 1280;
        originalHeight = 720;
    }

    // Calculate the height after cropping
    const croppedHeight = originalHeight - cropPixels * 2;

    // Create composition with cropped dimensions
    const composition = new Composition({
      width: originalWidth,
      height: croppedHeight,
    });

    // Clear composition first
    composition.pause();
    composition.clear();

    // Create video clip with cropping
    // We scale the video height to match original, which effectively crops top/bottom
    const videoClip = new VideoClip(videoSource, {
      muted: false,
      position: "center",
      width: "100%",
      // height: `${(originalHeight / croppedHeight) * 100}%`, // Scale to fill cropped area
      delay: new Timestamp(0),
      duration: new Timestamp(videoDuration * 1000),
      volume: 1,
      // Offset to crop from top and bottom equally
      top: `-${(cropPixels / croppedHeight) * 100}%`,
    });

    await composition.add(videoClip);

    // Set composition duration
    composition.duration = new Timestamp(videoDuration * 1000).frames;

    // Render the composition
    const encoder = new Encoder(composition);
    const blob = await encoder.render();

    if (!blob) {
      return {
        ok: false,
        error: "Failed to render cropped video",
      };
    }

    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    return {
      ok: true,
      blob: Array.from(uint8Array),
    };
  } catch (error) {
    console.error("Error in cropVideoBrowser:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Browser-side rendering function
export async function renderVideo({
  timeline,
  showWatermark,
  format,
  bRollItems,
  aspectRatio,
  textOverlay,
  utils,
}: {
  timeline: { scenes: Scene[]; audio: Audio[] };
  showWatermark: boolean;
  format: string;
  bRollItems?: Array<{
    url: string;
    duration: number;
    aspectRatio?: string;
    type?: "video" | "image";
  }>;
  aspectRatio?: string;
  textOverlay?: string;
  utils: {
    ResourceCacheSource: string;
    getVideoDimensionsSource: string;
    getWatermarkPositionSource: string;
  };
}) {
  // Access core from window object in browser context
  const {
    Composition,
    Encoder,
    VideoSource,
    AudioSource,
    VideoClip,
    AudioClip,
    ImageSource,
    ImageClip,
    Timestamp,
    Transcript,
  } = (window as any).core;

  // Recreate utility functions from source strings
  const ResourceCache = eval(`(${utils.ResourceCacheSource})`);
  const resourceCache = new ResourceCache();
  const getVideoDimensions = eval(`(${utils.getVideoDimensionsSource})`);
  const getWatermarkPosition = eval(`(${utils.getWatermarkPositionSource})`);

  // Initialize composition with correct aspect ratio dimensions
  // Use aspectRatio if provided, otherwise fallback to format for backward compatibility
  const dimensionFormat = aspectRatio || format;
  const dimensions = getVideoDimensions(dimensionFormat);
  const composition = new Composition({
    width: dimensions.width,
    height: dimensions.height,
  });

  // Create TikTokCaptionPreset directly in browser context
  class TikTokCaptionPreset {
    type: string;
    position: any;

    constructor() {
      this.type = "caption";
      this.position = { x: "50%", y: "90%" };
    }

    async apply(track: any, transcript: any, offset: any) {
      try {
        const { FontManager, TextClip } = (window as any).core;

        const font = await FontManager.load({
          family: "Inter",
          source:
            "https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_fjbvMwCp50BTca1ZL7W0Q5nw.woff2",
          weight: "700",
        });

        // Iterate through transcript words
        for (const words of Array.from(
          transcript.iter({ count: [1] })
        ) as any[]) {
          await track.add(
            new TextClip({
              text: words.text,
              delay: words.start.add(offset),
              duration: words.duration,
              font,
              align: "left",
              baseline: "top",
              color: "#FFFFFF",
              leading: 1.4,
              fontSize: 16,
              stroke: {
                color: "#000000",
                width: 4,
                lineJoin: "round",
              },
              position: this.position,
            })
          );
        }
      } catch (error) {
        console.error("Error in TikTokCaptionPreset.apply:", error);
        throw error;
      }
    }

    async applyTo(track: any) {
      const { Transcript, Timestamp } = (window as any).core;
      await this.apply(track, new Transcript([]), new Timestamp(0));
    }
  }

  try {
    // Clear composition first
    composition.pause();
    composition.clear();

    // Process scenes
    const validScenes = timeline.scenes.filter(
      (scene) =>
        scene.status !== "failed" && scene.id && (scene.video || scene.image)
    );

    // Add video/image clips
    for (const scene of validScenes) {
      const startAt = scene.startAt || 0;
      const duration = scene.duration;

      try {
        if (scene.video) {
          const videoUrl = await resourceCache.getOrCreateResource(
            scene.video,
            "video"
          );
          const videoSource = await VideoSource.from(videoUrl);
          const videoClip = new VideoClip(videoSource, {
            muted: false,
            position: "center",
            width: "100%",
            delay: new Timestamp(startAt * 1000),
            duration: new Timestamp(duration * 1000),
            volume: 0.1,
          });
          await composition.add(videoClip);
        } else if (scene.image) {
          const imageSource = await ImageSource.from(scene.image);
          const imageClip = new ImageClip(imageSource, {
            delay: new Timestamp(startAt * 1000),
            duration: new Timestamp(duration * 1000),
            position: "center",
            height: "100%",
          });
          await composition.add(imageClip);
        }
      } catch (error) {
        console.error(`Failed to add clip for scene ${scene.id}:`, {
          message: error instanceof Error ? error.message : String(error),
          sceneId: scene.id,
          hasVideo: !!scene.video,
          hasImage: !!scene.image,
        });
        continue;
      }
    }

    const audioTasks = timeline.audio
      .filter((audio) => audio.type === "audio" && audio.src)
      .map(async (audio) => {
        try {
          // Retry audio source creation
          const audioSource = await AudioSource.from(audio.src as string);

          if (!audioSource) {
            return;
          }

          const startAt =
            audio.startAt && audio.startAt >= 0 ? audio.startAt : 0;

          const audioClip = await composition.add(
            new AudioClip(audioSource, {
              transcript: audio.transcript
                ? Transcript.fromJSON(audio.transcript as any)
                : undefined,
              delay: new Timestamp(startAt * 1000),
              volume: audio.voice === "veo3-extracted" ? 0 : undefined, // Mute extracted audio by default
            })
          );

          // Add captions if transcript exists
          if (audio.transcript && audioClip) {
            try {
              // Ensure transcript is properly parsed
              const transcriptData = audio.transcript as any;

              // Log transcript structure for debugging
              console.log("Processing transcript for audio:", {
                audioId: audio.id,
                hasTranscript: !!transcriptData,
                transcriptType: typeof transcriptData,
              });

              // Create caption track from the audio clip
              const captionTrack = await composition.createTrack("caption");

              // Add the audio clip to the caption track
              await captionTrack.from(audioClip);

              // Apply the TikTok caption preset
              const captionPreset = new TikTokCaptionPreset();
              const transcript = Transcript.fromJSON(transcriptData);
              console.log();
              await captionPreset.apply(
                captionTrack,
                transcript,
                new Timestamp(startAt * 1000)
              );

              console.log("Successfully added captions for audio:", audio.id);
            } catch (captionError) {
              // Improved error logging
              const errorMessage =
                captionError instanceof Error
                  ? captionError.message
                  : typeof captionError === "object"
                    ? JSON.stringify(captionError)
                    : String(captionError);

              console.error("Failed to add captions:", errorMessage);
              console.error("Audio ID:", audio.id);
              console.error(
                "Transcript data:",
                JSON.stringify(audio.transcript)
              );

              // Continue without captions rather than failing
            }
          }
        } catch (error) {
          console.error("Failed to add audio after retries:", {
            message: error instanceof Error ? error.message : String(error),
            audioId: audio.id,
            audioSrc: audio.src,
          });
        }
      });

    const music = timeline.audio.find((a) => a.type === "music" && a.src);

    if (music) {
      try {
        const musicSource = await AudioSource.from(music.src as string);

        if (musicSource) {
          await composition.add(
            new AudioClip(musicSource, {
              delay: new Timestamp(0),
              volume: 0.1,
            })
          );
        }
      } catch (error) {
        console.error("Failed to add background music after retries:", {
          message: error instanceof Error ? error.message : String(error),
          musicSrc: music.src,
        });
      }
    }

    await Promise.allSettled(audioTasks);

    // Calculate the end time of main content
    let mainContentEndTime = 0;
    if (validScenes.length > 0) {
      mainContentEndTime = Math.max(
        ...validScenes.map((scene) => (scene.startAt || 0) + scene.duration)
      );
    }

    // Add B-roll clips at the end of the main content
    let bRollStartTime = mainContentEndTime;

    // Filter B-rolls to only include those matching the current aspect ratio
    const filteredBRolls =
      bRollItems?.filter((item) => {
        // If aspectRatio is not specified (legacy), include it
        if (!item.aspectRatio) return true;
        // Otherwise, only include if it matches the current render aspect ratio
        return item.aspectRatio === aspectRatio;
      }) || [];

    if (filteredBRolls.length > 0) {
      console.log(
        `Adding B-roll clips for aspect ratio ${aspectRatio}:`,
        filteredBRolls.length
      );

      for (const bRollItem of filteredBRolls) {
        try {
          const itemDuration = bRollItem.duration || 3; // Default duration
          const itemType =
            bRollItem.type ||
            (bRollItem.url.match(/\.(mp4|webm|mov)$/i) ? "video" : "image");

          if (itemType === "image") {
            // Handle image B-roll
            const imageUrl = await resourceCache.getOrCreateResource(
              bRollItem.url,
              "image"
            );

            const imageSource = await ImageSource.from(imageUrl);

            const imageClip = new ImageClip(imageSource, {
              position: "center",
              height: "100%",
              delay: new Timestamp(bRollStartTime * 1000),
              duration: new Timestamp(itemDuration * 1000),
            });

            await composition.add(imageClip);

            console.log(
              `Added B-roll image: ${bRollItem.url}, duration: ${itemDuration}s`
            );
          } else {
            // Handle video B-roll
            const videoUrl = await resourceCache.getOrCreateResource(
              bRollItem.url,
              "video"
            );

            const videoSource = await VideoSource.from(videoUrl);

            const videoClip = new VideoClip(videoSource, {
              muted: false,
              position: "center",
              width: "100%",
              delay: new Timestamp(bRollStartTime * 1000),
              duration: new Timestamp(itemDuration * 1000),
              volume: 0.1,
            });

            await composition.add(videoClip);

            console.log(
              `Added B-roll video: ${bRollItem.url}, duration: ${itemDuration}s`
            );
          }

          // Update start time for next B-roll clip
          bRollStartTime += itemDuration;
        } catch (error) {
          console.error(`Failed to add B-roll clip:`, {
            message: error instanceof Error ? error.message : String(error),
            bRollUrl: bRollItem.url,
            type: bRollItem.type,
          });
          // Continue with other B-roll clips even if one fails
        }
      }
    }

    // Calculate total duration including B-roll
    const totalDuration = bRollStartTime;

    // Add watermark if requested (extend to cover B-roll as well)

    // HIDE WATERMARK FOR NOW
    // if (validScenes.length > 0 && showWatermark) {
    //   try {
    //     const position = getWatermarkPosition(dimensionFormat);
    //
    //     const watermarkUrl = "/watermark.svg";
    //     const source = await ImageSource.from(watermarkUrl);
    //
    //     const image = new ImageClip(source, {
    //       delay: 0,
    //       duration: totalDuration * 1000,
    //       position: position,
    //       height: "3%",
    //     });
    //
    //     await composition.add(image);
    //   } catch (error) {
    //     console.error("Failed to add watermark:", {
    //       message: error instanceof Error ? error.message : String(error),
    //       format: format,
    //     });
    //   }
    // }

    // Add text overlay if provided
    if (textOverlay && totalDuration > 0) {
      try {
        const { FontManager, TextClip } = (window as any).core;

        // Helper function to break text into lines
        function breakTextIntoLines(
          text: string,
          numberOfLines: number = 2
        ): string {
          const words = text.split(" ");
          const wordsPerLine = Math.ceil(words.length / numberOfLines);
          const lines: string[] = [];

          for (let i = 0; i < numberOfLines; i++) {
            const start = i * wordsPerLine;
            const end = start + wordsPerLine;
            const lineWords = words.slice(start, end);
            if (lineWords.length > 0) {
              lines.push(lineWords.join(" "));
            }
          }

          return lines.join("\n");
        }

        // Load gradient background image
        const gradientUrl = "/text-overlay-gradient.png";
        const gradientSource = await ImageSource.from(gradientUrl);

        // Add gradient background (top 25% of video)
        const gradientClip = new ImageClip(gradientSource, {
          delay: 0,
          duration: totalDuration * 1000,
          position: { x: "0%", y: "0%" },
          width: "100%",
          height: "25%",
        });

        await composition.add(gradientClip);

        // Load Inter Bold font
        const font = await FontManager.load({
          family: "Inter",
          source:
            "https://cdn.jsdelivr.net/npm/futura-font@1.0.0/FuturaBT-Medium.woff",
          weight: "700",
        });

        // Format text with line breaks
        const formattedText = breakTextIntoLines(textOverlay, 2);

        // Add text overlay
        const textClip = new TextClip({
          text: formattedText,
          delay: 0,
          duration: totalDuration * 1000,
          font,
          align: "center",
          baseline: "top",
          color: "#FFFFFF",
          fontSize: 13,
          stroke: {
            color: "#000000",
            width: 2,
            lineJoin: "round",
          },
          position: { x: "50%", y: "10%" },
        });

        await composition.add(textClip);

        console.log("Successfully added text overlay:", textOverlay);
      } catch (error) {
        console.error("Failed to add text overlay:", {
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Set composition duration to include B-roll
    if (totalDuration > 0) {
      composition.duration = new Timestamp(totalDuration * 1000).frames;
    }

    // Render the composition
    const encoder = new Encoder(composition);
    const blob = await encoder.render();

    if (!blob) {
      return {
        ok: false,
        error: "Failed to render video",
      };
    }

    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    return {
      ok: true,
      blob: Array.from(uint8Array),
    };
  } catch (error) {
    console.error("Error in renderVideoBrowser:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}
