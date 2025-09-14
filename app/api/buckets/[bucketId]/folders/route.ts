import { NextRequest, NextResponse } from "next/server";
import { loadBucketConfigs } from "@/lib/bucket-config";
import { getStorageClient } from "@/lib/storage-factory";

// POST: Create a new folder
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

    const { folderName, currentPrefix } = await request.json();

    if (!folderName || typeof folderName !== 'string') {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
    }

    // Sanitize folder name - remove slashes and special characters
    const sanitizedFolderName = folderName.replace(/[/\\]/g, '').trim();
    if (!sanitizedFolderName) {
      return NextResponse.json({ error: "Invalid folder name" }, { status: 400 });
    }

    // Construct full folder path
    const folderPath = currentPrefix
      ? `${currentPrefix}${sanitizedFolderName}/`
      : `${sanitizedFolderName}/`;

    // Get appropriate client and create folder
    const storageClient = getStorageClient(bucketConfig);
    await storageClient.createFolder(folderPath);

    return NextResponse.json(
      {
        message: "Folder created successfully",
        folderPath,
        folderName: sanitizedFolderName
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create folder:", error);
    return NextResponse.json(
      {
        error: "Failed to create folder",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete a folder and all its contents
export async function DELETE(
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

    const { folderPath } = await request.json();

    if (!folderPath || typeof folderPath !== 'string') {
      return NextResponse.json({ error: "Folder path is required" }, { status: 400 });
    }

    // Get appropriate client and delete folder
    const storageClient = getStorageClient(bucketConfig);
    const result = await storageClient.deleteFolder(folderPath);

    return NextResponse.json(
      {
        message: `Folder and ${result.deletedCount} item(s) deleted successfully`,
        deletedCount: result.deletedCount,
        folderPath
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete folder:", error);
    return NextResponse.json(
      {
        error: "Failed to delete folder",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}