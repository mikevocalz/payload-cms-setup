import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "@/lib/payload";

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload();
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const filter = searchParams.get("filter"); // "upcoming", "past", "all"
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    const where: any = {};

    // Filter by category
    if (category && category !== "all") {
      where.category = { equals: category };
    }

    // Filter by date
    if (filter === "upcoming") {
      where.date = { greater_than: new Date().toISOString() };
    } else if (filter === "past") {
      where.date = { less_than: new Date().toISOString() };
    }

    const events = await payload.find({
      collection: "events",
      where: Object.keys(where).length > 0 ? where : undefined,
      sort: filter === "past" ? "-date" : "date",
      page,
      limit,
      depth: 2,
    });

    return NextResponse.json({
      docs: events.docs,
      totalDocs: events.totalDocs,
      totalPages: events.totalPages,
      page: events.page,
      hasNextPage: events.hasNextPage,
      hasPrevPage: events.hasPrevPage,
    });
  } catch (error: any) {
    console.error("[API/events] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}
