import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { list, listRule, cursorRule, user } from "@/lib/schema"
import { eq, and, desc } from "drizzle-orm"

// GET /api/lists/[listId] - Get a specific list with its rules
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { listId } = await params

    // Get the list
    const [listData] = await db
      .select()
      .from(list)
      .where(and(
        eq(list.id, listId),
        eq(list.userId, session.user.id)
      ))

    if (!listData) {
      return NextResponse.json({ error: "List not found" }, { status: 404 })
    }

    // Get the rules in the list
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
        addedAt: listRule.createdAt,
        user: {
          name: user.name,
        }
      })
      .from(listRule)
      .leftJoin(cursorRule, eq(listRule.ruleId, cursorRule.id))
      .leftJoin(user, eq(cursorRule.userId, user.id))
      .where(eq(listRule.listId, listId))
      .orderBy(desc(listRule.createdAt))

    return NextResponse.json({
      ...listData,
      rules
    })
  } catch (error) {
    console.error("Error fetching list:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/lists/[listId] - Delete a list
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { listId } = await params

    // Delete the list (list_rule entries will be cascade deleted)
    const result = await db
      .delete(list)
      .where(and(
        eq(list.id, listId),
        eq(list.userId, session.user.id)
      ))
      .returning()

    if (result.length === 0) {
      return NextResponse.json({ error: "List not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting list:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
