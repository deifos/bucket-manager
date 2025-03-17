export interface BucketConfig {
  id: string;
  name: string;
  provider: "r2" | "s3";
  region?: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export function loadBucketConfigs(): BucketConfig[] {
  const configs: BucketConfig[] = [];

  // Load R2 bucket if configured
  if (process.env.CLOUDFLARE_BUCKET_NAME) {
    const r2Bucket = {
      id: "r2-" + process.env.CLOUDFLARE_BUCKET_NAME,
      name: process.env.CLOUDFLARE_BUCKET_NAME,
      provider: "r2" as const,
      endpoint: process.env.CLOUDFLARE_BUCKET_API,
      accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || "",
    };
    configs.push(r2Bucket);
  }

  // Load S3 bucket if configured
  if (process.env.S3_UPLOAD_BUCKET) {
    const s3Bucket = {
      id: "s3-" + process.env.S3_UPLOAD_BUCKET,
      name: process.env.S3_UPLOAD_BUCKET,
      provider: "s3" as const,
      region: process.env.S3_UPLOAD_REGION || "us-east-1",
      accessKeyId: process.env.S3_UPLOAD_KEY || "",
      secretAccessKey: process.env.S3_UPLOAD_SECRET || "",
    };
    configs.push(s3Bucket);
  }

  return configs;
}
