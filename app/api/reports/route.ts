import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { report } from "@/lib/schema"
import { nanoid } from "nanoid"
import { track } from "@vercel/analytics/server"

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { commentId, ruleId, reason, description } = body

    if (!reason || (!commentId && !ruleId)) {
      return NextResponse.json({ 
        error: "Reason and either commentId or ruleId are required" 
      }, { status: 400 })
    }

    const validReasons = ['spam', 'inappropriate', 'harassment', 'misinformation', 'other']
    if (!validReasons.includes(reason)) {
      return NextResponse.json({ 
        error: "Invalid reason" 
      }, { status: 400 })
    }

    const id = nanoid()
    const now = new Date()

    const [newReport] = await db.insert(report).values({
      id,
      reporterId: session.user.id,
      commentId: commentId || null,
      ruleId: ruleId || null,
      reason,
      description: description || null,
      status: "pending",
      createdAt: now,
    }).returning()

    await track('Content Reported', { 
      reportId: id,
      reason,
      hasComment: Boolean(commentId),
      hasRule: Boolean(ruleId)
    })
    
    return NextResponse.json(newReport)
  } catch (error) {
    console.error("Error creating report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}