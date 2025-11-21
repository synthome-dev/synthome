/**
 * Concatenate multiple video segments into one
 */

import ffmpeg from "fluent-ffmpeg";

export async function concatenateSegments(
  segmentPaths: string[],
  outputPath: string,
): Promise<void> {
  let command = ffmpeg();

  // Add all segment inputs
  for (const segmentPath of segmentPaths) {
    command = command.input(segmentPath);
  }

  // Build concat filter - inputs must be interleaved [0:v][0:a][1:v][1:a]...
  const interleavedInputs = segmentPaths
    .map((_, i) => `[${i}:v][${i}:a]`)
    .join("");
  const filterComplex = `${interleavedInputs}concat=n=${segmentPaths.length}:v=1:a=1[outv][outa]`;

  await new Promise<void>((resolve, reject) => {
    command
      .complexFilter(filterComplex)
      .outputOptions(["-map", "[outv]", "-map", "[outa]"])
      .videoCodec("libx264")
      .audioCodec("aac")
      .toFormat("mp4")
      .on("start", (commandLine: string) =>
        console.log("[Concat] FFmpeg command:", commandLine),
      )
      .on("error", reject)
      .save(outputPath)
      .on("end", resolve);
  });
}
