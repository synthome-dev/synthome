declare module 'fluent-ffmpeg' {
  interface FFmpegCommand {
    toFormat(format: string): this;
    videoCodec(codec: string): this;
    audioCodec(codec: string): this;
    videoBitrate(bitrate: string): this;
    audioBitrate(bitrate: string): this;
    fps(fps: number): this;
    size(size: string): this;
    aspect(ratio: string): this;
    audioChannels(channels: number): this;
    audioFrequency(freq: number): this;
    setStartTime(time: string): this;
    setDuration(duration: string): this;
    seek(time: string): this;
    complexFilter(filter: string): this;
    on(event: 'start', callback: (commandLine: string) => void): this;
    on(event: 'progress', callback: (progress: { percent: number }) => void): this;
    on(event: 'end', callback: () => void): this;
    on(event: 'error', callback: (err: Error) => void): this;
    save(outputPath: string): this;
  }

  function ffmpeg(input: string): FFmpegCommand;
  export = ffmpeg;
} 