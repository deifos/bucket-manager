import { NextRequest, NextResponse } from "next/server";
import { loadBucketConfigs } from "@/lib/bucket-config";
import { getStorageClient } from "@/lib/storage-factory";

export async function GET(
  request: NextRequest,
  { params }: { params: { bucketId: string } }
) {
  try {
    console.log(
      "GET request to /api/buckets/[bucketId]/objects with params:",
      params
    );

    // Properly await the params object before accessing
    const bucketParams = await Promise.resolve(params);
    const bucketId = bucketParams.bucketId;
    console.log("Looking for bucket with ID:", bucketId);

    const bucketConfigs = loadBucketConfigs();
    console.log(
      "Available bucket configs:",
      bucketConfigs.map((b) => ({
        id: b.id,
        name: b.name,
        provider: b.provider,
      }))
    );

    const bucketConfig = bucketConfigs.find((c) => c.id === bucketId);
    if (!bucketConfig) {
      console.error(`Bucket not found with ID: ${bucketId}`);
      return NextResponse.json({ error: "Bucket not found" }, { status: 404 });
    }

    console.log(
      `Using ${bucketConfig.provider} storage client for bucket: ${bucketConfig.name}`
    );
    const storageClient = getStorageClient(bucketConfig.provider);
    console.log("Requesting objects from storage client...");

    const objects = await storageClient.listObjects();
    console.log(
      `Retrieved ${objects.length} objects from ${bucketConfig.provider} bucket:`,
      objects.length > 0 ? objects.slice(0, 2) : "no objects"
    );

    return NextResponse.json(objects);
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
  { params }: { params: { bucketId: string } }
) {
  try {
    console.log(
      "POST request to /api/buckets/[bucketId]/objects with params:",
      params
    );

    // Properly await the params object before accessing
    const bucketParams = await Promise.resolve(params);
    const bucketId = bucketParams.bucketId;

    const bucketConfigs = loadBucketConfigs();
    const bucketConfig = bucketConfigs.find((c) => c.id === bucketId);

    if (!bucketConfig) {
      console.error(`Bucket not found with ID: ${bucketId}`);
      return NextResponse.json({ error: "Bucket not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log(
      `Uploading file "${file.name}" (${file.size} bytes) to ${bucketConfig.provider} bucket: ${bucketConfig.name}`
    );

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type;
    const filename = file.name;

    // Get appropriate client and upload
    const storageClient = getStorageClient(bucketConfig.provider);
    await storageClient.uploadObject(filename, buffer, contentType);

    console.log(
      `Successfully uploaded file "${filename}" to ${bucketConfig.provider} bucket: ${bucketConfig.name}`
    );

    return NextResponse.json(
      { message: "File uploaded successfully", filename },
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
