import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { list, listRule, cursorRule } from "@/lib/schema"
import { eq, and, or } from "drizzle-orm"
import { nanoid } from "nanoid"

// POST /api/lists/[listId]/rules - Add a rule to a list
export async function POST(
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
    const { ruleId } = await request.json()

    if (!ruleId || typeof ruleId !== "string") {
      return NextResponse.json({ error: "Rule ID is required" }, { status: 400 })
    }

    // Verify the list belongs to the user
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

    // Verify the rule exists and is accessible (public OR belongs to the user)
    const [rule] = await db
      .select()
      .from(cursorRule)
      .where(
        and(
          eq(cursorRule.id, ruleId),
          or(
            eq(cursorRule.isPublic, true),
            eq(cursorRule.userId, session.user.id)
          )
        )
      )

    if (!rule) {
      return NextResponse.json({ error: "Rule not found or not accessible" }, { status: 404 })
    }

    // Check if rule is already in the list
    const [existingListRule] = await db
      .select()
      .from(listRule)
      .where(and(
        eq(listRule.listId, listId),
        eq(listRule.ruleId, ruleId)
      ))

    if (existingListRule) {
      return NextResponse.json({ error: "Rule is already in this list" }, { status: 409 })
    }

    // Add the rule to the list
    const [newListRule] = await db
      .insert(listRule)
      .values({
        id: nanoid(),
        listId,
        ruleId,
        createdAt: new Date(),
      })
      .returning()

    return NextResponse.json(newListRule, { status: 201 })
  } catch (error) {
    console.error("Error adding rule to list:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/lists/[listId]/rules/[ruleId] - Remove a rule from a list
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
    const { searchParams } = new URL(request.url)
    const ruleId = searchParams.get('ruleId')

    if (!ruleId) {
      return NextResponse.json({ error: "Rule ID is required" }, { status: 400 })
    }

    // Verify the list belongs to the user
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

    // Remove the rule from the list
    const result = await db
      .delete(listRule)
      .where(and(
        eq(listRule.listId, listId),
        eq(listRule.ruleId, ruleId)
      ))
      .returning()

    if (result.length === 0) {
      return NextResponse.json({ error: "Rule not found in list" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing rule from list:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
