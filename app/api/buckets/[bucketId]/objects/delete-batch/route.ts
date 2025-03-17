import { NextRequest, NextResponse } from "next/server";
import { loadBucketConfigs } from "@/lib/bucket-config";
import { getStorageClient } from "@/lib/storage-factory";

export async function POST(
  request: NextRequest,
  { params }: { params: { bucketId: string } }
) {
  try {
    const bucketParams = await Promise.resolve(params);
    const bucketId = bucketParams.bucketId;

    const bucketConfigs = loadBucketConfigs();
    const bucketConfig = bucketConfigs.find((c) => c.id === bucketId);

    if (!bucketConfig) {
      return NextResponse.json({ error: "Bucket not found" }, { status: 404 });
    }

    const { keys } = await request.json();

    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json(
        { error: "No valid keys provided for deletion" },
        { status: 400 }
      );
    }

    const storageClient = getStorageClient(bucketConfig.provider);
    await storageClient.deleteObjects(keys);

    return NextResponse.json({
      message: `Successfully deleted ${keys.length} objects`,
    });
  } catch (error) {
    console.error("Failed to delete objects:", error);
    return NextResponse.json(
      { error: "Failed to delete objects" },
      { status: 500 }
    );
  }
}
