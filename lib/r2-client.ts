import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Environment variables
const CLOUDFLARE_BUCKET_API = process.env.CLOUDFLARE_BUCKET_API;
const CLOUDFLARE_ACCESS_KEY_ID = process.env.CLOUDFLARE_ACCESS_KEY_ID;
const CLOUDFLARE_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
const CLOUDFLARE_BUCKET_NAME = process.env.CLOUDFLARE_BUCKET_NAME;

if (
  !CLOUDFLARE_BUCKET_API ||
  !CLOUDFLARE_ACCESS_KEY_ID ||
  !CLOUDFLARE_SECRET_ACCESS_KEY ||
  !CLOUDFLARE_BUCKET_NAME
) {
  console.error("Missing required R2 environment variables");
}

// Initialize S3 client for Cloudflare R2
export const r2Client = new S3Client({
  region: "auto",
  endpoint: CLOUDFLARE_BUCKET_API,
  credentials: {
    accessKeyId: CLOUDFLARE_ACCESS_KEY_ID || "",
    secretAccessKey: CLOUDFLARE_SECRET_ACCESS_KEY || "",
  },
});

export interface R2Object {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: Date;
  thumbnailUrl: string | null;
}

export interface PaginatedResult {
  objects: R2Object[];
  nextContinuationToken?: string;
  isTruncated: boolean;
  totalCount?: number;
}

// Get list of objects in the bucket with pagination
export async function listObjects(
  maxKeys = 100,
  continuationToken?: string
): Promise<PaginatedResult> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: CLOUDFLARE_BUCKET_NAME,
      MaxKeys: maxKeys,
      ContinuationToken: continuationToken,
    });

    const response = await r2Client.send(command);

    if (!response.Contents) {
      return {
        objects: [],
        isTruncated: false,
      };
    }

    const objects: R2Object[] = response.Contents.map((item) => {
      // Generate a stable, unique ID based on the filename and ETag
      // This avoids using Math.random() which causes hydration errors
      const id =
        (item.Key || "") +
        "-" +
        (item.ETag?.replace(/"/g, "") ||
          item.LastModified?.getTime().toString() ||
          "");

      // Determine MIME type from the file extension
      const extension = item.Key?.split(".").pop()?.toLowerCase() || "";
      const mimeType = getMimeType(extension);

      // We don't attempt to create thumbnails anymore to avoid CORS issues
      // We'll use static placeholders in the UI instead
      return {
        id,
        name: item.Key || "unknown",
        type: mimeType,
        size: item.Size || 0,
        lastModified: item.LastModified || new Date(),
        thumbnailUrl: null, // Not using thumbnails from R2 anymore
      };
    });

    return {
      objects,
      nextContinuationToken: response.NextContinuationToken,
      isTruncated: response.IsTruncated || false,
      totalCount: response.KeyCount,
    };
  } catch (error) {
    console.error("Error listing objects:", error);
    throw error;
  }
}

// Get a single object
export async function getObject(key: string) {
  try {
    const command = new GetObjectCommand({
      Bucket: CLOUDFLARE_BUCKET_NAME,
      Key: key,
    });

    return await r2Client.send(command);
  } catch (error) {
    console.error(`Error getting object ${key}:`, error);
    throw error;
  }
}

// Delete a single object
export async function deleteObject(key: string) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: CLOUDFLARE_BUCKET_NAME,
      Key: key,
    });

    return await r2Client.send(command);
  } catch (error) {
    console.error(`Error deleting object ${key}:`, error);
    throw error;
  }
}

// Delete multiple objects
export async function deleteObjects(keys: string[]) {
  try {
    const command = new DeleteObjectsCommand({
      Bucket: CLOUDFLARE_BUCKET_NAME,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
      },
    });

    return await r2Client.send(command);
  } catch (error) {
    console.error(`Error deleting multiple objects:`, error);
    throw error;
  }
}

// Upload an object
export async function uploadObject(
  key: string,
  body: Buffer,
  contentType: string
) {
  try {
    const command = new PutObjectCommand({
      Bucket: CLOUDFLARE_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    return await r2Client.send(command);
  } catch (error) {
    console.error(`Error uploading object ${key}:`, error);
    throw error;
  }
}

// Generate a pre-signed URL for temporary access
export async function generatePresignedUrl(key: string, expiresIn = 3600) {
  try {
    const command = new GetObjectCommand({
      Bucket: CLOUDFLARE_BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(r2Client, command, { expiresIn });
  } catch (error) {
    console.error(`Error generating pre-signed URL for ${key}:`, error);
    throw error;
  }
}

// Helper function to determine MIME type from file extension
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
    html: "text/html",
    css: "text/css",
    js: "application/javascript",
    json: "application/json",
    xml: "application/xml",
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    tar: "application/x-tar",
    "7z": "application/x-7z-compressed",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    mp4: "video/mp4",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    webm: "video/webm",
  };

  return mimeTypes[extension] || "application/octet-stream";
}
