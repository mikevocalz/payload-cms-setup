import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "@/lib/payload";

/**
 * Sync Better Auth user with Payload CMS user
 * Creates or finds a Payload user matching the Better Auth user's email
 * 
 * This endpoint expects the Better Auth user data in the request body
 * (sent from the mobile app after login/signup)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, username, avatar, betterAuthId } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
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
            equals: email,
          },
        },
        limit: 1,
      });

      if (existingUsers.docs.length > 0) {
        payloadUser = existingUsers.docs[0];
        
        // Update the user with Better Auth info (don't update password for existing users)
        const updateData: any = {};
        if (username) updateData.username = username;
        if (name) updateData.firstName = name;
        if (avatar) updateData.avatar = avatar;
        
        if (Object.keys(updateData).length > 0) {
          payloadUser = await payload.update({
            collection: "users",
            id: payloadUser.id,
            data: updateData,
          });
        }
      } else {
        // Create new Payload user
        payloadUser = await payload.create({
          collection: "users",
          data: {
            email,
            username: username || email.split("@")[0],
            firstName: name || "User",
            password: Math.random().toString(36).substring(2, 15), // Random password (they'll use Better Auth)
            role: "Basic",
            userType: "Regular",
          },
        });
      }

      // Generate Payload JWT token for this user
      const token = await payload.login({
        collection: "users",
        data: { email, id: payloadUser.id },
      });

      return NextResponse.json({
        success: true,
        betterAuthId: betterAuthId,
        payloadUserId: payloadUser.id,
        payloadToken: token.token, // Return Payload JWT token
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
