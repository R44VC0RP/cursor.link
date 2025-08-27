import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { list, listRule, cursorRule } from "@/lib/schema"
import { eq, desc, and } from "drizzle-orm"
import { nanoid } from "nanoid"

// GET /api/lists - Get user's lists
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const lists = await db
      .select({
        id: list.id,
        title: list.title,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
      })
      .from(list)
      .where(eq(list.userId, session.user.id))
      .orderBy(desc(list.updatedAt))

    return NextResponse.json(lists)
  } catch (error) {
    console.error("Error fetching user lists:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/lists - Create a new list
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title } = await request.json()

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const listId = nanoid()
    const now = new Date()

    const [newList] = await db
      .insert(list)
      .values({
        id: listId,
        userId: session.user.id,
        title: title.trim(),
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    return NextResponse.json(newList, { status: 201 })
  } catch (error) {
    console.error("Error creating list:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
