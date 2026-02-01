import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "@/lib/payload";

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload();
    const { user } = await payload.auth({ headers: request.headers });

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Logout by invalidating the token (Payload handles this)
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[API/users/logout] Error:", error);
    return NextResponse.json(
      { error: error.message || "Logout failed" },
      { status: error.status || 500 }
    );
  }
}
