import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { cursorRule } from "@/lib/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    // Try Bearer token first (for CLI/device auth)
    const authHeader = request.headers.get('Authorization')
    let session = null
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      // Device auth tokens are valid session tokens in better-auth
      // We can get the session using the token
      try {
        session = await auth.api.getSession({
          headers: new Headers({
            ...Object.fromEntries(request.headers.entries()),
            'Authorization': `Bearer ${token}`
          })
        })
      } catch (error) {
        console.error('Bearer token validation failed:', error)
      }
    }
    
    // Fall back to cookie-based session if no Bearer token or it failed
    if (!session) {
      session = await auth.api.getSession({
        headers: request.headers
      })
    }

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rules = await db
      .select({
        id: cursorRule.id,
        title: cursorRule.title,
        content: cursorRule.content,
        type: cursorRule.type,
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
