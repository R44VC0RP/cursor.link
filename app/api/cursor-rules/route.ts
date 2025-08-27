import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { cursorRule } from "@/lib/schema"
import { nanoid } from "nanoid"
import { eq, or, and, desc } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ruleId = searchParams.get("ruleId")
    
    // Try to get session (but don't require it)
    const session = await auth.api.getSession({
      headers: request.headers
    }).catch(() => null)

    // Build where condition based on authentication and ruleId
    let whereCondition

    if (ruleId) {
      // Fetching specific rule
      if (session) {
        // Authenticated: can access their own rules (public or private) + public rules from others
        whereCondition = or(
          and(eq(cursorRule.id, ruleId), eq(cursorRule.userId, session.user.id)),
          and(eq(cursorRule.id, ruleId), eq(cursorRule.isPublic, true))
        )
      } else {
        // Unauthenticated: only public rules
        whereCondition = and(eq(cursorRule.id, ruleId), eq(cursorRule.isPublic, true))
      }
    } else {
      // Fetching multiple rules
      if (session) {
        // Authenticated: their own rules + public rules from others
        whereCondition = or(
          eq(cursorRule.userId, session.user.id),
          eq(cursorRule.isPublic, true)
        )
      } else {
        // Unauthenticated: only public rules
        whereCondition = eq(cursorRule.isPublic, true)
      }
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
      .where(whereCondition)
      .orderBy(desc(cursorRule.updatedAt))
      .limit(100)

    return NextResponse.json(rules)
  } catch (error) {
    console.error("Error fetching cursor rules:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, ruleType = "always", isPublic = false } = body

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    const id = nanoid()
    const now = new Date()

    const [newRule] = await db.insert(cursorRule).values({
      id,
      userId: session.user.id,
      title,
      content,
      ruleType,
      isPublic,
      views: 0,
      createdAt: now,
      updatedAt: now,
    }).returning()

    return NextResponse.json(newRule)
  } catch (error) {
    console.error("Error creating cursor rule:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, title, content, ruleType, isPublic } = body

    if (!id || !title || !content) {
      return NextResponse.json({ error: "ID, title and content are required" }, { status: 400 })
    }

    const [updatedRule] = await db.update(cursorRule)
      .set({
        title,
        content,
        ruleType,
        isPublic,
        updatedAt: new Date(),
      })
      .where(eq(cursorRule.id, id))
      .returning()

    if (!updatedRule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 })
    }

    return NextResponse.json(updatedRule)
  } catch (error) {
    console.error("Error updating cursor rule:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Rule ID is required" }, { status: 400 })
    }

    // Delete the rule (only if it belongs to the authenticated user)
    const deletedRule = await db
      .delete(cursorRule)
      .where(and(eq(cursorRule.id, id), eq(cursorRule.userId, session.user.id)))
      .returning()

    if (deletedRule.length === 0) {
      return NextResponse.json({ error: "Rule not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({ message: "Rule deleted successfully" })
  } catch (error) {
    console.error("Error deleting cursor rule:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
