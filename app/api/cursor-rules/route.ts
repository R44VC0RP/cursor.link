import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { cursorRule } from "@/lib/schema"
import { nanoid } from "nanoid"
import { eq } from "drizzle-orm"

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
