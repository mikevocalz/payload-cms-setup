import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "@/lib/payload";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const postId = params.id;

  try {
    const payload = await getPayload();
    
    const post = await payload.findByID({
      collection: "posts",
      id: postId,
      depth: 2,
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error: any) {
    console.error("[API/posts/:id] GET Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const postId = params.id;

  try {
    const payload = await getPayload();
    const user = await payload.auth({ headers: request.headers });

    if (!user.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Verify ownership
    const post = await payload.findByID({
      collection: "posts",
      id: postId,
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const authorId = typeof post.author === "object" ? (post.author as any).id : post.author;
    if (String(authorId) !== String(user.user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await payload.update({
      collection: "posts",
      id: postId,
      data: {
        ...body,
        editedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[API/posts/:id] PUT Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const postId = params.id;

  try {
    const payload = await getPayload();
    const user = await payload.auth({ headers: request.headers });

    if (!user.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const post = await payload.findByID({
      collection: "posts",
      id: postId,
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const authorId = typeof post.author === "object" ? (post.author as any).id : post.author;
    if (String(authorId) !== String(user.user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft delete
    await payload.update({
      collection: "posts",
      id: postId,
      data: {
        deletedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ success: true, id: postId });
  } catch (error: any) {
    console.error("[API/posts/:id] DELETE Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}
