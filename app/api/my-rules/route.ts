import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { cursorRule } from "@/lib/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rules = await db
      .select({
        id: cursorRule.id,
        title: cursorRule.title,
        content: cursorRule.content,
        ruleType: cursorRule.ruleType,
        isPublic: cursorRule.isPublic,
        views: cursorRule.views,
        createdAt: cursorRule.createdAt,
        updatedAt: cursorRule.updatedAt,
      })
      .from(cursorRule)
      .where(eq(cursorRule.userId, session.user.id))
      .orderBy(desc(cursorRule.updatedAt))

    return NextResponse.json(rules)
  } catch (error) {
    console.error("Error fetching user rules:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
