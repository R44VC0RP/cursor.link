import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cursorRule, user } from "@/lib/schema"
import { eq, desc, or, ilike } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get('q')

    let query = db
      .select({
        id: cursorRule.id,
        title: cursorRule.title,
        content: cursorRule.content,
        ruleType: cursorRule.ruleType,
        views: cursorRule.views,
        createdAt: cursorRule.createdAt,
        updatedAt: cursorRule.updatedAt,
        user: {
          name: user.name,
        },
      })
      .from(cursorRule)
      .innerJoin(user, eq(cursorRule.userId, user.id))
      .where(eq(cursorRule.isPublic, true))

    // Add search filter if query is provided
    if (searchQuery && searchQuery.trim()) {
      const searchTerm = `%${searchQuery.trim()}%`
      query = query.where(
        or(
          eq(cursorRule.isPublic, true),
          ilike(cursorRule.title, searchTerm),
          ilike(cursorRule.content, searchTerm),
          ilike(user.name, searchTerm)
        )
      )
    }

    // Fetch most viewed public rules (with optional search)
    const rules = await query
      .orderBy(desc(cursorRule.views), desc(cursorRule.createdAt))
      .limit(50)

    return NextResponse.json(rules)
  } catch (error) {
    console.error("Error fetching hot rules:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
