import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cursorRule } from "@/lib/schema"
import { eq, and } from "drizzle-orm"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  try {
    const { ruleId } = await params
    
    // Fetch the rule from database
    const [rule] = await db
      .select({
        id: cursorRule.id,
        title: cursorRule.title,
        content: cursorRule.content,
        ruleType: cursorRule.ruleType,
      })
      .from(cursorRule)
      .where(
        and(
          eq(cursorRule.id, ruleId),
          eq(cursorRule.isPublic, true)
        )
      )

    if (!rule) {
      return NextResponse.json({ error: "Rule file not found" }, { status: 404 })
    }

    // Generate .mdc file content dynamically
    const mdcContent = `---
description: ${rule.title}
globs:
alwaysApply: ${rule.ruleType === 'always' ? 'true' : 'false'}
---

${rule.content}`
    
    return new NextResponse(mdcContent, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown",
        "Cache-Control": "public, max-age=300, s-maxage=300", // 5 minute cache
      },
    })
  } catch (error) {
    console.error("Error serving rule file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
