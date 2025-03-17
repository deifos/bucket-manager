import { BucketConfig } from "@/lib/bucket-config";
import * as r2Client from "@/lib/r2-client";
import * as s3Client from "@/lib/s3-client";

export type StorageObject = r2Client.R2Object | s3Client.S3Object;

export interface StorageOperations {
  listObjects: () => Promise<StorageObject[]>;
  getObject: (key: string) => Promise<any>;
  deleteObject: (key: string) => Promise<any>;
  deleteObjects: (keys: string[]) => Promise<any>;
  uploadObject: (
    key: string,
    body: Buffer,
    contentType: string
  ) => Promise<any>;
  generatePresignedUrl: (key: string, expiresIn?: number) => Promise<string>;
}

export function getStorageClient(provider: string): StorageOperations {
  console.log(`Getting storage client for provider: ${provider}`);

  let client: StorageOperations;

  switch (provider) {
    case "r2":
      console.log("Using Cloudflare R2 client");
      client = r2Client;
      break;
    case "s3":
      console.log("Using AWS S3 client");
      client = s3Client;
      break;
    default:
      console.error(`Unsupported storage provider: ${provider}`);
      throw new Error(`Unsupported storage provider: ${provider}`);
  }

  // Wrap the client methods with logging for debugging
  return {
    listObjects: async () => {
      console.log(`[${provider}] Listing objects`);
      try {
        const result = await client.listObjects();
        console.log(`[${provider}] Listed ${result.length} objects`);
        return result;
      } catch (error) {
        console.error(`[${provider}] Error listing objects:`, error);
        throw error;
      }
    },
    getObject: async (key: string) => {
      console.log(`[${provider}] Getting object: ${key}`);
      return client.getObject(key);
    },
    deleteObject: async (key: string) => {
      console.log(`[${provider}] Deleting object: ${key}`);
      return client.deleteObject(key);
    },
    deleteObjects: async (keys: string[]) => {
      console.log(`[${provider}] Deleting ${keys.length} objects`);
      return client.deleteObjects(keys);
    },
    uploadObject: async (key: string, body: Buffer, contentType: string) => {
      console.log(`[${provider}] Uploading object: ${key} (${contentType})`);
      return client.uploadObject(key, body, contentType);
    },
    generatePresignedUrl: async (key: string, expiresIn = 3600) => {
      console.log(`[${provider}] Generating presigned URL for: ${key}`);
      return client.generatePresignedUrl(key, expiresIn);
    },
  };
}
