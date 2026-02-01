import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";

// Increase body size limit for file uploads
export const maxDuration = 60; // Maximum duration in seconds
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

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create media document via Payload
    const doc = await payload.create({
      collection: "media",
      data: {
        alt: file.name,
        owner: user.id,
      },
      file: {
        data: buffer,
        mimetype: file.type,
        name: file.name,
        size: file.size,
      },
      user,
    });

    console.log("[Upload] Media created:", doc.id, doc.url);

    return NextResponse.json({
      success: true,
      doc,
    });
  } catch (error: any) {
    console.error("[Upload] Error:", error);
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
