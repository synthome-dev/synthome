export interface VideoGenerationResult {
  url: string;
  metadata?: Record<string, any>;
}

export interface VideoProviderService {
  generateVideo(
    modelId: string,
    params: Record<string, any>,
  ): Promise<VideoGenerationResult>;
}
