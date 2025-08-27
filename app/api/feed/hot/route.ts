import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cursorRule, user } from "@/lib/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    // Fetch most viewed public rules
    const rules = await db
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
      .orderBy(desc(cursorRule.views), desc(cursorRule.createdAt))
      .limit(50)

    return NextResponse.json(rules)
  } catch (error) {
    console.error("Error fetching hot rules:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
