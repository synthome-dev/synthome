import { S3Client } from "bun";
import JSZip from "jszip";

type FileBody =
  | string
  | ArrayBuffer
  | Blob
  | File
  | SharedArrayBuffer
  | Request
  | Response
  | Buffer;

const client = new S3Client({
  accessKeyId: process.env.S3_ACCESS_KEY!,
  secretAccessKey: process.env.S3_SECRET_KEY!,
  endpoint: process.env.S3_URL!,
  region: process.env.S3_REGION || "us-east-1",
  bucket: "default",
});

const getFileUrl = (path: string) => {
  const endpoint = "https://***REMOVED***";
  return `${endpoint}/${path}`;
};

const isUrl = (str: string): boolean => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

const downloadFromUrl = async (url: string): Promise<Uint8Array> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download from URL: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
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
    // Check if string is a URL, if so download it
    if (isUrl(file)) {
      return await downloadFromUrl(file);
    }

    // Otherwise treat as text content
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

const upload = async (
  path: string,
  file: FileBody,
  options?: {
    contentType?: string;
    expiresInHours?: number;
  },
) => {
  try {
    const body = await convertToUint8Array(file);

    await client.write(path, body, {
      type: options?.contentType,
    });

    return {
      success: true,
      url: getFileUrl(path),
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    return {
      error: error as Error,
    };
  }
};

const zipAndUpload = async (
  path: string,
  files: File[],
  options?: {
    expiresInHours?: number;
  },
) => {
  const zip = new JSZip();

  // Add all files to the zip
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    zip.file(file.name, arrayBuffer);
  }

  // Generate zip file
  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  return upload(path, zipBuffer, {
    contentType: "application/zip",
    expiresInHours: options?.expiresInHours,
  });
};

const deleteFile = async (path: string) => {
  await client.delete(path);
};

export const storage = Object.assign(
  {},
  {
    upload,
    delete: deleteFile,
    getFileUrl,
    zipAndUpload,
    downloadFromUrl,
  },
);
