import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "@/lib/payload";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    console.log("[TestAuth] Auth header:", authHeader);
    
    if (!authHeader) {
      return NextResponse.json({ error: "No auth header" }, { status: 400 });
    }

    // Try to decode the token first
    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.decode(token);
    console.log("[TestAuth] Decoded token:", decoded);

    // Try to verify it
    const secret = process.env.PAYLOAD_SECRET;
    if (secret) {
      try {
        const verified = jwt.verify(token, secret);
        console.log("[TestAuth] Token verified:", verified);
      } catch (verifyError: any) {
        console.error("[TestAuth] Token verify failed:", verifyError.message);
        return NextResponse.json({ 
          error: "Token verification failed", 
          details: verifyError.message,
          decoded 
        }, { status: 401 });
      }
    }

    // Now try Payload's auth
    const payload = await getPayload();
    const { user } = await payload.auth({ headers: request.headers });
    
    console.log("[TestAuth] Payload auth result:", user ? user.id : "null");

    if (!user) {
      return NextResponse.json({ 
        error: "Payload auth failed",
        decoded,
        note: "Token decoded and verified, but Payload rejected it" 
      }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      userId: user.id,
      email: user.email 
    });
  } catch (error: any) {
    console.error("[TestAuth] Error:", error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
