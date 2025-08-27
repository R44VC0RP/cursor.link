import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cursorRule, user } from "@/lib/schema"
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
        userId: cursorRule.userId,
        user: {
          name: user.name,
        }
      })
      .from(cursorRule)
      .leftJoin(user, eq(cursorRule.userId, user.id))
      .where(
        and(
          eq(cursorRule.id, ruleId),
          eq(cursorRule.isPublic, true)
        )
      )

    if (!rule) {
      return NextResponse.json({ error: "Registry item not found" }, { status: 404 })
    }

    // Generate registry item dynamically
    const registryItem = {
      "$schema": "https://ui.shadcn.com/schema/registry-item.json",
      "name": rule.id,
      "type": "registry:file",
      "title": rule.title,
      "description": `Cursor rule: ${rule.title}${rule.user?.name ? ` by ${rule.user.name}` : ''}`,
      "author": rule.user?.name || "cursor.link",
      "files": [
        {
          "path": `rules/${rule.id}.mdc`,
          "type": "registry:file", 
          "target": `~/.cursor/rules/${rule.id}.mdc`
        }
      ],
      "categories": ["cursor-rules"],
      "docs": `This rule will be installed to .cursor/rules/${rule.id}.mdc and will apply based on the rule configuration.`,
      "meta": {
        "ruleType": rule.ruleType,
        "source": "cursor.link"
      }
    }
    
    return NextResponse.json(registryItem, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300, s-maxage=300", // 5 minute cache
      },
    })
  } catch (error) {
    console.error("Error serving registry item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
