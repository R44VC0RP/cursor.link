import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { comment, user } from "@/lib/schema"
import { nanoid } from "nanoid"
import { eq, and, desc, isNull } from "drizzle-orm"
import { track } from "@vercel/analytics/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ruleId = searchParams.get("ruleId")
    
    if (!ruleId) {
      return NextResponse.json({ error: "Rule ID is required" }, { status: 400 })
    }

    // Get all comments for the rule with user information
    const comments = await db
      .select({
        id: comment.id,
        content: comment.content,
        parentId: comment.parentId,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        user: {
          id: user.id,
          name: user.name,
          image: user.image,
        },
      })
      .from(comment)
      .leftJoin(user, eq(comment.userId, user.id))
      .where(eq(comment.ruleId, ruleId))
      .orderBy(desc(comment.createdAt))

    // Organize comments into threads (parent comments with their replies)
    const parentComments = comments.filter(c => !c.parentId)
    const replies = comments.filter(c => c.parentId)
    
    const threaded = parentComments.map(parent => ({
      ...parent,
      replies: replies.filter(reply => reply.parentId === parent.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }))

    return NextResponse.json(threaded)
  } catch (error) {
    console.error("Error fetching comments:", error)
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
    const { ruleId, content, parentId } = body

    if (!ruleId || !content?.trim()) {
      return NextResponse.json({ 
        error: "Rule ID and content are required" 
      }, { status: 400 })
    }

    // Validate parentId if provided (ensure it exists and belongs to the same rule)
    if (parentId) {
      const parentComment = await db
        .select()
        .from(comment)
        .where(and(
          eq(comment.id, parentId),
          eq(comment.ruleId, ruleId)
        ))
        .limit(1)
      
      if (parentComment.length === 0) {
        return NextResponse.json({ 
          error: "Parent comment not found" 
        }, { status: 400 })
      }
    }

    const id = nanoid()
    const now = new Date()

    const [newComment] = await db.insert(comment).values({
      id,
      userId: session.user.id,
      ruleId,
      parentId: parentId || null,
      content: content.trim(),
      createdAt: now,
      updatedAt: now,
    }).returning()

    // Get the comment with user info for response
    const commentWithUser = await db
      .select({
        id: comment.id,
        content: comment.content,
        parentId: comment.parentId,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        user: {
          id: user.id,
          name: user.name,
          image: user.image,
        },
      })
      .from(comment)
      .leftJoin(user, eq(comment.userId, user.id))
      .where(eq(comment.id, id))
      .limit(1)

    await track('Comment Posted', { 
      ruleId, 
      commentId: id,
      isReply: Boolean(parentId)
    })
    
    return NextResponse.json(commentWithUser[0])
  } catch (error) {
    console.error("Error creating comment:", error)
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

    const { commentId } = await request.json()

    if (!commentId) {
      return NextResponse.json({ error: "Comment ID is required" }, { status: 400 })
    }

    // Delete the comment (only if it belongs to the authenticated user)
    const deletedComment = await db
      .delete(comment)
      .where(and(
        eq(comment.id, commentId), 
        eq(comment.userId, session.user.id)
      ))
      .returning()

    if (deletedComment.length === 0) {
      return NextResponse.json({ 
        error: "Comment not found or unauthorized" 
      }, { status: 404 })
    }

    await track('Comment Deleted', { commentId })
    return NextResponse.json({ message: "Comment deleted successfully" })
  } catch (error) {
    console.error("Error deleting comment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}