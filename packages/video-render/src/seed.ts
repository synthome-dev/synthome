import {
  AudioClip,
  AudioSource,
  Composition,
  ImageClip,
  ImageSource,
  Timestamp,
  Transcript,
  VideoClip,
  VideoSource,
} from "@diffusionstudio/core";

import type { Audio, Scene } from "@repo/db";
import { VideoFormat } from "@repo/providers";
import { TikTokCaptionPreset } from "./captions/captions";
import { ResourceCache } from "./resource-cache";
import { retryWithBackoff } from "./utils";
import { getWatermarkPosition } from "./utils/watermark-position";

const resourceCache = new ResourceCache();

export async function seed(
  composition: Composition,
  timeline: { scenes: Scene[]; audio: Audio[] },
  abortSignal: AbortSignal,
  showWatermark: boolean,
  format: VideoFormat,
) {
  if (abortSignal.aborted) {
    return;
  }

  try {
    // Clear composition first
    composition.pause();
    composition.clear();

    if (abortSignal.aborted) {
      return;
    }

    // Process scenes with better error handling
    const validScenes = timeline.scenes.filter(
      (scene) => scene.status !== "failed" && scene.id && scene.video,
    );

    // Load video sources with improved error handling
    const videoSourcePromises = validScenes.map(async (scene) => {
      if (abortSignal.aborted) {
        return { source: null, sceneId: scene.id, scene };
      }

      try {
        let source: VideoSource | null = null;

        if (scene.video) {
          // Retry the entire video source creation process
          source = await retryWithBackoff(
            async () => {
              if (abortSignal.aborted) {
                return null;
              }

              const resourceUrl = await resourceCache.getOrCreateResource(
                scene.video as string,
                "video",
              );

              if (abortSignal.aborted) {
                return null;
              }

              // This is where the actual VideoSource creation might fail intermittently
              return await VideoSource.from(resourceUrl);
            },
            3,
            1000,
            abortSignal,
          );
        }

        return { source, sceneId: scene.id, scene };
      } catch (error) {
        console.error(
          `Failed to load video source for scene ${scene.id} after retries:`,
          error,
        );
        // Return fallback to image if video fails after all retries
        return { source: null, sceneId: scene.id, scene };
      }
    });

    // Wait for all video sources with timeout
    const videoSources = await Promise.allSettled(videoSourcePromises);

    if (abortSignal.aborted) {
      return;
    }

    // Add clips to composition
    for (const result of videoSources) {
      if (abortSignal.aborted) {
        return;
      }

      if (result.status === "fulfilled") {
        const { source: videoSource, scene } = result.value;
        const startAt = scene.startAt || 0;
        const duration = scene.duration;

        try {
          if (!videoSource && scene.image) {
            // Fallback to image
            const imageSource = await ImageSource.from(scene.image as string);
            const image = new ImageClip(imageSource, {
              delay: new Timestamp(startAt * 1000),
              duration: new Timestamp(duration * 1000),
              position: "center",
              height: "100%",
            });
            await composition.add(image);
          } else if (videoSource) {
            // Add video clip
            const videoClip = new VideoClip(videoSource, {
              muted: false,
              position: "center",
              height: "100%",
              delay: new Timestamp(startAt * 1000),
              duration: new Timestamp(duration * 1000),
              volume: 0.1,
            });
            await composition.add(videoClip);
          }
        } catch (error) {
          console.error(`Failed to add clip for scene ${scene.id}:`, error);
          // Continue with next scene rather than failing completely
        }
      }
    }

    if (abortSignal.aborted) {
      return;
    }

    // Add audio with improved error handling
    const audioTasks = timeline.audio
      .filter((audio) => audio.type === "audio" && audio.src)
      .map(async (audio) => {
        if (abortSignal.aborted) {
          return;
        }

        try {
          // Retry audio source creation
          const audioSource = await retryWithBackoff(
            async () => {
              if (abortSignal.aborted) {
                return null;
              }
              return await AudioSource.from(audio.src as string);
            },
            3,
            1000,
            abortSignal,
          );

          if (!audioSource) {
            return;
          }

          const startAt = audio.startAt || 0;

          const audioClip = await composition.add(
            new AudioClip(audioSource, {
              transcript: audio.transcript
                ? Transcript.fromJSON(audio.transcript as any)
                : undefined,
              delay: new Timestamp(startAt * 1000),
            }),
          );

          // Add captions if transcript exists
          if (audio.transcript) {
            try {
              const transcript = Transcript.fromJSON(audio.transcript as any);
              const captionTrack = await composition
                .createTrack("caption")
                .from(audioClip);

              const captionPreset = new TikTokCaptionPreset();
              await captionPreset.apply(
                captionTrack,
                transcript,
                new Timestamp(startAt * 1000),
              );
            } catch (captionError) {
              console.error("Failed to add captions:", captionError);
              // Continue without captions rather than failing
            }
          }
        } catch (error) {
          console.error("Failed to add audio after retries:", error);
          // Continue without this audio track
        }
      });

    // Add background music
    const music = timeline.audio.find((a) => a.type === "music" && a.src);
    if (music) {
      try {
        // Retry music source creation
        const musicSource = await retryWithBackoff(
          async () => {
            if (abortSignal.aborted) {
              return null;
            }
            return await AudioSource.from(music.src as string);
          },
          3,
          1000,
          abortSignal,
        );

        if (musicSource) {
          await composition.add(
            new AudioClip(musicSource, {
              delay: new Timestamp(0),
              volume: 0.1,
            }),
          );
        }
      } catch (error) {
        console.error("Failed to add background music after retries:", error);
        // Continue without background music
      }
    }

    // Add sound effects
    const soundEffects = timeline.audio.filter(
      (a) => a.type === "soundEffects" && a.src,
    );
    if (soundEffects.length > 0) {
      try {
        // Process each sound effect
        for (const soundEffect of soundEffects) {
          // Retry sound effect source creation
          const effectSource = await retryWithBackoff(
            async () => {
              if (abortSignal.aborted) {
                return null;
              }

              return await AudioSource.from(soundEffect.src as string);
            },
            3,
            1000,
            abortSignal,
          );

          if (effectSource) {
            await composition.add(
              new AudioClip(effectSource, {
                delay: new Timestamp((soundEffect.startAt || 0) * 1000),
                duration: new Timestamp((soundEffect.duration || 7) * 1000),
                volume: 0.5, // Higher volume for sound effects
              }),
            );
          }
        }
      } catch (error) {
        console.error("Failed to add sound effects after retries:", error);
        // Continue without sound effects
      }
    }

    // Wait for all audio processing
    await Promise.allSettled(audioTasks);

    if (abortSignal.aborted) {
      return;
    }

    // Add watermark LAST (so it appears on top of everything)
    if (validScenes.length > 0 && showWatermark) {
      try {
        // Try local watermark first, fallback to a test image
        let watermarkUrl = "/watermark.svg";
        const source = await ImageSource.from(watermarkUrl);
        const maxEndAt = Math.max(
          ...validScenes.map((scene) => (scene.startAt || 0) + scene.duration),
        );
        const position = getWatermarkPosition(format);
        const image = new ImageClip(source, {
          delay: 0,
          duration: maxEndAt * 1000,
          position: position,
          height: "3%",
        });

        await composition.add(image);
      } catch (error) {
        console.error("Failed to add watermark:", error);
      }
    }

    // Set composition duration
    if (validScenes.length > 0) {
      const maxEndAt = Math.max(
        ...validScenes.map((scene) => (scene.startAt || 0) + scene.duration),
      );
      composition.duration = new Timestamp(maxEndAt * 1000).frames;
    }
  } catch (error) {
    console.error("Error in seed function:", error);
    // Don't throw error, just log it and continue
  }
}
