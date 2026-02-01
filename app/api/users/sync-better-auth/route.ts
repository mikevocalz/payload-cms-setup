import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "@/lib/payload";
import { auth } from "@/lib/auth";

/**
 * Sync Better Auth user with Payload CMS user
 * Creates or finds a Payload user matching the Better Auth user's email
 */
export async function POST(request: NextRequest) {
  try {
    // Get the Better Auth session - try multiple methods
    const authHeader = request.headers.get("authorization");
    let token: string | null = null;
    
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    
    // Method 1: Try to verify token with Better Auth directly
    let betterAuthUser = null;
    
    if (token) {
      try {
        // Use Better Auth's session verification API
        const sessionData = await auth.api.getSession({
          headers: {
            authorization: `Bearer ${token}`,
          }
        });
        
        if (sessionData?.user) {
          betterAuthUser = sessionData.user;
        }
      } catch (e) {
        console.log("[Sync] Bearer token verification failed, trying cookie format");
      }
    }
    
    // Method 2: Try with cookie format
    if (!betterAuthUser && token) {
      try {
        const sessionData = await auth.api.getSession({
          headers: {
            cookie: `better-auth.session_token=${token}`,
          }
        });
        
        if (sessionData?.user) {
          betterAuthUser = sessionData.user;
        }
      } catch (e) {
        console.log("[Sync] Cookie format verification failed");
      }
    }
    
    // Method 3: Try with request headers directly
    if (!betterAuthUser) {
      try {
        const sessionData = await auth.api.getSession({
          headers: request.headers,
        });
        
        if (sessionData?.user) {
          betterAuthUser = sessionData.user;
        }
      } catch (e) {
        console.log("[Sync] Request headers verification failed");
      }
    }

    if (!betterAuthUser) {
      return NextResponse.json(
        { error: "Invalid session - could not verify Better Auth token" },
        { status: 401 }
      );
    }

    const payload = await getPayload();

    // Find or create Payload user with matching email
    let payloadUser;
    
    try {
      // Try to find existing user by email
      const existingUsers = await payload.find({
        collection: "users",
        where: {
          email: {
            equals: betterAuthUser.email,
          },
        },
        limit: 1,
      });

      if (existingUsers.docs.length > 0) {
        payloadUser = existingUsers.docs[0];
        
        // Update the user with Better Auth info
        payloadUser = await payload.update({
          collection: "users",
          id: payloadUser.id,
          data: {
            username: betterAuthUser.username || payloadUser.username,
            firstName: betterAuthUser.name || payloadUser.firstName,
            avatar: betterAuthUser.image || payloadUser.avatar,
          },
        });
      } else {
        // Create new Payload user
        payloadUser = await payload.create({
          collection: "users",
          data: {
            email: betterAuthUser.email,
            username: betterAuthUser.username || betterAuthUser.email.split("@")[0],
            firstName: betterAuthUser.name || "User",
            password: Math.random().toString(36).substring(2, 15), // Random password (they'll use Better Auth)
            role: "Basic",
            userType: "Regular",
          },
        });
      }

      return NextResponse.json({
        success: true,
        betterAuthId: betterAuthUser.id,
        payloadUserId: payloadUser.id,
        user: {
          id: String(payloadUser.id),
          email: payloadUser.email,
          username: payloadUser.username,
          name: payloadUser.firstName,
          avatar: payloadUser.avatar,
          bio: payloadUser.bio,
          verified: payloadUser.verified,
          followersCount: payloadUser.followersCount || 0,
          followingCount: payloadUser.followingCount || 0,
          postsCount: payloadUser.postsCount || 0,
        },
      });
    } catch (error: any) {
      console.error("[Sync] Payload operation error:", error);
      return NextResponse.json(
        { error: "Failed to sync user: " + error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[Sync] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync user" },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
