import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cursorRule, user } from "@/lib/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    // Fetch newest public rules
    const rules = await db
      .select({
        id: cursorRule.id,
        title: cursorRule.title,
        content: cursorRule.content,
        type: cursorRule.type,
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
      .orderBy(desc(cursorRule.createdAt))
      .limit(50)

    return NextResponse.json(rules)
  } catch (error) {
    console.error("Error fetching new rules:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
