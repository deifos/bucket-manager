import { BucketConfig } from "@/lib/bucket-config";
import * as r2Client from "@/lib/r2-client";
import * as s3Client from "@/lib/s3-client";

export type StorageObject = r2Client.R2Object | s3Client.S3Object;

export interface PaginatedResult {
  objects: StorageObject[];
  nextContinuationToken?: string;
  isTruncated: boolean;
  totalCount?: number;
}

export interface StorageOperations {
  listObjects: (
    maxKeys?: number,
    continuationToken?: string
  ) => Promise<PaginatedResult>;
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
  let client: StorageOperations;

  switch (provider) {
    case "r2":
      client = r2Client;
      break;
    case "s3":
      client = s3Client;
      break;
    default:
      console.error(`Unsupported storage provider: ${provider}`);
      throw new Error(`Unsupported storage provider: ${provider}`);
  }

  // Wrap the client methods with logging for debugging
  return {
    listObjects: async (maxKeys = 100, continuationToken?: string) => {
      try {
        const result = await client.listObjects(maxKeys, continuationToken);

        return result;
      } catch (error) {
        console.error(`[${provider}] Error listing objects:`, error);
        throw error;
      }
    },
    getObject: async (key: string) => {
      return client.getObject(key);
    },
    deleteObject: async (key: string) => {
      return client.deleteObject(key);
    },
    deleteObjects: async (keys: string[]) => {
      return client.deleteObjects(keys);
    },
    uploadObject: async (key: string, body: Buffer, contentType: string) => {
      return client.uploadObject(key, body, contentType);
    },
    generatePresignedUrl: async (key: string, expiresIn = 3600) => {
      return client.generatePresignedUrl(key, expiresIn);
    },
  };
}
