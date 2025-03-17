# R2 Bucket Manager

A modern web application for managing files in Cloudflare R2 storage buckets.

![Bucket Manager](https://placehold.co/600x400?text=R2+Bucket+Manager)

## Features

- 📁 Browse and manage files in your Cloudflare R2 bucket
- 🔍 Preview images, videos, and other file types
- ⬆️ Upload files with drag-and-drop support
- ⬇️ Download files directly to your device
- 🗑️ Delete single or multiple files
- 📱 Responsive design that works on desktop and mobile

## Technology Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **UI Components**: Radix UI with Shadcn UI
- **API**: Next.js API routes
- **Storage**: Cloudflare R2 (using AWS S3 compatible API)

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Cloudflare R2 account with a bucket
- Cloudflare R2 API credentials

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

3. Create a `.env` file at the root of the project based on the `env.sampe` file:

```
CLOUDFLARE_BUCKET_API=https://your-account-id.r2.cloudflarestorage.com
CLOUDFLARE_ACCESS_KEY_ID=your-access-key-id
CLOUDFLARE_SECRET_ACCESS_KEY=your-secret-access-key
CLOUDFLARE_BUCKET_NAME=your-bucket-name
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
