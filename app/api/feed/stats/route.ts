import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { rating, comment } from "@/lib/schema"
import { eq, avg, count, sql } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ruleIds = searchParams.get("ruleIds")?.split(",") || []
    
    if (ruleIds.length === 0) {
      return NextResponse.json({})
    }

    // Get rating stats for all rules
    const ratingStats = await db
      .select({
        ruleId: rating.ruleId,
        averageRating: avg(rating.rating),
        totalRatings: count(rating.id),
      })
      .from(rating)
      .where(sql`${rating.ruleId} = ANY(${ruleIds})`)
      .groupBy(rating.ruleId)

    // Get comment counts for all rules
    const commentStats = await db
      .select({
        ruleId: comment.ruleId,
        totalComments: count(comment.id),
      })
      .from(comment)
      .where(sql`${comment.ruleId} = ANY(${ruleIds})`)
      .groupBy(comment.ruleId)

    // Combine the stats
    const stats: Record<string, {
      averageRating: number
      totalRatings: number
      totalComments: number
    }> = {}

    // Initialize all rule IDs with zero stats
    ruleIds.forEach(ruleId => {
      stats[ruleId] = {
        averageRating: 0,
        totalRatings: 0,
        totalComments: 0
      }
    })

    // Add rating stats
    ratingStats.forEach(stat => {
      if (stat.ruleId) {
        stats[stat.ruleId] = {
          ...stats[stat.ruleId],
          averageRating: Number(stat.averageRating) || 0,
          totalRatings: stat.totalRatings || 0,
        }
      }
    })

    // Add comment stats
    commentStats.forEach(stat => {
      if (stat.ruleId) {
        stats[stat.ruleId] = {
          ...stats[stat.ruleId],
          totalComments: stat.totalComments || 0,
        }
      }
    })

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching feed stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}