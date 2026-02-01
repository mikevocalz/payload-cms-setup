/**
 * Better Auth Email Sign-In Endpoint
 * Explicit route to handle email/password login
 */
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log("[Better Auth] Sign-in request:", { email });

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Use Better Auth's signIn method
    const result = await auth.api.signInEmail({
      body: { email, password },
    });

    console.log("[Better Auth] Sign-in result:", result);
    
    // Return as JSON Response
    if (result.error) {
      return NextResponse.json(
        { error: result.error.message || "Invalid email or password" },
        { status: 401 }
      );
    }

    return NextResponse.json(result.data || result, { status: 200 });
  } catch (error: any) {
    console.error("[Better Auth] Sign-in error:", error);
    return NextResponse.json(
      { error: error.message || "Sign-in failed" },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
