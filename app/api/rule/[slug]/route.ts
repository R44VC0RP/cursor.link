import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cursorRule, user } from "@/lib/schema"
import { eq, and, like } from "drizzle-orm"

function parseSlug(slug: string): { title: string; last3: string } | null {
  // Extract the last 3 characters after the last dash
  const lastDashIndex = slug.lastIndexOf('-')
  
  if (lastDashIndex === -1 || lastDashIndex === slug.length - 1) {
    return null
  }
  
  const last3 = slug.substring(lastDashIndex + 1)
  const title = slug.substring(0, lastDashIndex)
  
  // Validate that last3 is exactly 3 characters
  if (last3.length !== 3) {
    return null
  }
  
  return { title, last3 }
}

function createSlug(title: string, ruleId: string): string {
  // Convert title to URL-friendly format
  const urlTitle = title
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove any characters that aren't letters, numbers, or hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  
  // Get last 3 characters of rule ID
  const last3 = ruleId.slice(-3)
  
  return `${urlTitle}-${last3}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    const parsed = parseSlug(slug)
    if (!parsed) {
      return NextResponse.json({ error: "Invalid slug format" }, { status: 400 })
    }
    
    const { title, last3 } = parsed
    
    // Find rule by matching the title pattern and last 3 characters of ID
    // and ensure it's public
    const rules = await db
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
          eq(cursorRule.isPublic, true),
          like(cursorRule.id, `%${last3}`)
        )
      )

    // Filter rules to match the title pattern and exact ID suffix
    const matchingRule = rules.find(rule => {
      const ruleSlug = createSlug(rule.title, rule.id)
      return ruleSlug === slug && rule.id.endsWith(last3)
    })

    if (!matchingRule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 })
    }

    // Increment view count
    await db
      .update(cursorRule)
      .set({ views: matchingRule.views + 1 })
      .where(eq(cursorRule.id, matchingRule.id))

    return NextResponse.json({
      ...matchingRule,
      views: matchingRule.views + 1 // Return incremented view count
    })
  } catch (error) {
    console.error("Error fetching rule by slug:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

