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

    // In Vercel environment, we need to handle uploads differently
    // Store in database and serve via API instead of filesystem
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
      disableVerifyEmail: true,
    });

    console.log("[Upload] Media created:", doc.id);

    // Construct the URL - use the API endpoint to serve the file
    const mediaUrl = doc.url || `/api/media/${doc.id}`;

    return NextResponse.json({
      success: true,
      doc: {
        ...doc,
        url: mediaUrl.startsWith('http') ? mediaUrl : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://payload-cms-setup-gray.vercel.app'}${mediaUrl}`,
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
