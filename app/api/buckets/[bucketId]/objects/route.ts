import { NextRequest, NextResponse } from "next/server";
import { loadBucketConfigs } from "@/lib/bucket-config";
import { getStorageClient } from "@/lib/storage-factory";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bucketId: string }> }
) {
  try {
    // Get pagination and folder parameters from search params
    const searchParams = request.nextUrl.searchParams;
    const maxKeys = searchParams.get("maxKeys")
      ? parseInt(searchParams.get("maxKeys") as string, 10)
      : 100;
    const continuationToken =
      searchParams.get("continuationToken") || undefined;
    const prefix = searchParams.get("prefix") || "";

    // Properly await the params object before accessing
    const bucketParams = await params;
    const bucketId = bucketParams.bucketId;

    const bucketConfigs = loadBucketConfigs();

    const bucketConfig = bucketConfigs.find((c) => c.id === bucketId);
    if (!bucketConfig) {
      console.error(`Bucket not found with ID: ${bucketId}`);
      return NextResponse.json({ error: "Bucket not found" }, { status: 404 });
    }

    const storageClient = getStorageClient(bucketConfig);

    const result = await storageClient.listObjects(maxKeys, continuationToken, prefix);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to list objects:", error);
    return NextResponse.json(
      {
        error: "Failed to list objects",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST: Upload a new object
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bucketId: string }> }
) {
  try {
    // Properly await the params object before accessing
    const bucketParams = await params;
    const bucketId = bucketParams.bucketId;

    const bucketConfigs = loadBucketConfigs();
    const bucketConfig = bucketConfigs.find((c) => c.id === bucketId);

    if (!bucketConfig) {
      console.error(`Bucket not found with ID: ${bucketId}`);
      return NextResponse.json({ error: "Bucket not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const prefix = formData.get("prefix") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type;
    const filename = file.name;

    // Construct full key path with folder prefix
    const key = prefix ? `${prefix}${filename}` : filename;

    // Get appropriate client and upload
    const storageClient = getStorageClient(bucketConfig);
    await storageClient.uploadObject(key, buffer, contentType);

    return NextResponse.json(
      { message: "File uploaded successfully", filename, key },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to upload object:", error);
    return NextResponse.json(
      {
        error: "Failed to upload object",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
