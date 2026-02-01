import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "@/lib/payload";
import { getServerSideUser } from "@/lib/auth/payload";

// Route handlers for current user profile
export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload();
    const user = await getServerSideUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const fullUser = await payload.findByID({
      collection: "users",
      id: user.id,
      depth: 2,
    });

    return NextResponse.json({ user: fullUser });
  } catch (error: any) {
    console.error("[API/users/me] GET Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user" },
      { status: error.status || 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = await getPayload();
    const user = await getServerSideUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Update user profile
    const updatedUser = await payload.update({
      collection: "users",
      id: user.id,
      data: body,
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error("[API/users/me] PATCH Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: error.status || 500 }
    );
  }
}
