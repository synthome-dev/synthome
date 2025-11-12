FROM oven/bun:1.0.25-slim

# Install FFmpeg using apt-get
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package.json for dependency installation
COPY apps/ffmpeg/package.json ./

# Install dependencies (will generate fresh lockfile)
RUN bun install

# Copy the ffmpeg app source code
COPY apps/ffmpeg/ .

# Expose the port
EXPOSE 3000

# Start the service
CMD ["bun", "run", "index.ts"]
