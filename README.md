# Cloud Storage Bucket Manager

A modern web application for managing files in Cloudflare R2 and AWS S3 storage buckets.

![Bucket Manager](https://github.com/deifos/bucket-manager/raw/main/public/images/docs/bucket_manager.JPG)

## Features

- 📁 Browse and manage files in your Cloudflare R2 or AWS S3 buckets
- 🔍 Preview images, videos, and other file types
- ⬆️ Upload files with drag-and-drop support
- ⬇️ Download files directly to your device
- 🗑️ Delete single or multiple files
- 📱 Responsive design that works on desktop and mobile

## Technology Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **UI Components**: Radix UI with Shadcn UI
- **API**: Next.js API routes
- **Storage**: Cloudflare R2 and AWS S3 (using AWS SDK)

## Required Permissions

### AWS S3 and Cloudflare R2 Bucket Permissions

For the application to fully function (list, read, upload, and delete files), your AWS IAM user or Cloudflare R2 API token must have the following permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

**Important Notes:**
- Replace `your-bucket-name` with your actual bucket name
- The `s3:ListBucket` permission must be on the bucket resource (without `/*`)
- Object-level permissions (`s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`) must be on bucket objects (with `/*`)
- For Cloudflare R2, use the same policy format - R2 is S3-compatible

### Permission Breakdown:
- `s3:ListBucket`: View files and folders in the bucket
- `s3:GetObject`: Download and preview files
- `s3:PutObject` + `s3:PutObjectAcl`: Upload files
- `s3:DeleteObject`: Delete files

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Cloudflare R2 account with a bucket and/or AWS S3 bucket
- API credentials for your cloud storage provider with the required permissions above

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/bucket-manager.git
cd bucket-manager
```

2. Install dependencies:

```bash
npm install
# or
pnpm install
```

3. **Configure your buckets:**

Create a `config/buckets.json` file with your bucket configurations:

```json
{
  "buckets": [
    {
      "id": "s3-my-bucket",
      "name": "my-bucket",
      "displayName": "My S3 Bucket",
      "provider": "s3",
      "region": "us-west-2",
      "accessKeyId": "your-aws-access-key",
      "secretAccessKey": "your-aws-secret-key"
    },
    {
      "id": "s3-production",
      "name": "production-bucket",
      "displayName": "Production Files",
      "provider": "s3",
      "region": "us-east-1",
      "accessKeyId": "your-production-access-key",
      "secretAccessKey": "your-production-secret-key"
    },
    {
      "id": "r2-media",
      "name": "media-files",
      "displayName": "Media Files (R2)",
      "provider": "r2",
      "endpoint": "https://your-account-id.r2.cloudflarestorage.com",
      "publicUrl": "https://media.yourdomain.com",
      "accessKeyId": "your-r2-access-key",
      "secretAccessKey": "your-r2-secret-key"
    }
  ]
}
```

**Configuration Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier for the bucket (e.g., "s3-my-bucket") |
| `name` | Yes | Actual bucket name in your cloud provider |
| `displayName` | Yes | Human-readable name shown in the UI |
| `provider` | Yes | Either "s3" or "r2" |
| `region` | S3 only | AWS region (e.g., "us-west-2") |
| `endpoint` | R2 only | R2 API endpoint URL |
| `publicUrl` | R2 optional | Public URL for R2 bucket (if configured) |
| `accessKeyId` | Yes | API access key |
| `secretAccessKey` | Yes | API secret key |

**Security Notes:**
- The `config/buckets.json` file is automatically ignored by Git
- Never commit credentials to your repository
- For production deployments, consider using secure secret management systems
- You can configure unlimited buckets per provider

### Development

Run the development server:

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Building for Production

```bash
npm run build
npm run start
# or
pnpm build
pnpm start
```

## Deployment

This application can be deployed on Vercel, Netlify, or any platform that supports Next.js applications. Make sure to configure environment variables for your deployment platform.

## Security Considerations

- All API credentials are stored as environment variables and never exposed to the client.
- The app uses pre-signed URLs for secure file access.
- Strong confirmation is required before file deletion.

## License

[MIT](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
