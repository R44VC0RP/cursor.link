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
        type: cursorRule.type,
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

    // Generate universal registry item with content
    const isCommand = rule.type === 'command';
    const directory = isCommand ? 'commands' : 'rules';
    const extension = isCommand ? 'md' : 'mdc';
    
    const registryItem = {
      "$schema": "https://ui.shadcn.com/schema/registry-item.json",
      "name": rule.title,
      "type": "registry:item", // Changed to registry:item for universal items
      "files": [
        {
          "path": `cursor.link/${directory}/${rule.title}.${extension}`, // Source path (not used but required)
          "type": "registry:file",
          "target": `~/.cursor/${directory}/${rule.title}.${extension}`, // Explicit target makes it universal
          "content": rule.content // Include the actual content
        }
      ]
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
