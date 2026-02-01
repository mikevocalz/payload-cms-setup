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

    console.log("[Better Auth] Sign-up request:", { email, name, username });

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Use Better Auth's signUp method
    const result = await auth.api.signUpEmail({
      body: { 
        email, 
        password, 
        name,
        ...(username && { username })
      },
      asResponse: true,
    });

    console.log("[Better Auth] Sign-up result status:", result.status);
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
