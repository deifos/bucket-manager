import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { BucketConfig } from "@/lib/bucket-config";

// Create S3 client with specific bucket configuration
function createS3Client(config: BucketConfig): S3Client {
  return new S3Client({
    region: config.region || "us-east-1",
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export interface S3Object {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: Date;
  thumbnailUrl: string | null;
}

export interface PaginatedResult {
  objects: S3Object[];
  nextContinuationToken?: string;
  isTruncated: boolean;
  totalCount?: number;
}

// Get list of objects in the bucket with pagination
export async function listObjects(
  config: BucketConfig,
  maxKeys = 100,
  continuationToken?: string
): Promise<PaginatedResult> {
  try {
    const s3Client = createS3Client(config);
    const command = new ListObjectsV2Command({
      Bucket: config.name,
      MaxKeys: maxKeys,
      ContinuationToken: continuationToken,
    });

    const response = await s3Client.send(command);

    if (!response.Contents) {
      return {
        objects: [],
        isTruncated: false,
      };
    }

    const objects: S3Object[] = response.Contents.map((item) => {
      // Generate a stable ID based on the filename and ETag (same format as R2)
      const id =
        (item.Key || "") +
        "-" +
        (item.ETag?.replace(/"/g, "") ||
          item.LastModified?.getTime().toString() ||
          "");

      // Determine MIME type from the file extension
      const extension = item.Key?.split(".").pop()?.toLowerCase() || "";
      const mimeType = getMimeType(extension);

      const result = {
        id,
        name: item.Key || "unknown",
        type: mimeType,
        size: item.Size || 0,
        lastModified: item.LastModified || new Date(),
        thumbnailUrl: null,
      };

      return result;
    });

    return {
      objects,
      nextContinuationToken: response.NextContinuationToken,
      isTruncated: response.IsTruncated || false,
      totalCount: response.KeyCount,
    };
  } catch (error) {
    console.error("Error listing objects from S3:", error);
    throw error;
  }
}

// Get a single object
export async function getObject(config: BucketConfig, key: string) {
  try {
    const s3Client = createS3Client(config);
    const command = new GetObjectCommand({
      Bucket: config.name,
      Key: key,
    });

    return await s3Client.send(command);
  } catch (error) {
    console.error(`Error getting object ${key}:`, error);
    throw error;
  }
}

// Delete a single object
export async function deleteObject(config: BucketConfig, key: string) {
  try {
    const s3Client = createS3Client(config);
    const command = new DeleteObjectCommand({
      Bucket: config.name,
      Key: key,
    });

    return await s3Client.send(command);
  } catch (error) {
    console.error(`Error deleting object ${key}:`, error);
    throw error;
  }
}

// Delete multiple objects
export async function deleteObjects(config: BucketConfig, keys: string[]) {
  try {
    const s3Client = createS3Client(config);
    const command = new DeleteObjectsCommand({
      Bucket: config.name,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
      },
    });

    return await s3Client.send(command);
  } catch (error) {
    console.error(`Error deleting multiple objects:`, error);
    throw error;
  }
}

// Upload an object
export async function uploadObject(
  config: BucketConfig,
  key: string,
  body: Buffer,
  contentType: string
) {
  try {
    const s3Client = createS3Client(config);
    const command = new PutObjectCommand({
      Bucket: config.name,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    return await s3Client.send(command);
  } catch (error) {
    console.error(`Error uploading object ${key}:`, error);
    throw error;
  }
}

// Generate a pre-signed URL for temporary access
export async function generatePresignedUrl(config: BucketConfig, key: string, expiresIn = 3600) {
  try {
    const s3Client = createS3Client(config);
    const command = new GetObjectCommand({
      Bucket: config.name,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
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
