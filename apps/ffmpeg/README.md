# FFmpeg Media Processing Service

A flexible and powerful media processing service built with Bun, Hono, and FFmpeg. This service provides both a generic FFmpeg interface and convenient preset endpoints for common media processing tasks.

## Features

- Generic FFmpeg conversion with custom options
- Audio extraction from videos (MP3, AAC, WAV)
- Video compression with quality presets
- GIF creation from videos
- Thumbnail generation
- Video merging and layering
- Subtitle generation and burning (ASS format)
- Progress tracking and error handling

## Caption Service

This application includes a built-in caption/subtitle generation service located in `./captions`. The caption service supports:

- Multiple caption presets (TikTok, YouTube, Story, Minimal, Cinematic)
- ASS (Advanced SubStation Alpha) subtitle format
- Word-by-word highlighting with customizable colors and scaling
- Configurable caption behavior (words per caption, duration, animation style)

The caption functionality was moved from `packages/caption-service` to this application on Nov 24, 2024, as it's primarily used for FFmpeg operations. The old `@repo/caption-service` package can be safely deleted.

## API Endpoints

### Generate Subtitles (`/generate-subtitles`)

Generate ASS subtitle content from a transcript.

```bash
curl -X POST http://localhost:3200/generate-subtitles \
  -H "Content-Type: application/json" \
  -d '{
    "words": [
      {"word": "Hello", "start": 0.0, "end": 0.5},
      {"word": "World", "start": 0.5, "end": 1.0}
    ],
    "preset": "tiktok",
    "videoWidth": 1080,
    "videoHeight": 1920
  }'
```

Parameters:

- `words` - Array of transcript words with timing (required)
  - Each word should have: `word` (string), `start` (number), `end` (number)
- `preset` - Caption style preset: "tiktok", "youtube", "story", "minimal", "cinematic" (optional, default: "tiktok")
- `overrides` - Custom style overrides (optional)
- `videoWidth` - Video width in pixels (optional, default: 1080)
- `videoHeight` - Video height in pixels (optional, default: 1920)

Returns JSON with `subtitleContent` containing ASS format subtitle data.

### Burn Subtitles (`/burn-subtitles`)

Burn subtitle content into a video.

```bash
curl -X POST http://localhost:3200/burn-subtitles \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://example.com/video.mp4",
    "subtitleContent": "... ASS subtitle content ...",
    "subtitleFormat": "ass"
  }'
```

Parameters:

- `videoUrl` - URL of the video to add subtitles to (required)
- `subtitleContent` - ASS format subtitle content (required)
- `subtitleFormat` - Subtitle format, currently only "ass" is supported (required)

Returns the video file with burned-in subtitles.

### Generic Conversion (`/convert`)

Convert media files using custom FFmpeg options.

```bash
curl -X POST \
  -F "file=@input.mp4" \
  -F "outputFormat=webm" \
  -F "videoCodec=libvpx" \
  -F "audioBitrate=128k" \
  -F "width=1280" \
  -F "height=720" \
  http://localhost:3000/convert
```

Available options:

- `inputFormat` - Input format (optional, defaults to mp4)
- `outputFormat` - Output format (required)
- `videoCodec` - Video codec
- `audioCodec` - Audio codec
- `videoBitrate` - Video bitrate (e.g., "1000k")
- `audioBitrate` - Audio bitrate (e.g., "128k")
- `fps` - Frames per second
- `width` - Output width
- `height` - Output height
- `aspectRatio` - Aspect ratio (e.g., "16:9")
- `audioChannels` - Number of audio channels
- `audioFrequency` - Audio frequency
- `startTime` - Start time for trimming
- `duration` - Duration of output
- `seek` - Seek position
- `filters` - FFmpeg filters array

### Extract Audio (`/extract-audio`)

Extract audio track from a video file.

```bash
# Extract as MP3 (default)
curl -X POST -F "file=@video.mp4" http://localhost:3000/extract-audio

# Extract as AAC
curl -X POST -F "file=@video.mp4" -F "format=aac" http://localhost:3000/extract-audio

# Extract as WAV
curl -X POST -F "file=@video.mp4" -F "format=wav" http://localhost:3000/extract-audio
```

### Compress Video (`/compress-video`)

Compress a video with quality presets.

```bash
# Medium quality (default)
curl -X POST -F "file=@video.mp4" http://localhost:3000/compress-video

# Low quality
curl -X POST -F "file=@video.mp4" -F "quality=low" http://localhost:3000/compress-video

# High quality
curl -X POST -F "file=@video.mp4" -F "quality=high" http://localhost:3000/compress-video
```

Quality presets:

- `low`: 500k video bitrate, 64k audio bitrate
- `medium`: 1000k video bitrate, 128k audio bitrate
- `high`: 2000k video bitrate, 192k audio bitrate

### Create GIF (`/create-gif`)

Convert a video segment to GIF.

```bash
# Default settings (10 fps)
curl -X POST -F "file=@video.mp4" http://localhost:3000/create-gif

# Custom FPS
curl -X POST -F "file=@video.mp4" -F "fps=15" http://localhost:3000/create-gif
```

### Generate Thumbnail (`/thumbnail`)

Generate a thumbnail from a video.

```bash
# Default settings (first frame)
curl -X POST -F "file=@video.mp4" http://localhost:3000/thumbnail

# Custom time and size
curl -X POST \
  -F "file=@video.mp4" \
  -F "time=00:00:05" \
  -F "width=320" \
  -F "height=180" \
  http://localhost:3000/thumbnail
```

## Development

### Prerequisites

- [Bun](https://bun.sh) installed
- FFmpeg installed on your system

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd <repository-name>

# Install dependencies
bun install

# Start the server
bun run dev
```

### Environment Variables

- `PORT` - Server port (default: 3000)

## Error Handling

The service returns appropriate HTTP status codes and error messages:

- `400` - Bad Request (missing file, invalid format, etc.)
- `500` - Internal Server Error (processing failed)

All endpoints return the processed file as a download with appropriate Content-Type and Content-Disposition headers.

## License

MIT
