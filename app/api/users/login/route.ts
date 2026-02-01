import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "@/lib/payload";

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload();
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    console.log("[API/users/login] Attempting login for:", email);

    // Use Payload's built-in login
    const result = await payload.login({
      collection: "users",
      data: { email, password },
    });

    console.log("[API/users/login] Login result:", { 
      hasUser: !!result.user, 
      hasToken: !!result.token,
      userId: result.user?.id 
    });

    if (!result.user || !result.token) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: result.user,
      token: result.token,
      exp: result.exp,
    });
  } catch (error: any) {
    console.error("[API/users/login] Error:", error);
    console.error("[API/users/login] Error message:", error.message);
    return NextResponse.json(
      { error: error.message || "Login failed" },
      { status: error.status || 500 }
    );
  }
}
