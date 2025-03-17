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

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Cloudflare R2 account with a bucket and/or AWS S3 bucket
- API credentials for your cloud storage provider

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

3. Create a `.env` file at the root of the project based on the `.env.sample` file:

```
# Cloudflare R2 Configuration
CLOUDFLARE_BUCKET_API=https://your-account-id.r2.cloudflarestorage.com
CLOUDFLARE_ACCESS_KEY_ID=your-access-key-id
CLOUDFLARE_SECRET_ACCESS_KEY=your-secret-access-key
CLOUDFLARE_BUCKET_NAME=your-bucket-name

# AWS S3 Configuration (Optional)
S3_UPLOAD_KEY=your-aws-access-key
S3_UPLOAD_SECRET=your-aws-secret-key
S3_UPLOAD_BUCKET=your-s3-bucket-name
S3_UPLOAD_REGION=your-aws-region
```

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
