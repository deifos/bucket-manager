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

// Environment variables
const S3_UPLOAD_KEY = process.env.S3_UPLOAD_KEY;
const S3_UPLOAD_SECRET = process.env.S3_UPLOAD_SECRET;
const S3_UPLOAD_BUCKET = process.env.S3_UPLOAD_BUCKET;
const S3_UPLOAD_REGION = process.env.S3_UPLOAD_REGION;

if (!S3_UPLOAD_KEY || !S3_UPLOAD_SECRET || !S3_UPLOAD_BUCKET) {
  console.error("Missing required S3 environment variables");
}

// Initialize S3 client for AWS S3
export const s3Client = new S3Client({
  region: S3_UPLOAD_REGION || "us-east-1",
  credentials: {
    accessKeyId: S3_UPLOAD_KEY || "",
    secretAccessKey: S3_UPLOAD_SECRET || "",
  },
});

export interface S3Object {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: Date;
  thumbnailUrl: string | null;
}

// Get list of objects in the bucket
export async function listObjects(): Promise<S3Object[]> {
  try {
    console.log("Listing objects from S3 bucket:", S3_UPLOAD_BUCKET);
    const command = new ListObjectsV2Command({
      Bucket: S3_UPLOAD_BUCKET,
    });

    const response = await s3Client.send(command);
    console.log("S3 response:", JSON.stringify(response, null, 2));

    if (!response.Contents) {
      console.log("No objects found in S3 bucket");
      return [];
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

      console.log("Processed S3 object:", result);
      return result;
    });

    return objects;
  } catch (error) {
    console.error("Error listing objects from S3:", error);
    throw error;
  }
}

// Get a single object
export async function getObject(key: string) {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_UPLOAD_BUCKET,
      Key: key,
    });

    return await s3Client.send(command);
  } catch (error) {
    console.error(`Error getting object ${key}:`, error);
    throw error;
  }
}

// Delete a single object
export async function deleteObject(key: string) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_UPLOAD_BUCKET,
      Key: key,
    });

    return await s3Client.send(command);
  } catch (error) {
    console.error(`Error deleting object ${key}:`, error);
    throw error;
  }
}

// Delete multiple objects
export async function deleteObjects(keys: string[]) {
  try {
    const command = new DeleteObjectsCommand({
      Bucket: S3_UPLOAD_BUCKET,
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
  key: string,
  body: Buffer,
  contentType: string
) {
  try {
    const command = new PutObjectCommand({
      Bucket: S3_UPLOAD_BUCKET,
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
export async function generatePresignedUrl(key: string, expiresIn = 3600) {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_UPLOAD_BUCKET,
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
