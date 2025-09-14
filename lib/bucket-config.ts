export interface BucketConfig {
  id: string;
  name: string;
  displayName: string;
  provider: "r2" | "s3";
  region?: string;
  endpoint?: string;
  publicUrl?: string;
  accessKeyId: string;
  secretAccessKey: string;
}

import fs from 'fs';
import path from 'path';

interface BucketConfigFile {
  buckets: BucketConfig[];
}

export function loadBucketConfigs(): BucketConfig[] {
  try {
    const configPath = path.join(process.cwd(), 'config', 'buckets.json');

    if (!fs.existsSync(configPath)) {
      throw new Error('No buckets.json configuration file found. Please create config/buckets.json with your bucket configurations.');
    }

    const configData = fs.readFileSync(configPath, 'utf8');
    const config: BucketConfigFile = JSON.parse(configData);

    if (!config.buckets || !Array.isArray(config.buckets)) {
      throw new Error('Invalid buckets.json format. Expected an object with a "buckets" array.');
    }

    // Validate each bucket configuration
    config.buckets.forEach((bucket, index) => {
      if (!bucket.id || !bucket.name || !bucket.provider || !bucket.accessKeyId || !bucket.secretAccessKey) {
        throw new Error(`Invalid bucket configuration at index ${index}. Missing required fields: id, name, provider, accessKeyId, secretAccessKey`);
      }

      if (bucket.provider === 'r2' && !bucket.endpoint) {
        throw new Error(`R2 bucket "${bucket.name}" is missing required endpoint field`);
      }
    });

    console.log(`Loaded ${config.buckets.length} bucket configuration(s)`);
    return config.buckets;

  } catch (error) {
    console.error('Error loading bucket configurations:', error);
    throw error;
  }
}
