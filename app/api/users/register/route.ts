import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "@/lib/payload";

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload();
    const body = await request.json();
    const { email, password, username, name } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Create user
    const user = await payload.create({
      collection: "users",
      data: {
        email,
        password,
        username: username.toLowerCase(),
        name: name || username,
        role: "user",
      },
    });

    // Auto-login after signup
    const loginResult = await payload.login({
      collection: "users",
      data: { email, password },
    });

    return NextResponse.json({
      user: loginResult.user || user,
      token: loginResult.token,
      exp: loginResult.exp,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[API/users/register] Error:", error);
    
    // Handle duplicate email/username
    if (error.message?.includes("duplicate") || error.message?.includes("unique")) {
      return NextResponse.json(
        { error: "Email or username already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Registration failed" },
      { status: error.status || 500 }
    );
  }
}
