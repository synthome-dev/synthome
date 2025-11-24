/**
 * Stitch multiple background images/videos into a single continuous video
 * This prevents blinking when transitioning between backgrounds
 *
 * Problem: When processing timeline layers with multiple background images, the old approach
 * would split the main video into segments, process each segment separately, then concatenate.
 * This caused frame drops and blinking at transition points due to multiple re-encodes.
 *
 * Solution: Pre-stitch all background images into a single continuous background video,
 * then overlay the main video ONCE in a single pass. This eliminates blinking and improves
 * quality by avoiding multiple re-encoding passes.
 *
 * Example: For a 60s video with 6 background images (10s each):
 * 1. Stitch backgrounds: image1(10s) + image2(10s) + ... + image6(10s) = 60s background
 * 2. Single FFmpeg pass: background + main video + overlays = final output (no blinking!)
 */

import ffmpeg from "fluent-ffmpeg";
import { join } from "path";
import { tmpdir } from "os";
import { nanoid } from "nanoid";

export interface BackgroundSegment {
  mediaPath: string;
  duration: number;
  isVideo: boolean;
}

/**
 * Stitch background segments into a single continuous video
 * @param segments Array of background segments with their paths and durations
 * @param outputWidth Target width for all backgrounds
 * @param outputHeight Target height for all backgrounds
 * @param outputPath Where to save the stitched background video
 * @param tempFiles Array to track temporary files for cleanup
 */
export async function stitchBackgrounds(
  segments: BackgroundSegment[],
  outputWidth: number,
  outputHeight: number,
  outputPath: string,
  tempFiles: string[],
): Promise<void> {
  console.log(
    `[BackgroundStitcher] Stitching ${segments.length} background segments`,
  );
  console.log(
    `[BackgroundStitcher] Target resolution: ${outputWidth}x${outputHeight}`,
  );

  // If only one segment, just process it directly
  if (segments.length === 1) {
    console.log("[BackgroundStitcher] Single segment - processing directly");
    await processSingleBackground(
      segments[0],
      outputWidth,
      outputHeight,
      outputPath,
    );
    return;
  }

  // Process each segment into a normalized video clip
  const normalizedSegmentPaths: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const segmentPath = join(tmpdir(), `${nanoid()}_bg_seg_${i}.mp4`);
    tempFiles.push(segmentPath);

    console.log(
      `[BackgroundStitcher] Processing segment ${i + 1}/${segments.length}: ${segment.duration}s`,
    );

    await processSingleBackground(
      segment,
      outputWidth,
      outputHeight,
      segmentPath,
    );

    normalizedSegmentPaths.push(segmentPath);
  }

  // Concatenate all normalized segments using concat demuxer
  console.log(
    `[BackgroundStitcher] Concatenating ${normalizedSegmentPaths.length} segments`,
  );
  await concatenateNormalizedSegments(normalizedSegmentPaths, outputPath);

  console.log(`[BackgroundStitcher] Stitching complete: ${outputPath}`);
}

/**
 * Process a single background segment (image or video) to a normalized video clip
 */
async function processSingleBackground(
  segment: BackgroundSegment,
  outputWidth: number,
  outputHeight: number,
  outputPath: string,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const command = ffmpeg(segment.mediaPath);

    if (segment.isVideo) {
      // Video processing: scale and trim/loop to duration
      command
        .complexFilter([
          `[0:v]scale=${outputWidth}:${outputHeight}:force_original_aspect_ratio=decrease,pad=${outputWidth}:${outputHeight}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v]`,
        ])
        .outputOptions([
          "-map",
          "[v]",
          "-t",
          segment.duration.toString(),
          "-an", // No audio for backgrounds
        ]);
    } else {
      // For images: loop to create video of specified duration
      command
        .complexFilter([
          `[0:v]loop=loop=-1:size=1:start=0,scale=${outputWidth}:${outputHeight}:force_original_aspect_ratio=decrease,pad=${outputWidth}:${outputHeight}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,trim=duration=${segment.duration},setpts=PTS-STARTPTS[v]`,
        ])
        .outputOptions(["-map", "[v]"]);
    }

    command
      .videoCodec("libx264")
      .outputOptions([
        "-pix_fmt",
        "yuv420p",
        "-preset",
        "fast", // Fast encoding for intermediate files
      ])
      .toFormat("mp4")
      .on("start", (commandLine: string) =>
        console.log(`[BackgroundStitcher] FFmpeg:`, commandLine),
      )
      .on("error", (err) => {
        console.error(`[BackgroundStitcher] Error:`, err);
        reject(err);
      })
      .save(outputPath)
      .on("end", resolve);
  });
}

/**
 * Concatenate normalized video segments using FFmpeg concat filter
 * All segments must have the same resolution, codec, and fps
 */
async function concatenateNormalizedSegments(
  segmentPaths: string[],
  outputPath: string,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let command = ffmpeg();

    // Add all inputs
    for (const segmentPath of segmentPaths) {
      command = command.input(segmentPath);
    }

    // Build concat filter
    const inputs = segmentPaths.map((_, i) => `[${i}:v]`).join("");
    const filterComplex = `${inputs}concat=n=${segmentPaths.length}:v=1:a=0[outv]`;

    command
      .complexFilter(filterComplex)
      .outputOptions(["-map", "[outv]"])
      .videoCodec("libx264")
      .outputOptions(["-pix_fmt", "yuv420p", "-preset", "fast"])
      .toFormat("mp4")
      .on("start", (commandLine: string) =>
        console.log(`[BackgroundStitcher] Concat FFmpeg:`, commandLine),
      )
      .on("error", (err) => {
        console.error(`[BackgroundStitcher] Concat error:`, err);
        reject(err);
      })
      .save(outputPath)
      .on("end", () => {
        console.log(`[BackgroundStitcher] Concat complete`);
        resolve();
      });
  });
}
