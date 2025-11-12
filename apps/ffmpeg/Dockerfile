FROM oven/bun:1.0.25-slim

# Install FFmpeg using apt-get
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for better caching
COPY apps/ffmpeg/package.json apps/ffmpeg/bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the ffmpeg app source code
COPY apps/ffmpeg/ .

# Expose the port
EXPOSE 3000

# Start the service
CMD ["bun", "run", "index.ts"]
