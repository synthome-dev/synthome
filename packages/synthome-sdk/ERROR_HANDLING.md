# Error Handling Guide

This SDK provides flexible error handling to suit different development needs.

## Error Types

The SDK may throw errors in these scenarios:

1. **Authentication Errors (401)**: Missing or invalid API key
2. **Rate Limit Errors (429)**: Monthly action limit exceeded
3. **Validation Errors (400)**: Invalid parameters or execution plan
4. **Server Errors (500)**: Internal server errors
5. **Network Errors**: Connection failures or timeouts

## Accessing Results and Errors

After execution, you can check the status to access the final result or error:

```typescript
import { compose, generateVideo, replicate } from "@repo/ai-video-sdk";

const pipeline = compose(
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "A beautiful sunset",
    duration: 5,
  }),
);

const execution = await pipeline.execute({
  apiKey: process.env.SYNTHOME_API_KEY,
});

// Poll for status
const status = await execution.getStatus();

// Success case - access the final output
if (status.status === "completed") {
  console.log("Video ready:", status.result?.url);
  // Output: Video ready: https://storage.googleapis.com/abc123.mp4

  // Optional metadata
  console.log("Type:", status.result?.type); // 'video' | 'audio' | 'image'
  console.log("Duration:", status.result?.duration); // in seconds
}

// Failure case - access meaningful error message
if (status.status === "failed") {
  console.log("Error:", status.error);
  // Examples:
  // - "Job 'generate-video' failed: Model API timeout"
  // - "2 jobs failed: generate-video (timeout), merge (invalid input)"
  // - "Execution failed due to dependency errors"
}
```

### Result Type

The `result` field is typed as `MediaResult | null`:

```typescript
interface MediaResult {
  url: string; // URL to the final output
  type?: "video" | "audio" | "image"; // Media type
  duration?: number; // Duration in seconds
  format?: string; // File format (e.g., "mp4", "mp3")
  size?: number; // File size in bytes
  [key: string]: any; // Additional provider-specific metadata
}
```

### Complex Pipelines

For pipelines with multiple operations, the result is from the final (leaf) job:

```typescript
import { compose, generateVideo, merge, replicate } from "@repo/ai-video-sdk";

const pipeline = compose(
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "Scene 1",
    duration: 3,
  }),
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "Scene 2",
    duration: 3,
  }),
  merge({ transition: "crossfade" }),
);

const execution = await pipeline.execute({
  apiKey: process.env.SYNTHOME_API_KEY,
});

const status = await execution.getStatus();

// Result is from the merge job (final output), not the intermediate generate-video jobs
if (status.status === "completed") {
  console.log("Merged video URL:", status.result?.url);
}
```

## Error Messages

When errors occur, the SDK provides detailed error messages from the API:

```typescript
// Instead of generic: "Pipeline execution failed: Unauthorized"
// You get specific: "Pipeline execution failed: Missing or invalid Authorization header"

// Instead of: "Pipeline execution failed: Too Many Requests"
// You get: "Pipeline execution failed: Rate Limit Exceeded (RATE_LIMIT_EXCEEDED)"
```

## Approach 1: Traditional Try-Catch (Recommended for Simple Cases)

Best for: Single operations, scripts, quick prototypes

```typescript
import { compose, generateVideo, replicate } from "@repo/ai-video-sdk";

try {
  const pipeline = compose(
    generateVideo({
      model: replicate("bytedance/seedance-1-pro"),
      prompt: "A skier glides over snow",
      duration: 5,
    }),
  );

  const execution = await pipeline.execute({
    apiKey: process.env.SYNTHOME_API_KEY,
  });

  console.log("Success:", execution.id);
} catch (error) {
  console.error("Video generation failed:", error.message);
  // Handle error: show notification, log to service, etc.
}
```

## Approach 2: Event-Driven Error Handling (Recommended for Production)

Best for: Production apps, UI applications, complex workflows

```typescript
import { compose, generateVideo, replicate } from "@repo/ai-video-sdk";

const pipeline = compose(
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "A skier glides over snow",
    duration: 5,
  }),
)
  .onError((error) => {
    // Log to monitoring service
    console.error("Pipeline error:", error);

    // Show user-friendly notification
    showNotification("Video generation failed. Please try again.");

    // Track analytics
    analytics.track("video_generation_error", {
      message: error.message,
    });
  })
  .onProgress((progress) => {
    // Update UI progress bar
    updateProgressBar(progress.progress);
  });

try {
  const execution = await pipeline.execute({
    apiKey: process.env.SYNTHOME_API_KEY,
  });

  // The error callback fires BEFORE the error is thrown
  // So you can log/track errors even when using try-catch
} catch (error) {
  // Error still throws after callback
  // Handle gracefully in your app
}
```

## Approach 3: Graceful Degradation

Best for: User-facing features, optional enhancements

```typescript
import { compose, generateVideo, replicate } from "@repo/ai-video-sdk";

async function generateVideoWithFallback() {
  const pipeline = compose(
    generateVideo({
      model: replicate("bytedance/seedance-1-pro"),
      prompt: "Product showcase",
      duration: 5,
    }),
  ).onError((error) => {
    // Log but don't crash
    console.warn("Video generation failed:", error.message);
  });

  try {
    return await pipeline.execute({
      apiKey: process.env.SYNTHOME_API_KEY,
    });
  } catch (error) {
    // Return fallback content
    return {
      id: "fallback",
      url: "https://example.com/placeholder-video.mp4",
      status: "completed",
    };
  }
}

// Application continues even if video generation fails
const video = await generateVideoWithFallback();
displayVideo(video.url);
```

## Approach 4: Retry with Exponential Backoff

Best for: Temporary failures, rate limits, network issues

```typescript
import { compose, generateVideo, replicate } from "@repo/ai-video-sdk";

async function executeWithRetry(
  pipeline: Pipeline,
  maxRetries = 3,
  delay = 1000,
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await pipeline.execute({
        apiKey: process.env.SYNTHOME_API_KEY,
      });
    } catch (error) {
      const isLastAttempt = i === maxRetries - 1;

      if (isLastAttempt) {
        throw error; // Give up after max retries
      }

      // Check if error is retryable
      const errorMessage = (error as Error).message;
      const isRetryable =
        errorMessage.includes("RATE_LIMIT_EXCEEDED") ||
        errorMessage.includes("Internal Server Error") ||
        errorMessage.includes("timeout");

      if (!isRetryable) {
        throw error; // Don't retry auth errors, validation errors, etc.
      }

      // Wait with exponential backoff
      const backoffDelay = delay * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${maxRetries} in ${backoffDelay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    }
  }
}

// Usage
const pipeline = compose(
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "Mountain landscape",
    duration: 5,
  }),
);

const execution = await executeWithRetry(pipeline);
```

## Error Handling in React

```typescript
import { compose, generateVideo, replicate } from "@repo/ai-video-sdk";
import { useState } from "react";

function VideoGenerator() {
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [video, setVideo] = useState<Video | null>(null);

  const generateVideo = async () => {
    setError(null);
    setProgress(0);

    const pipeline = compose(
      generateVideo({
        model: replicate("bytedance/seedance-1-pro"),
        prompt: "Sunset over ocean",
        duration: 5,
      })
    )
      .onError((err) => {
        // Update UI with error
        setError(err.message);
      })
      .onProgress((prog) => {
        // Update progress bar
        setProgress(prog.progress);
      });

    try {
      const execution = await pipeline.execute({
        apiKey: process.env.NEXT_PUBLIC_SYNTHOME_API_KEY,
      });

      execution.onComplete((video) => {
        setVideo(video);
      });
    } catch (err) {
      // Error already set by onError callback
      console.error("Generation failed");
    }
  };

  return (
    <div>
      <button onClick={generateVideo}>Generate Video</button>
      {progress > 0 && <ProgressBar value={progress} />}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {video && <VideoPlayer url={video.url} />}
    </div>
  );
}
```

## Best Practices

### ✅ DO

1. **Always handle errors** - Either with try-catch or onError callback
2. **Use onError for logging** - Track errors in production monitoring
3. **Provide user feedback** - Show helpful error messages in UI
4. **Retry transient failures** - Rate limits and network errors are temporary
5. **Check error codes** - Different errors need different handling

### ❌ DON'T

1. **Don't ignore errors** - Unhandled errors will crash your app
2. **Don't retry auth errors** - Invalid API keys won't work on retry
3. **Don't retry validation errors** - Fix the input instead
4. **Don't expose raw errors to users** - Show user-friendly messages
5. **Don't retry forever** - Set a maximum retry limit

## Common Error Scenarios

### Missing API Key

```typescript
// Error: "SYNTHOME_API_KEY is required. Set it as an environment variable or pass it in config options."

// Solution: Provide API key
const execution = await pipeline.execute({
  apiKey: "sy_test_your_key_here",
});
```

### Rate Limit Exceeded

```typescript
// Error: "Pipeline execution failed: Rate Limit Exceeded (RATE_LIMIT_EXCEEDED)"

// Solution: Implement retry with backoff or upgrade plan
```

### Invalid Parameters

```typescript
// Error: "Pipeline execution failed: Invalid execution plan"

// Solution: Check your pipeline configuration
```

### Network Timeout

```typescript
// Error: "Failed to fetch status: Network request failed"

// Solution: Check network connection and API availability
```

## Migration from Old Error Handling

If you're upgrading from a previous version:

**Before:**

```typescript
// Errors only showed generic status text
// Error: "Pipeline execution failed: Unauthorized"
```

**After:**

```typescript
// Errors now include detailed messages from API
// Error: "Pipeline execution failed: Missing or invalid Authorization header"

// Plus: You can use onError callback
pipeline.onError((error) => {
  console.error(error.message); // Get the full error details
});
```

## Summary

The SDK provides flexible error handling:

1. **Still throws errors** - Maintains backwards compatibility
2. **Improved error messages** - Get detailed info from API responses
3. **Event callbacks** - Use `onError()` for logging and monitoring
4. **Developer choice** - Use try-catch, callbacks, or both

Choose the approach that fits your use case!
