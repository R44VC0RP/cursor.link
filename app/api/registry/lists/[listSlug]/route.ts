import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { list, listRule, cursorRule, user } from "@/lib/schema"
import { eq, and } from "drizzle-orm"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listSlug: string }> }
) {
  try {
    const { listSlug } = await params
    
    // Extract list title and last 4 characters of list id from the slug
    // The format is: list-title + last 4 chars of id
    // We need to reverse-engineer this to find the list
    
    // Get all public lists and their rules to find matching slug
    const lists = await db
      .select({
        id: list.id,
        title: list.title,
        userId: list.userId,
      })
      .from(list)

    // Find the list that matches our slug format
    let matchingList = null
    for (const listData of lists) {
      const expectedSlug = listData.title.toLowerCase().replace(/[^a-z0-9]/g, '-') + listData.id.slice(-4)
      if (expectedSlug === listSlug) {
        matchingList = listData
        break
      }
    }

    if (!matchingList) {
      return NextResponse.json({ error: "List not found" }, { status: 404 })
    }

    // Get the rules in the list that are public
    const rules = await db
      .select({
        id: cursorRule.id,
        title: cursorRule.title,
        isPublic: cursorRule.isPublic,
      })
      .from(listRule)
      .leftJoin(cursorRule, eq(listRule.ruleId, cursorRule.id))
      .where(and(
        eq(listRule.listId, matchingList.id),
        eq(cursorRule.isPublic, true) // Only include public rules
      ))

    if (rules.length === 0) {
      return NextResponse.json({ error: "No public rules found in list" }, { status: 404 })
    }

    // Generate the registry dependencies URLs
    const registryDependencies = rules.map(rule => 
      `${request.nextUrl.origin}/api/registry/${rule.id}`
    )

    // Generate registry item in shadcn format
    const registryItem = {
      "name": matchingList.title,
      "type": "registry:item",
      "registryDependencies": registryDependencies
    }
    
    return NextResponse.json(registryItem, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300, s-maxage=300", // 5 minute cache
      },
    })
  } catch (error) {
    console.error("Error serving registry list:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
