import { storageIntegrationService } from "@repo/api-keys";
import { S3Client } from "bun";
import JSZip from "jszip";

// Default timeouts in milliseconds
const DEFAULT_UPLOAD_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes for uploads
const DEFAULT_DB_TIMEOUT_MS = 30 * 1000; // 30 seconds for DB queries
const DEFAULT_DOWNLOAD_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes for downloads

/**
 * Wrap a promise with a timeout
 * @param promise The promise to wrap
 * @param timeoutMs Timeout in milliseconds
 * @param operation Description of the operation for error messages
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string,
): Promise<T> {
  let timeoutId: Timer;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${operation} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

type FileBody =
  | string
  | ArrayBuffer
  | Blob
  | File
  | SharedArrayBuffer
  | Request
  | Response
  | Buffer;

export interface StorageConfig {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  region: string;
  bucket: string;
  cdnUrl: string;
}

export interface UploadOptions {
  contentType?: string;
  expiresInHours?: number;
  organizationId?: string;
}

export interface ZipUploadOptions {
  expiresInHours?: number;
  organizationId?: string;
}

export interface DeleteOptions {
  organizationId?: string;
}

export interface GetFileUrlOptions {
  organizationId?: string;
}

const isUrl = (str: string): boolean => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

const downloadFromUrl = async (url: string): Promise<Uint8Array> => {
  const fetchPromise = async () => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download from URL: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  };

  return withTimeout(
    fetchPromise(),
    DEFAULT_DOWNLOAD_TIMEOUT_MS,
    `Download from ${url}`,
  );
};

const convertToUint8Array = async (file: FileBody): Promise<Uint8Array> => {
  if (file instanceof Uint8Array) {
    return file;
  }

  if (file instanceof ArrayBuffer || file instanceof SharedArrayBuffer) {
    return new Uint8Array(file);
  }

  if (file instanceof Blob || file instanceof File) {
    const arrayBuffer = await file.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  if (file instanceof Buffer) {
    return new Uint8Array(file);
  }

  if (typeof file === "string") {
    if (isUrl(file)) {
      return await downloadFromUrl(file);
    }
    return new TextEncoder().encode(file);
  }

  if (file instanceof Request) {
    const blob = await file.blob();
    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  if (file instanceof Response) {
    const blob = await file.blob();
    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  throw new Error("Unsupported file type");
};

function getEnvConfig(): StorageConfig {
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;
  const endpoint = process.env.S3_URL;
  const region = process.env.S3_REGION || "us-east-1";
  const bucket = process.env.S3_BUCKET || "default";
  const cdnUrl = process.env.S3_CDN_URL || "https://cdn.synthome.dev";

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error(
      "Storage configuration not found. Configure S3_ACCESS_KEY, S3_SECRET_KEY, and S3_URL environment variables.",
    );
  }

  return {
    accessKeyId,
    secretAccessKey,
    endpoint,
    region,
    bucket,
    cdnUrl,
  };
}

let defaultClient: {
  s3: ReturnType<typeof createS3Client>;
  config: StorageConfig;
} | null = null;

function createS3Client(config: StorageConfig) {
  return new S3Client({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    endpoint: config.endpoint,
    region: config.region,
    bucket: config.bucket,
  });
}

function getDefaultClient() {
  if (!defaultClient) {
    const config = getEnvConfig();
    defaultClient = {
      s3: createS3Client(config),
      config,
    };
  }
  return defaultClient;
}

async function getClientForOrg(organizationId?: string): Promise<{
  s3: ReturnType<typeof createS3Client>;
  config: StorageConfig;
}> {
  if (organizationId) {
    const orgConfig = await withTimeout(
      storageIntegrationService.getStorageConfigForExecution(organizationId),
      DEFAULT_DB_TIMEOUT_MS,
      `Storage config lookup for org ${organizationId}`,
    );

    if (orgConfig) {
      return {
        s3: createS3Client(orgConfig),
        config: orgConfig,
      };
    }
  }

  return getDefaultClient();
}

const upload = async (
  path: string,
  file: FileBody,
  options?: UploadOptions,
): Promise<{ success: true; url: string } | { error: Error }> => {
  const startTime = Date.now();
  try {
    console.log(`[Storage] Starting upload to: ${path}`);
    const { s3, config } = await getClientForOrg(options?.organizationId);
    console.log(`[Storage] Got client for org (${Date.now() - startTime}ms)`);

    const body = await convertToUint8Array(file);
    const fileSizeKB = Math.round(body.length / 1024);
    console.log(
      `[Storage] Converted to buffer: ${fileSizeKB}KB (${Date.now() - startTime}ms)`,
    );

    await withTimeout(
      s3.write(path, body, {
        type: options?.contentType,
      }),
      DEFAULT_UPLOAD_TIMEOUT_MS,
      `S3 upload to ${path} (${fileSizeKB}KB)`,
    );

    console.log(
      `[Storage] Upload completed: ${path} (${Date.now() - startTime}ms)`,
    );

    return {
      success: true,
      url: `${config.cdnUrl}/${path}`,
    };
  } catch (error) {
    console.error(
      `[Storage] Upload failed after ${Date.now() - startTime}ms:`,
      error,
    );
    return {
      error: error as Error,
    };
  }
};

const zipAndUpload = async (
  path: string,
  files: File[],
  options?: ZipUploadOptions,
): Promise<{ success: true; url: string } | { error: Error }> => {
  const zip = new JSZip();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    zip.file(file.name, arrayBuffer);
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  return upload(path, zipBuffer, {
    contentType: "application/zip",
    expiresInHours: options?.expiresInHours,
    organizationId: options?.organizationId,
  });
};

const deleteFile = async (
  path: string,
  options?: DeleteOptions,
): Promise<void> => {
  const { s3 } = await getClientForOrg(options?.organizationId);
  await withTimeout(
    s3.delete(path),
    DEFAULT_DB_TIMEOUT_MS,
    `S3 delete ${path}`,
  );
};

const getFileUrl = async (
  path: string,
  options?: GetFileUrlOptions,
): Promise<string> => {
  const { config } = await getClientForOrg(options?.organizationId);
  return `${config.cdnUrl}/${path}`;
};

/**
 * Storage client with organization-aware methods.
 * Each method accepts an optional organizationId in options.
 * If provided, checks for org-specific storage integration first,
 * then falls back to environment variables.
 */
export const storage = {
  upload,
  delete: deleteFile,
  getFileUrl,
  zipAndUpload,
  downloadFromUrl,
};

export { downloadFromUrl };
