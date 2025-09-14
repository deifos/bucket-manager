import { NextResponse } from "next/server";
import { loadBucketConfigs } from "@/lib/bucket-config";

export async function GET() {
  try {
    const buckets = loadBucketConfigs();

    // Remove sensitive data before sending to client
    const safeBuckets = buckets.map((bucket) => ({
      id: bucket.id,
      name: bucket.name,
      displayName: bucket.displayName,
      provider: bucket.provider,
    }));

    return NextResponse.json(safeBuckets);
  } catch (error) {
    console.error("Failed to list buckets:", error);
    return NextResponse.json(
      { error: "Failed to list buckets" },
      { status: 500 }
    );
  }
}
