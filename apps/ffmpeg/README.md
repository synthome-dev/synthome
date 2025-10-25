# FFmpeg Media Processing Service

A flexible and powerful media processing service built with Bun, Hono, and FFmpeg. This service provides both a generic FFmpeg interface and convenient preset endpoints for common media processing tasks.

## Features

- Generic FFmpeg conversion with custom options
- Audio extraction from videos (MP3, AAC, WAV)
- Video compression with quality presets
- GIF creation from videos
- Thumbnail generation
- Progress tracking and error handling

## API Endpoints

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
