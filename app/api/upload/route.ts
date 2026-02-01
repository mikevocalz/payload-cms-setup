import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config });

    // Authenticate user
    const { user } = await payload.auth({ headers: request.headers });
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the FormData
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    console.log("[Upload] Received file:", file.name, file.type, file.size);

    // Convert File to base64 for database storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    // Store directly in a simple uploads collection (no Payload upload field)
    const doc = await payload.create({
      collection: "uploads",
      data: {
        filename: file.name,
        mimeType: file.type,
        filesize: file.size,
        data: base64,
        owner: user.id,
      },
    });

    console.log("[Upload] File stored:", doc.id);

    // Construct URL to serve the file
    const fileUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://payload-cms-setup-gray.vercel.app'}/api/uploads/${doc.id}`;

    return NextResponse.json({
      success: true,
      doc: {
        id: doc.id,
        filename: file.name,
        url: fileUrl,
        mimeType: file.type,
        filesize: file.size,
      },
    });
  } catch (error: any) {
    console.error("[Upload] Error:", error);
    console.error("[Upload] Stack:", error.stack);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Upload failed",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
