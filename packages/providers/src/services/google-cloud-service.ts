import { VertexAI } from "@google-cloud/vertexai";
import type {
  VideoProviderService,
  VideoGenerationResult,
} from "./base-provider.js";

export class GoogleCloudService implements VideoProviderService {
  private vertex: VertexAI;

  constructor(projectId?: string) {
    this.vertex = new VertexAI({
      project: projectId || process.env.GOOGLE_CLOUD_PROJECT!,
      location: "us-central1",
    });
  }

  async generateVideo(
    modelId: string,
    params: Record<string, any>,
  ): Promise<VideoGenerationResult> {
    const generativeModel = this.vertex.getGenerativeModel({ model: modelId });

    const result = await generativeModel.generateContent(params as any);

    const fileUri =
      result.response.candidates?.[0]?.content?.parts?.[0]?.fileData?.fileUri;

    if (!fileUri) {
      throw new Error(
        `No video URL found in Google Cloud response: ${JSON.stringify(result)}`,
      );
    }

    return { url: fileUri, metadata: result };
  }
}
