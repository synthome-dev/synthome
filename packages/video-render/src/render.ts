import type { VideoFormat } from "@repo/providers";
import { getVideoDimensions } from "./utils/format-dimensions";
import { getWatermarkPosition } from "./utils/watermark-position";

export async function renderVideo({
  timeline,
  showWatermark,
  format,
}: {
  timeline: { scenes: any[]; audio: any[] };
  showWatermark: boolean;
  format: string;
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
  } = (window as any).core;

  // Initialize composition with correct aspect ratio dimensions
  const dimensions = getVideoDimensions(format as VideoFormat);
  const composition = new Composition({
    width: dimensions.width,
    height: dimensions.height,
  });

  try {
    // Clear composition first
    composition.pause();
    composition.clear();

    // Process scenes
    const validScenes = timeline.scenes.filter(
      (scene) =>
        scene.status !== "failed" && scene.id && (scene.video || scene.image),
    );

    // Add video/image clips
    for (const scene of validScenes) {
      const startAt = scene.startAt || 0;
      const duration = scene.duration;

      try {
        if (scene.video) {
          const videoSource = await VideoSource.from(scene.video);
          const videoClip = new VideoClip(videoSource, {
            muted: false,
            position: "center",
            height: "100%",
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
        console.error(`Failed to add clip for scene ${scene.id}:`, error);
        continue;
      }
    }

    // Add audio clips
    for (const audio of timeline.audio) {
      if (!audio.url) continue;

      try {
        const audioSource = await AudioSource.from(audio.url);
        const audioClip = new AudioClip(audioSource, {
          delay: new Timestamp((audio.startAt || 0) * 1000),
          duration: new Timestamp(audio.duration * 1000),
          volume: audio.volume || 1,
        });
        await composition.add(audioClip);
      } catch (error) {
        console.error(`Failed to add audio clip ${audio.id}:`, error);
        continue;
      }
    }

    // Add watermark if requested
    if (validScenes.length > 0 && showWatermark) {
      try {
        const position = getWatermarkPosition(format as VideoFormat);

        const watermarkUrl = "/watermark.svg";
        const source = await ImageSource.from(watermarkUrl);
        const maxEndAt = Math.max(
          ...validScenes.map((scene) => (scene.startAt || 0) + scene.duration),
        );

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

    // Render the composition
    const encoder = new Encoder(composition);
    const blob = await encoder.render();

    if (!blob) {
      throw new Error("Failed to render video");
    }

    return blob;
  } catch (error) {
    console.error("Error in renderVideoBrowser:", error);
    throw error;
  }
}
