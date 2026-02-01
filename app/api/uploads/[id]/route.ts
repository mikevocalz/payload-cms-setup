import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await getPayload({ config });
    const { id } = params;

    // Get the upload document
    const doc = await payload.findByID({
      collection: "uploads",
      id,
    });

    if (!doc || !doc.data) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Convert base64 back to buffer
    const buffer = Buffer.from(doc.data, 'base64');

    // Return the file with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': doc.mimeType || 'application/octet-stream',
        'Content-Length': doc.filesize.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error("[Serve Upload] Error:", error);
    return NextResponse.json(
      { error: "Failed to serve file" },
      { status: 500 }
    );
  }
}
