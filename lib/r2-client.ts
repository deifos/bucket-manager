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

// Create R2 client with specific bucket configuration
function createR2Client(config: BucketConfig): S3Client {
  if (!config.endpoint) {
    throw new Error(`R2 bucket ${config.name} is missing endpoint configuration`);
  }

  return new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export interface R2Object {
  id: string;
  name: string;
  path: string; // Full path including folders
  type: string;
  size: number;
  lastModified: Date;
  thumbnailUrl: string | null;
  isFolder: boolean;
}

export interface PaginatedResult {
  objects: R2Object[];
  nextContinuationToken?: string;
  isTruncated: boolean;
  totalCount?: number;
}

// Get list of objects in the bucket with pagination
export async function listObjects(
  config: BucketConfig,
  maxKeys = 100,
  continuationToken?: string,
  prefix = ""
): Promise<PaginatedResult> {
  try {
    const r2Client = createR2Client(config);
    const command = new ListObjectsV2Command({
      Bucket: config.name,
      MaxKeys: maxKeys,
      ContinuationToken: continuationToken,
      Prefix: prefix,
      Delimiter: "/", // This groups objects by "folder"
    });

    const response = await r2Client.send(command);

    const objects: R2Object[] = [];

    // Process folders (CommonPrefixes)
    if (response.CommonPrefixes) {
      response.CommonPrefixes.forEach((prefixObj) => {
        const folderPath = prefixObj.Prefix || "";
        const folderName = folderPath.replace(prefix, "").replace("/", "");

        if (folderName) { // Skip empty names
          objects.push({
            id: `folder-${folderPath}`,
            name: folderName,
            path: folderPath,
            type: "folder",
            size: 0,
            lastModified: new Date(),
            thumbnailUrl: null,
            isFolder: true,
          });
        }
      });
    }

    // Process files (Contents)
    if (response.Contents) {
      response.Contents.forEach((item) => {
        const fullPath = item.Key || "";
        const fileName = fullPath.split("/").pop() || "unknown";

        // Skip if this is just the folder marker (ends with /)
        if (fullPath.endsWith("/")) return;

        // Generate a stable ID based on the filename and ETag
        const id =
          fullPath +
          "-" +
          (item.ETag?.replace(/"/g, "") ||
            item.LastModified?.getTime().toString() ||
            "");

        // Determine MIME type from the file extension
        const extension = fileName.split(".").pop()?.toLowerCase() || "";
        const mimeType = getMimeType(extension);

        objects.push({
          id,
          name: fileName,
          path: fullPath,
          type: mimeType,
          size: item.Size || 0,
          lastModified: item.LastModified || new Date(),
          thumbnailUrl: null,
          isFolder: false,
        });
      });
    }

    return {
      objects,
      nextContinuationToken: response.NextContinuationToken,
      isTruncated: response.IsTruncated || false,
      totalCount: response.KeyCount,
    };
  } catch (error) {
    console.error("Error listing objects from R2:", error);
    throw error;
  }
}

// Get a single object
export async function getObject(config: BucketConfig, key: string) {
  try {
    const r2Client = createR2Client(config);
    const command = new GetObjectCommand({
      Bucket: config.name,
      Key: key,
    });

    return await r2Client.send(command);
  } catch (error) {
    console.error(`Error getting object ${key}:`, error);
    throw error;
  }
}

// Delete a single object
export async function deleteObject(config: BucketConfig, key: string) {
  try {
    const r2Client = createR2Client(config);
    const command = new DeleteObjectCommand({
      Bucket: config.name,
      Key: key,
    });

    return await r2Client.send(command);
  } catch (error) {
    console.error(`Error deleting object ${key}:`, error);
    throw error;
  }
}

// Delete multiple objects
export async function deleteObjects(config: BucketConfig, keys: string[]) {
  try {
    const r2Client = createR2Client(config);
    const command = new DeleteObjectsCommand({
      Bucket: config.name,
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

// Delete a folder and all its contents
export async function deleteFolder(config: BucketConfig, folderPath: string) {
  try {
    const r2Client = createR2Client(config);

    // Ensure folder path ends with /
    const normalizedPath = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;

    // First, list all objects with this prefix
    let continuationToken: string | undefined;
    let allKeys: string[] = [];

    do {
      const listCommand = new ListObjectsV2Command({
        Bucket: config.name,
        Prefix: normalizedPath,
        ContinuationToken: continuationToken,
      });

      const listResponse = await r2Client.send(listCommand);

      if (listResponse.Contents) {
        const keys = listResponse.Contents.map(obj => obj.Key).filter(key => key) as string[];
        allKeys.push(...keys);
      }

      continuationToken = listResponse.NextContinuationToken;
    } while (continuationToken);

    if (allKeys.length === 0) {
      // If no objects found, just delete the folder marker if it exists
      allKeys = [normalizedPath];
    }

    // Delete all objects in batches (S3/R2 allows max 1000 objects per delete)
    const batchSize = 1000;
    for (let i = 0; i < allKeys.length; i += batchSize) {
      const batch = allKeys.slice(i, i + batchSize);
      await deleteObjects(config, batch);
    }

    return { deletedCount: allKeys.length };
  } catch (error) {
    console.error(`Error deleting folder ${folderPath}:`, error);
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
    const r2Client = createR2Client(config);
    const command = new PutObjectCommand({
      Bucket: config.name,
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

// Create a folder by uploading an empty object with the folder path
export async function createFolder(config: BucketConfig, folderPath: string) {
  try {
    const r2Client = createR2Client(config);
    // Ensure folder path ends with /
    const normalizedPath = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;

    const command = new PutObjectCommand({
      Bucket: config.name,
      Key: normalizedPath,
      Body: '',
      ContentType: 'application/x-directory',
    });

    return await r2Client.send(command);
  } catch (error) {
    console.error(`Error creating folder ${folderPath}:`, error);
    throw error;
  }
}

// Generate a pre-signed URL for temporary access
export async function generatePresignedUrl(config: BucketConfig, key: string, expiresIn = 3600) {
  try {
    const r2Client = createR2Client(config);
    const command = new GetObjectCommand({
      Bucket: config.name,
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
