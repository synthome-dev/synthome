import { nanoid } from "nanoid";
import ffmpeg from "fluent-ffmpeg";
import { tmpdir } from "os";
import { join } from "path";
import { unlink } from "fs/promises";
import type { MergeMediaOptions, MergeVideosOptions } from "../core/types";
import { streamToDisk } from "../core/utils";

/**
 * Legacy merge function for backwards compatibility
 * Only merges videos without audio support
 */
export async function mergeVideos(
  options: MergeVideosOptions,
): Promise<string> {
  // Convert to new format and call mergeMedia
  const items = options.videos.map((v) => ({
    url: v.url,
    type: "video" as const,
  }));

  return mergeMedia({ items });
}

/**
 * Get media duration using ffprobe
 */
async function getMediaDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(metadata.format.duration || 0);
    });
  });
}

/**
 * Get media dimensions using ffprobe
 */
async function getMediaDimensions(
  filePath: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      const videoStream = metadata.streams.find(
        (s) => s.codec_type === "video",
      );
      resolve({
        width: videoStream?.width || 1920,
        height: videoStream?.height || 1080,
      });
    });
  });
}

/**
 * Check if media file has an audio stream
 */
async function hasAudioStream(filePath: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      const audioStream = metadata.streams.find(
        (s) => s.codec_type === "audio",
      );
      resolve(!!audioStream);
    });
  });
}

/**
 * Processed visual item with metadata
 */
interface ProcessedVisualItem {
  path: string;
  hasAudio: boolean;
  duration: number;
  volume: number;
}

/**
 * Merge multiple media items (videos, images) with optional audio overlays
 * Preserves video audio tracks and supports volume control
 * Returns the path to the output file (caller must handle cleanup)
 */
export async function mergeMedia(options: MergeMediaOptions): Promise<string> {
  const tempFiles: string[] = [];
  const outputPath = join(tmpdir(), `${nanoid()}.mp4`);

  try {
    console.log(
      `[MergeMedia] Processing ${options.items.length} items, ${options.audio?.length || 0} audio tracks`,
    );

    // Separate visual items and audio items
    const visualItems = options.items;
    const audioItems = options.audio || [];

    if (visualItems.length === 0) {
      throw new Error("At least one visual item (video or image) is required");
    }

    // Step 1: Download and process all visual items
    const processedVisualItems: ProcessedVisualItem[] = [];
    let targetWidth = 0;
    let targetHeight = 0;

    for (let i = 0; i < visualItems.length; i++) {
      const item = visualItems[i];
      console.log(
        `[MergeMedia] Downloading visual item ${i + 1}/${visualItems.length}: ${item.url}`,
      );

      // Determine file extension
      const ext = item.type === "image" ? "jpg" : "mp4";
      const inputPath = join(tmpdir(), `${nanoid()}_input.${ext}`);

      // Stream directly to disk - avoids loading entire file into RAM
      await streamToDisk(item.url, inputPath);
      tempFiles.push(inputPath);

      // Get dimensions from first item to use as target
      if (i === 0) {
        const dims = await getMediaDimensions(inputPath);
        targetWidth = dims.width;
        targetHeight = dims.height;
        console.log(
          `[MergeMedia] Using target dimensions: ${targetWidth}x${targetHeight}`,
        );
      }

      const volume = item.volume ?? 1;

      if (item.type === "image") {
        // Convert image to video with specified duration (no audio)
        const duration = item.duration || 1;
        const videoPath = join(tmpdir(), `${nanoid()}_img2vid.mp4`);
        tempFiles.push(videoPath);

        console.log(
          `[MergeMedia] Converting image to ${duration}s video: ${inputPath}`,
        );

        await new Promise<void>((resolve, reject) => {
          ffmpeg()
            .input(inputPath)
            .inputOptions(["-loop", "1"])
            .outputOptions([
              "-t",
              duration.toString(),
              "-vf",
              `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2,setsar=1`,
              "-pix_fmt",
              "yuv420p",
              "-r",
              "30",
            ])
            .videoCodec("libx264")
            .toFormat("mp4")
            .on("start", (cmd: string) =>
              console.log("[MergeMedia] Image to video command:", cmd),
            )
            .on("error", reject)
            .save(videoPath)
            .on("end", resolve);
        });

        processedVisualItems.push({
          path: videoPath,
          hasAudio: false,
          duration,
          volume,
        });
      } else {
        // Video item - scale to target dimensions and optionally trim
        // PRESERVE AUDIO if present
        const scaledPath = join(tmpdir(), `${nanoid()}_scaled.mp4`);
        tempFiles.push(scaledPath);

        const inputDuration = await getMediaDuration(inputPath);
        const outputDuration = item.duration || inputDuration;
        const videoHasAudio = await hasAudioStream(inputPath);

        console.log(
          `[MergeMedia] Processing video: duration ${inputDuration}s -> ${outputDuration}s, hasAudio: ${videoHasAudio}, volume: ${volume}`,
        );

        await new Promise<void>((resolve, reject) => {
          let cmd = ffmpeg().input(inputPath);

          // Apply duration trim if specified
          if (item.duration && item.duration < inputDuration) {
            cmd = cmd.outputOptions(["-t", item.duration.toString()]);
          }

          // Build output options - preserve audio if present
          const outputOpts = [
            "-vf",
            `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2,setsar=1`,
            "-pix_fmt",
            "yuv420p",
          ];

          if (videoHasAudio) {
            // Preserve audio with volume adjustment
            if (volume !== 1) {
              outputOpts.push("-af", `volume=${volume}`);
            }
            cmd
              .outputOptions(outputOpts)
              .videoCodec("libx264")
              .audioCodec("aac")
              .toFormat("mp4")
              .on("start", (cmdStr: string) =>
                console.log("[MergeMedia] Scale video command:", cmdStr),
              )
              .on("error", reject)
              .save(scaledPath)
              .on("end", resolve);
          } else {
            // No audio to preserve
            outputOpts.push("-an");
            cmd
              .outputOptions(outputOpts)
              .videoCodec("libx264")
              .toFormat("mp4")
              .on("start", (cmdStr: string) =>
                console.log("[MergeMedia] Scale video command:", cmdStr),
              )
              .on("error", reject)
              .save(scaledPath)
              .on("end", resolve);
          }
        });

        processedVisualItems.push({
          path: scaledPath,
          hasAudio: videoHasAudio,
          duration: outputDuration,
          volume,
        });
      }
    }

    // Step 2: Concatenate all visual items with audio
    const concatPath = join(tmpdir(), `${nanoid()}_concat.mp4`);
    tempFiles.push(concatPath);

    // Check if any visual items have audio
    const hasAnyVideoAudio = processedVisualItems.some((item) => item.hasAudio);

    console.log(
      `[MergeMedia] Concatenating ${processedVisualItems.length} visual items (hasAnyVideoAudio: ${hasAnyVideoAudio})`,
    );

    await new Promise<void>((resolve, reject) => {
      let cmd = ffmpeg();

      // Add all inputs
      for (const item of processedVisualItems) {
        cmd = cmd.input(item.path);
      }

      if (hasAnyVideoAudio) {
        // Some videos have audio - need to handle audio concatenation
        // For videos without audio, we need to generate silence
        const filterParts: string[] = [];
        const videoLabels: string[] = [];
        const audioLabels: string[] = [];

        for (let i = 0; i < processedVisualItems.length; i++) {
          const item = processedVisualItems[i];
          videoLabels.push(`[${i}:v]`);

          if (item.hasAudio) {
            audioLabels.push(`[${i}:a]`);
          } else {
            // Generate silence for items without audio
            const silenceLabel = `silence${i}`;
            filterParts.push(
              `anullsrc=channel_layout=stereo:sample_rate=44100[${silenceLabel}]`,
            );
            // Trim silence to match video duration
            const trimmedLabel = `strim${i}`;
            filterParts.push(
              `[${silenceLabel}]atrim=0:${item.duration}[${trimmedLabel}]`,
            );
            audioLabels.push(`[${trimmedLabel}]`);
          }
        }

        // Build concat filter for both video and audio
        const videoInputs = videoLabels.join("");
        const audioInputs = audioLabels.join("");
        filterParts.push(
          `${videoInputs}concat=n=${processedVisualItems.length}:v=1:a=0[outv]`,
        );
        filterParts.push(
          `${audioInputs}concat=n=${processedVisualItems.length}:v=0:a=1[outa]`,
        );

        cmd
          .complexFilter(filterParts)
          .outputOptions(["-map", "[outv]", "-map", "[outa]"])
          .videoCodec("libx264")
          .audioCodec("aac")
          .outputOptions(["-pix_fmt", "yuv420p"])
          .toFormat("mp4")
          .on("start", (cmdStr: string) =>
            console.log("[MergeMedia] Concat command:", cmdStr),
          )
          .on("error", reject)
          .save(concatPath)
          .on("end", resolve);
      } else {
        // No videos have audio - simple video-only concat
        const inputs = processedVisualItems.map((_, i) => `[${i}:v]`).join("");
        const filterComplex = `${inputs}concat=n=${processedVisualItems.length}:v=1:a=0[outv]`;

        cmd
          .complexFilter(filterComplex)
          .outputOptions(["-map", "[outv]"])
          .videoCodec("libx264")
          .outputOptions(["-pix_fmt", "yuv420p"])
          .toFormat("mp4")
          .on("start", (cmdStr: string) =>
            console.log("[MergeMedia] Concat command:", cmdStr),
          )
          .on("error", reject)
          .save(concatPath)
          .on("end", resolve);
      }
    });

    // Step 3: If no overlay audio items, we're done - return path, not buffer
    if (audioItems.length === 0) {
      console.log(
        "[MergeMedia] No overlay audio tracks, returning concatenated video",
      );
      // Move concat to output path and clean up other temp files
      const fs = await import("fs/promises");
      await fs.rename(concatPath, outputPath);
      // Remove concatPath from tempFiles since we renamed it
      const concatIndex = tempFiles.indexOf(concatPath);
      if (concatIndex > -1) tempFiles.splice(concatIndex, 1);
      return outputPath;
    }

    // Step 4: Get total video duration for audio trimming
    const totalVideoDuration = await getMediaDuration(concatPath);
    console.log(`[MergeMedia] Total video duration: ${totalVideoDuration}s`);

    // Step 5: Download and process audio overlay items
    const processedAudioPaths: Array<{
      path: string;
      offset: number;
      duration: number;
      volume: number;
    }> = [];

    for (let i = 0; i < audioItems.length; i++) {
      const audioItem = audioItems[i];
      console.log(
        `[MergeMedia] Downloading audio ${i + 1}/${audioItems.length}: ${audioItem.url}`,
      );

      // Detect audio format from URL
      const urlLower = audioItem.url.toLowerCase();
      let ext = "mp3";
      if (urlLower.includes(".wav")) ext = "wav";
      else if (urlLower.includes(".aac")) ext = "aac";
      else if (urlLower.includes(".m4a")) ext = "m4a";
      else if (urlLower.includes(".ogg")) ext = "ogg";

      const audioPath = join(tmpdir(), `${nanoid()}_audio.${ext}`);

      // Stream directly to disk - avoids loading entire file into RAM
      await streamToDisk(audioItem.url, audioPath);
      tempFiles.push(audioPath);

      const audioDuration = await getMediaDuration(audioPath);
      const offset = audioItem.offset || 0;
      const volume = audioItem.volume ?? 1;

      // Calculate effective duration (limited by video length)
      let effectiveDuration = audioItem.duration || audioDuration;
      if (offset + effectiveDuration > totalVideoDuration) {
        effectiveDuration = totalVideoDuration - offset;
      }

      if (effectiveDuration <= 0) {
        console.log(
          `[MergeMedia] Skipping audio ${i + 1} - offset ${offset}s exceeds video duration`,
        );
        continue;
      }

      console.log(
        `[MergeMedia] Audio ${i + 1}: offset=${offset}s, duration=${effectiveDuration}s, volume=${volume}`,
      );

      processedAudioPaths.push({
        path: audioPath,
        offset,
        duration: effectiveDuration,
        volume,
      });
    }

    // Step 6: Mix audio overlays with video (which may already have audio)
    if (processedAudioPaths.length === 0) {
      console.log(
        "[MergeMedia] No valid audio overlay tracks after processing, returning video",
      );
      // Move concat to output path and clean up other temp files
      const fs = await import("fs/promises");
      await fs.rename(concatPath, outputPath);
      const concatIndex = tempFiles.indexOf(concatPath);
      if (concatIndex > -1) tempFiles.splice(concatIndex, 1);
      return outputPath;
    }

    console.log(
      `[MergeMedia] Mixing ${processedAudioPaths.length} audio overlay tracks with video`,
    );

    // Check if concatenated video has audio
    const concatHasAudio = await hasAudioStream(concatPath);

    await new Promise<void>((resolve, reject) => {
      let cmd = ffmpeg().input(concatPath);

      // Add all audio inputs
      for (const audio of processedAudioPaths) {
        cmd = cmd.input(audio.path);
      }

      // Build audio filter complex
      const audioFilters: string[] = [];
      const audioOutputs: string[] = [];

      // Start index for audio inputs (after the video input)
      let audioInputIndex = 1;

      // If the concatenated video has audio, include it in the mix
      if (concatHasAudio) {
        audioFilters.push(
          `[0:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[vidaudio]`,
        );
        audioOutputs.push("[vidaudio]");
      }

      for (let i = 0; i < processedAudioPaths.length; i++) {
        const audio = processedAudioPaths[i];
        const inputIndex = audioInputIndex + i;
        const outputLabel = `a${i}`;

        // Build filter chain: volume -> trim -> delay (if needed)
        let filterChain = `[${inputIndex}:a]`;
        const filters: string[] = [];

        // Apply volume
        if (audio.volume !== 1) {
          filters.push(`volume=${audio.volume}`);
        }

        // Trim to effective duration
        filters.push(`atrim=0:${audio.duration}`);
        filters.push("asetpts=PTS-STARTPTS");

        // Format to consistent sample rate/channels
        filters.push(
          "aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo",
        );

        // Apply delay for offset
        if (audio.offset > 0) {
          const delayMs = Math.round(audio.offset * 1000);
          filters.push(`adelay=${delayMs}|${delayMs}`);
        }

        audioFilters.push(`${filterChain}${filters.join(",")}[${outputLabel}]`);
        audioOutputs.push(`[${outputLabel}]`);
      }

      // Mix all audio tracks together (or pass through if only one)
      if (audioOutputs.length === 1) {
        // Single audio track - just rename it to [outa], no mixing needed
        // Replace the last filter's output label with [outa]
        const lastFilterIndex = audioFilters.length - 1;
        audioFilters[lastFilterIndex] = audioFilters[lastFilterIndex].replace(
          /\[[^\]]+\]$/,
          "[outa]",
        );
      } else {
        // Multiple audio tracks - mix them together
        // Use weights=1 for each input to prevent volume reduction (compatible with FFmpeg 4.x+)
        // This replaces normalize=0 which is only available in FFmpeg 5.1+
        const weights = Array(audioOutputs.length).fill("1").join(" ");
        const mixFilter = `${audioOutputs.join("")}amix=inputs=${audioOutputs.length}:duration=longest:weights=${weights}[outa]`;
        audioFilters.push(mixFilter);
      }

      cmd
        .complexFilter(audioFilters)
        .outputOptions(["-map", "0:v", "-map", "[outa]"])
        .videoCodec("copy") // Copy video stream, no re-encode needed
        .audioCodec("aac")
        .toFormat("mp4")
        .on("start", (cmdStr: string) =>
          console.log("[MergeMedia] Audio mix command:", cmdStr),
        )
        .on("error", reject)
        .save(outputPath)
        .on("end", resolve);
    });

    // Return path to output file - caller streams it
    return outputPath;
  } finally {
    // Cleanup all temp files (but NOT outputPath - caller handles that)
    try {
      await Promise.all([
        ...tempFiles.map((file) => unlink(file).catch(() => {})),
      ]);
    } catch (e) {
      console.error("[MergeMedia] Cleanup error:", e);
    }
  }
}
