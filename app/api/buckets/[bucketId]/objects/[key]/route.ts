import { NextRequest, NextResponse } from "next/server";
import { loadBucketConfigs } from "@/lib/bucket-config";
import { getStorageClient } from "@/lib/storage-factory";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bucketId: string; key: string }> }
) {
  try {
    // Properly await the params object before accessing
    const routeParams = await params;
    const bucketId = routeParams.bucketId;
    const key = decodeURIComponent(routeParams.key);

    const bucketConfigs = loadBucketConfigs();
    const bucketConfig = bucketConfigs.find((c) => c.id === bucketId);

    if (!bucketConfig) {
      return NextResponse.json({ error: "Bucket not found" }, { status: 404 });
    }

    const storageClient = getStorageClient(bucketConfig);

    // Check if we should return a pre-signed URL
    const url = new URL(request.url);
    const presigned = url.searchParams.get("presigned") === "true";

    if (presigned) {
      const presignedUrl = await storageClient.generatePresignedUrl(key);
      return NextResponse.json({ url: presignedUrl });
    }

    // Otherwise, get the object directly
    const object = await storageClient.getObject(key);

    // Get the appropriate content type from the object
    const contentType = object.ContentType || "application/octet-stream";

    // Create a streamed response with the object body
    return new NextResponse(object.Body, {
      headers: {
        "Content-Type": contentType,
      },
    });
  } catch (error) {
    console.error(`Error getting object:`, error);
    return NextResponse.json(
      { error: "Failed to get object" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bucketId: string; key: string }> }
) {
  try {
    // Properly await the params object before accessing
    const routeParams = await params;
    const bucketId = routeParams.bucketId;
    const key = decodeURIComponent(routeParams.key);

    const bucketConfigs = loadBucketConfigs();
    const bucketConfig = bucketConfigs.find((c) => c.id === bucketId);

    if (!bucketConfig) {
      return NextResponse.json({ error: "Bucket not found" }, { status: 404 });
    }

    const storageClient = getStorageClient(bucketConfig);
    await storageClient.deleteObject(key);

    return NextResponse.json({
      message: `Successfully deleted ${key}`,
    });
  } catch (error) {
    console.error(`Error deleting object:`, error);
    return NextResponse.json(
      { error: "Failed to delete object" },
      { status: 500 }
    );
  }
}
