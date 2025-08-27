import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cursorRule, user } from "@/lib/schema"
import { eq, and } from "drizzle-orm"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; ruleId: string }> }
) {
  try {
    const { userId, ruleId } = await params
    
    const [rule] = await db
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
          email: user.email
        }
      })
      .from(cursorRule)
      .leftJoin(user, eq(cursorRule.userId, user.id))
      .where(
        and(
          eq(cursorRule.userId, userId),
          eq(cursorRule.id, ruleId),
          eq(cursorRule.isPublic, true)
        )
      )

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 })
    }

    // Increment view count
    await db
      .update(cursorRule)
      .set({ views: rule.views + 1 })
      .where(eq(cursorRule.id, ruleId))

    return NextResponse.json({
      ...rule,
      views: rule.views + 1 // Return incremented view count
    })
  } catch (error) {
    console.error("Error fetching public rule:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
