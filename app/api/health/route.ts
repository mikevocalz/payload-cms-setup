import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "@/lib/payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 10;

/**
 * Health check endpoint for Payload CMS + Database
 * 
 * Returns:
 * - 200 OK if database is reachable
 * - 503 Service Unavailable if database connection fails
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const payload = await getPayload();
    
    // Quick DB ping - just count users (lightweight query)
    const result = await payload.find({
      collection: "users",
      limit: 1,
      depth: 0,
    });
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      status: "ok",
      service: "payload-cms",
      database: "connected",
      responseTime: `${duration}ms`,
      timestamp: new Date().toISOString(),
    }, { status: 200 });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[Health] Database connection failed:", error);
    
    return NextResponse.json({
      status: "error",
      service: "payload-cms",
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
      responseTime: `${duration}ms`,
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
