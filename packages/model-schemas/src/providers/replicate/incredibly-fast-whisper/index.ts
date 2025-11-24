import type { PollingParser } from "../../../webhook-types.js";
import {
  incrediblyFastWhisperModels,
  incrediblyFastWhisperRawOptionsSchema,
  type IncrediblyFastWhisperModelId,
  type IncrediblyFastWhisperRawOptions,
} from "./schema.js";

export {
  incrediblyFastWhisperModels,
  incrediblyFastWhisperRawOptionsSchema,
  type IncrediblyFastWhisperModelId,
  type IncrediblyFastWhisperRawOptions,
};

/**
 * Parser for incredibly-fast-whisper response
 * Response format:
 * {
 *   chunks: [{ text: string, timestamp: [number, number] }],
 *   text: string
 * }
 */
export const incrediblyFastWhisperMapping: PollingParser = (
  response: unknown,
) => {
  const data = response as any;

  if (data.status === "failed" || data.status === "canceled") {
    return {
      status: "failed",
      error: data.error || "Transcription failed",
    };
  }

  if (
    data.status === "starting" ||
    data.status === "processing" ||
    data.status === "queued"
  ) {
    return {
      status: "processing",
    };
  }

  if (data.status === "succeeded") {
    if (typeof data.output === "object" && data.output !== null) {
      return {
        status: "completed",
        outputs: [
          {
            type: "transcript",
            data: data.output,
          },
        ],
        metadata: {
          predictionId: data.id,
        },
      };
    }

    return {
      status: "failed",
      error: "No structured output in completed response",
    };
  }

  return {
    status: "processing",
  };
};
