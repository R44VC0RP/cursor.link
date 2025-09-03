import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cursorRule, user } from "@/lib/schema"
import { eq, desc, or, ilike, and } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get('q')

    // Build where condition
    let whereCondition
    
    if (searchQuery && searchQuery.trim()) {
      const searchTerm = `%${searchQuery.trim()}%`
      whereCondition = and(
        eq(cursorRule.isPublic, true),
        or(
          ilike(cursorRule.title, searchTerm),
          ilike(cursorRule.content, searchTerm),
          ilike(user.name, searchTerm)
        )
      )!
    } else {
      whereCondition = eq(cursorRule.isPublic, true)
    }

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
      .where(whereCondition)

    // Fetch newest public rules (with optional search)
    const rules = await query
      .orderBy(desc(cursorRule.createdAt))
      .limit(50)

    return NextResponse.json(rules)
  } catch (error) {
    console.error("Error fetching new rules:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
