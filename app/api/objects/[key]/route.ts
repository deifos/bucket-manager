import { NextRequest, NextResponse } from "next/server";
import { getObject, deleteObject, generatePresignedUrl } from "@/lib/r2-client";

// GET: Get a specific object or generate a pre-signed URL
export async function GET(
  request: NextRequest,
  context: { params: { key: string } }
) {
  try {
    // Properly await params before accessing key
    const params = await context.params;
    const key = decodeURIComponent(params.key);
    const { searchParams } = new URL(request.url);
    const presigned = searchParams.get("presigned");

    if (presigned === "true") {
      // Generate a pre-signed URL for the object
      const url = await generatePresignedUrl(key);
      return NextResponse.json({ url });
    } else {
      // Get the object directly
      const object = await getObject(key);

      // Get the object body as a stream
      const stream = object.Body?.transformToWebStream();

      if (!stream) {
        return NextResponse.json(
          { error: "Failed to get object stream" },
          { status: 500 }
        );
      }

      // Return the object with appropriate headers
      return new NextResponse(stream, {
        headers: {
          "Content-Type": object.ContentType || "application/octet-stream",
          "Content-Length": object.ContentLength?.toString() || "",
          "Content-Disposition": `attachment; filename="${key
            .split("/")
            .pop()}"`,
        },
      });
    }
  } catch (error) {
    console.error(`Failed to get object:`, error);
    return NextResponse.json(
      { error: "Failed to get object" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a specific object
export async function DELETE(
  _request: NextRequest,
  context: { params: { key: string } }
) {
  try {
    // Properly await params before accessing key
    const params = await context.params;
    const key = decodeURIComponent(params.key);
    await deleteObject(key);

    return NextResponse.json(
      { message: "Object deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Failed to delete object:`, error);
    return NextResponse.json(
      { error: "Failed to delete object" },
      { status: 500 }
    );
  }
}
