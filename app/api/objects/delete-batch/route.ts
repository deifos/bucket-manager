import { NextRequest, NextResponse } from "next/server";
import { deleteObjects } from "@/lib/r2-client";

// POST: Delete multiple objects at once
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.keys || !Array.isArray(body.keys) || body.keys.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty keys array" },
        { status: 400 }
      );
    }

    await deleteObjects(body.keys);

    return NextResponse.json(
      { message: `${body.keys.length} objects deleted successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete objects:", error);
    return NextResponse.json(
      { error: "Failed to delete objects" },
      { status: 500 }
    );
  }
}
