/**
 * Better Auth Email Sign-Up Endpoint  
 * Explicit route to handle email/password registration
 */
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, username } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Use Better Auth's signUp method
    const result = await auth.api.signUpEmail({
      body: { email, password, name, username },
      headers: request.headers,
    });

    return result;
  } catch (error: any) {
    console.error("[Better Auth] Sign-up error:", error);
    return NextResponse.json(
      { error: error.message || "Sign-up failed" },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
