import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "@/lib/payload";
import { auth } from "@/lib/auth";

/**
 * Sync Better Auth user with Payload CMS user
 * Creates or finds a Payload user matching the Better Auth user's email
 */
export async function POST(request: NextRequest) {
  try {
    // Get the Better Auth session from the token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify the Better Auth session
    const session = await auth.api.getSession({
      headers: { cookie: `better-auth.session_token=${token}` }
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const betterAuthUser = session.user;
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
