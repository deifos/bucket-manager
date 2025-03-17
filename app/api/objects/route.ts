import { NextRequest, NextResponse } from "next/server";
import { listObjects, uploadObject } from "@/lib/r2-client";

// GET: List all objects in the bucket
export async function GET() {
  try {
    const objects = await listObjects();
    return NextResponse.json(objects);
  } catch (error) {
    console.error("Failed to list objects:", error);
    return NextResponse.json(
      { error: "Failed to list objects" },
      { status: 500 }
    );
  }
}

// POST: Upload a new object
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type;
    const filename = file.name;

    // Upload to R2
    await uploadObject(filename, buffer, contentType);

    return NextResponse.json(
      { message: "File uploaded successfully", filename },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to upload object:", error);
    return NextResponse.json(
      { error: "Failed to upload object" },
      { status: 500 }
    );
  }
}
