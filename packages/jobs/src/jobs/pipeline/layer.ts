import { storage } from "@repo/storage";
import type PgBoss from "pg-boss";
import { BasePipelineJob, type PipelineJobData } from "./base-pipeline-job.js";

export class LayerJob extends BasePipelineJob {
  readonly type: string = "layer";

  /**
   * Helper function to resolve job dependencies to media URLs
   * Supports: _videoJobDependency, _imageJobDependency, _audioJobDependency
   * Handles both result formats: { outputs: [{ url }] } and { url }
   */
  private resolveMediaDependency(
    mediaItem: string,
    dependencies: Record<string, any>,
  ): string | null {
    // Check for video dependency
    if (mediaItem.startsWith("_videoJobDependency:")) {
      const jobId = mediaItem.replace("_videoJobDependency:", "");
      return this.extractUrlFromDependency(jobId, dependencies, "video");
    }

    // Check for image dependency
    if (mediaItem.startsWith("_imageJobDependency:")) {
      const jobId = mediaItem.replace("_imageJobDependency:", "");
      return this.extractUrlFromDependency(jobId, dependencies, "image");
    }

    // Check for audio dependency
    if (mediaItem.startsWith("_audioJobDependency:")) {
      const jobId = mediaItem.replace("_audioJobDependency:", "");
      return this.extractUrlFromDependency(jobId, dependencies, "audio");
    }

    return null;
  }

  /**
   * Extracts URL from dependency result, handling both formats
   */
  private extractUrlFromDependency(
    jobId: string,
    dependencies: Record<string, any>,
    mediaType: string,
  ): string {
    const depResult = dependencies[jobId];

    if (!depResult) {
      throw new Error(
        `${mediaType} dependency ${jobId} not found in dependencies`,
      );
    }

    // Try standard format: { outputs: [{ url }] }
    if (depResult && typeof depResult === "object" && "outputs" in depResult) {
      const outputs = (depResult as any).outputs;
      if (Array.isArray(outputs) && outputs.length > 0 && outputs[0].url) {
        console.log(
          `[LayerJob] Resolved ${mediaType} dependency ${jobId} to URL: ${outputs[0].url}`,
        );
        return outputs[0].url;
      }
    }

    // Try simple format: { url }
    if (depResult && typeof depResult === "object" && "url" in depResult) {
      console.log(
        `[LayerJob] Resolved ${mediaType} dependency ${jobId} to URL: ${(depResult as any).url}`,
      );
      return (depResult as any).url;
    }

    throw new Error(
      `${mediaType} dependency ${jobId} has invalid result format. Expected { outputs: [{ url }] } or { url }`,
    );
  }

  async work(job: PgBoss.Job<PipelineJobData>): Promise<void> {
    const { jobRecordId, executionId, jobId, params, dependencies } = job.data;

    try {
      await this.updateJobProgress(jobRecordId, "starting", 0);

      // Get organizationId for storage
      const execution = await this.getExecutionWithProviderKeys(jobRecordId);
      const organizationId = execution.organizationId;

      console.log(`[LayerJob] Processing with params:`, params);

      const { layers, outputDuration, outputWidth, outputHeight, mainLayer } =
        params as {
          layers?: Array<
            | {
                media?: string | string[];
                placement?:
                  | string
                  | {
                      width?: string;
                      height?: string;
                      position?: { x?: string; y?: string };
                      padding?: number;
                      aspectRatio?: string;
                    };
                chromaKey?: boolean;
                chromaKeyColor?: string;
                similarity?: number;
                blend?: number;
                isTimeline?: false;
                main?: boolean; // NEW: Flag to mark as main duration reference
              }
            | {
                isTimeline: true;
                timeline: Array<{
                  media?: string | string[];
                  placement?:
                    | string
                    | {
                        width?: string;
                        height?: string;
                        position?: { x?: string; y?: string };
                        padding?: number;
                        aspectRatio?: string;
                      };
                  chromaKey?: boolean;
                  chromaKeyColor?: string;
                  similarity?: number;
                  blend?: number;
                  duration?: number; // UPDATED: Optional for auto-fill
                }>;
                totalDuration?: number; // UPDATED: Optional if needs auto-calculation
                needsAutoDuration?: boolean;
                explicitDuration?: number;
              }
          >;
          outputDuration?: number;
          outputWidth?: number;
          outputHeight?: number;
          mainLayer?: number; // NEW: Index of main layer
        };

      if (!layers || layers.length === 0) {
        throw new Error("At least one layer is required in params");
      }

      // Resolve all media URLs from dependencies or direct URLs
      const resolvedLayers: Array<
        | {
            media: string[];
            placement: string | Record<string, any>;
            chromaKey?: boolean;
            chromaKeyColor?: string;
            similarity?: number;
            blend?: number;
            isTimeline?: false;
            main?: boolean; // NEW: Pass through main flag
          }
        | {
            isTimeline: true;
            timeline: Array<{
              media: string[];
              placement: string | Record<string, any>;
              chromaKey?: boolean;
              chromaKeyColor?: string;
              similarity?: number;
              blend?: number;
              duration?: number; // UPDATED: Optional for auto-fill
            }>;
            totalDuration?: number; // UPDATED: Optional
            needsAutoDuration?: boolean;
            explicitDuration?: number;
          }
      > = [];

      for (const layer of layers) {
        // Check if this is a timeline layer
        if ("isTimeline" in layer && layer.isTimeline) {
          // Process timeline layer
          const resolvedTimeline: Array<{
            media: string[];
            placement: string | Record<string, any>;
            chromaKey?: boolean;
            chromaKeyColor?: string;
            similarity?: number;
            blend?: number;
            duration?: number; // UPDATED: Optional
          }> = [];

          for (const timelineItem of layer.timeline) {
            let resolvedMedia: string[] = [];

            if (timelineItem.media) {
              const mediaArray = Array.isArray(timelineItem.media)
                ? timelineItem.media
                : [timelineItem.media];

              for (const mediaItem of mediaArray) {
                if (typeof mediaItem === "string") {
                  // Try to resolve as dependency
                  const resolvedUrl = this.resolveMediaDependency(
                    mediaItem,
                    dependencies,
                  );

                  if (resolvedUrl) {
                    resolvedMedia.push(resolvedUrl);
                  } else {
                    // Not a dependency marker, treat as direct URL
                    resolvedMedia.push(mediaItem);
                  }
                }
              }
            }

            if (resolvedMedia.length === 0) {
              throw new Error(
                "Each timeline item must have media either in params or from dependencies",
              );
            }

            resolvedTimeline.push({
              media: resolvedMedia,
              placement: timelineItem.placement || "full",
              chromaKey: timelineItem.chromaKey,
              chromaKeyColor: timelineItem.chromaKeyColor,
              similarity: timelineItem.similarity,
              blend: timelineItem.blend,
              duration: timelineItem.duration,
            });
          }

          resolvedLayers.push({
            isTimeline: true,
            timeline: resolvedTimeline,
            totalDuration: layer.totalDuration,
            needsAutoDuration: layer.needsAutoDuration,
            explicitDuration: layer.explicitDuration,
          });

          const durationInfo = layer.totalDuration
            ? `total duration: ${layer.totalDuration}s`
            : `needs auto-duration (explicit: ${layer.explicitDuration || 0}s)`;
          console.log(
            `[LayerJob] Resolved timeline layer with ${resolvedTimeline.length} items (${durationInfo})`,
          );
        } else {
          // Process regular layer
          let resolvedMedia: string[] = [];

          if (layer.media) {
            const mediaArray = Array.isArray(layer.media)
              ? layer.media
              : [layer.media];

            for (const mediaItem of mediaArray) {
              if (typeof mediaItem === "string") {
                // Try to resolve as dependency
                const resolvedUrl = this.resolveMediaDependency(
                  mediaItem,
                  dependencies,
                );

                if (resolvedUrl) {
                  resolvedMedia.push(resolvedUrl);
                } else {
                  // Not a dependency marker, treat as direct URL
                  resolvedMedia.push(mediaItem);
                }
              }
            }
          }

          if (resolvedMedia.length === 0) {
            throw new Error(
              "Each layer must have media either in params or from dependencies",
            );
          }

          resolvedLayers.push({
            media: resolvedMedia,
            placement: layer.placement || "full",
            chromaKey: layer.chromaKey,
            chromaKeyColor: layer.chromaKeyColor,
            similarity: layer.similarity,
            blend: layer.blend,
            main: layer.main, // Pass through main flag
          });
        }
      }

      console.log(
        `[LayerJob] Resolved ${resolvedLayers.length} layers:`,
        resolvedLayers,
      );

      await this.updateJobProgress(jobRecordId, "processing layers", 20);

      // Call FFmpeg service
      const ffmpegApiUrl =
        process.env.FFMPEG_API_URL || "http://localhost:3200";

      console.log(`[LayerJob] Calling FFmpeg service at: ${ffmpegApiUrl}`);

      const response = await fetch(`${ffmpegApiUrl}/layer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          layers: resolvedLayers,
          outputDuration,
          outputWidth,
          outputHeight,
          mainLayer, // NEW: Pass through mainLayer option
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `FFmpeg service returned error: ${response.status} - ${errorText}`,
        );
      }

      await this.updateJobProgress(jobRecordId, "uploading result", 80);

      // Get the video buffer from response
      const videoBuffer = Buffer.from(await response.arrayBuffer());

      console.log(
        `[LayerJob] Received processed video (${videoBuffer.length} bytes)`,
      );

      // Upload to storage
      const s3Key = `executions/${executionId}/${jobId}/output.mp4`;
      const uploadResult = await storage.upload(s3Key, videoBuffer, {
        contentType: "video/mp4",
        organizationId,
      });

      if ("error" in uploadResult) {
        throw uploadResult.error;
      }

      console.log(`[LayerJob] Uploaded to storage: ${uploadResult.url}`);

      const result = {
        status: "completed",
        outputs: [
          {
            type: "video",
            url: uploadResult.url,
            mimeType: "video/mp4",
          },
        ],
        metadata: {
          layerCount: resolvedLayers.length,
          size: videoBuffer.length,
        },
      };

      await this.updateJobProgress(jobRecordId, "completed", 100);

      // Complete the job with result
      await this.completeJob(jobRecordId, result);

      console.log(`[LayerJob] Job completed successfully:`, result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`[LayerJob] Failed:`, errorMessage);
      await this.failJob(jobRecordId, errorMessage);
      throw error;
    }
  }
}
