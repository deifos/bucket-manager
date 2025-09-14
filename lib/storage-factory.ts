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
    continuationToken?: string,
    prefix?: string
  ) => Promise<PaginatedResult>;
  getObject: (key: string) => Promise<any>;
  deleteObject: (key: string) => Promise<any>;
  deleteObjects: (keys: string[]) => Promise<any>;
  uploadObject: (
    key: string,
    body: Buffer,
    contentType: string
  ) => Promise<any>;
  createFolder: (folderPath: string) => Promise<any>;
  generatePresignedUrl: (key: string, expiresIn?: number) => Promise<string>;
}

export function getStorageClient(config: BucketConfig): StorageOperations {
  // Wrap the client methods with logging for debugging and pass the config
  return {
    listObjects: async (maxKeys = 100, continuationToken?: string, prefix = "") => {
      try {
        let result: PaginatedResult;

        switch (config.provider) {
          case "r2":
            result = await r2Client.listObjects(config, maxKeys, continuationToken, prefix);
            break;
          case "s3":
            result = await s3Client.listObjects(config, maxKeys, continuationToken, prefix);
            break;
          default:
            throw new Error(`Unsupported storage provider: ${config.provider}`);
        }

        return result;
      } catch (error) {
        console.error(`[${config.provider}:${config.name}] Error listing objects:`, error);
        throw error;
      }
    },
    getObject: async (key: string) => {
      switch (config.provider) {
        case "r2":
          return r2Client.getObject(config, key);
        case "s3":
          return s3Client.getObject(config, key);
        default:
          throw new Error(`Unsupported storage provider: ${config.provider}`);
      }
    },
    deleteObject: async (key: string) => {
      switch (config.provider) {
        case "r2":
          return r2Client.deleteObject(config, key);
        case "s3":
          return s3Client.deleteObject(config, key);
        default:
          throw new Error(`Unsupported storage provider: ${config.provider}`);
      }
    },
    deleteObjects: async (keys: string[]) => {
      switch (config.provider) {
        case "r2":
          return r2Client.deleteObjects(config, keys);
        case "s3":
          return s3Client.deleteObjects(config, keys);
        default:
          throw new Error(`Unsupported storage provider: ${config.provider}`);
      }
    },
    uploadObject: async (key: string, body: Buffer, contentType: string) => {
      switch (config.provider) {
        case "r2":
          return r2Client.uploadObject(config, key, body, contentType);
        case "s3":
          return s3Client.uploadObject(config, key, body, contentType);
        default:
          throw new Error(`Unsupported storage provider: ${config.provider}`);
      }
    },
    createFolder: async (folderPath: string) => {
      switch (config.provider) {
        case "r2":
          return r2Client.createFolder(config, folderPath);
        case "s3":
          return s3Client.createFolder(config, folderPath);
        default:
          throw new Error(`Unsupported storage provider: ${config.provider}`);
      }
    },
    generatePresignedUrl: async (key: string, expiresIn = 3600) => {
      switch (config.provider) {
        case "r2":
          return r2Client.generatePresignedUrl(config, key, expiresIn);
        case "s3":
          return s3Client.generatePresignedUrl(config, key, expiresIn);
        default:
          throw new Error(`Unsupported storage provider: ${config.provider}`);
      }
    },
  };
}
