import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { rating, user } from "@/lib/schema"
import { nanoid } from "nanoid"
import { eq, and, avg, count } from "drizzle-orm"
import { track } from "@vercel/analytics/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ruleId = searchParams.get("ruleId")
    
    if (!ruleId) {
      return NextResponse.json({ error: "Rule ID is required" }, { status: 400 })
    }

    // Get average rating and count
    const ratingStats = await db
      .select({
        averageRating: avg(rating.rating),
        totalRatings: count(rating.id),
      })
      .from(rating)
      .where(eq(rating.ruleId, ruleId))

    // Get user's rating if authenticated
    let userRating = null
    try {
      const session = await auth.api.getSession({
        headers: request.headers
      })
      
      if (session) {
        const userRatingResult = await db
          .select({
            rating: rating.rating,
          })
          .from(rating)
          .where(and(
            eq(rating.ruleId, ruleId),
            eq(rating.userId, session.user.id)
          ))
          .limit(1)
        
        userRating = userRatingResult[0]?.rating || null
      }
    } catch (error) {
      // Continue without user rating if auth fails
    }

    return NextResponse.json({
      averageRating: ratingStats[0]?.averageRating ? Number(ratingStats[0].averageRating) : 0,
      totalRatings: ratingStats[0]?.totalRatings || 0,
      userRating,
    })
  } catch (error) {
    console.error("Error fetching ratings:", error)
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
    const { ruleId, rating: ratingValue } = body

    if (!ruleId || !ratingValue || ratingValue < 1 || ratingValue > 5) {
      return NextResponse.json({ 
        error: "Rule ID and rating (1-5) are required" 
      }, { status: 400 })
    }

    const id = nanoid()
    const now = new Date()

    // Check if user already rated this rule
    const existingRating = await db
      .select()
      .from(rating)
      .where(and(
        eq(rating.ruleId, ruleId),
        eq(rating.userId, session.user.id)
      ))
      .limit(1)

    let result
    if (existingRating.length > 0) {
      // Update existing rating
      [result] = await db
        .update(rating)
        .set({
          rating: ratingValue,
          updatedAt: now,
        })
        .where(and(
          eq(rating.ruleId, ruleId),
          eq(rating.userId, session.user.id)
        ))
        .returning()
    } else {
      // Create new rating
      [result] = await db.insert(rating).values({
        id,
        userId: session.user.id,
        ruleId,
        rating: ratingValue,
        createdAt: now,
        updatedAt: now,
      }).returning()
    }

    await track('Rating Submitted', { 
      ruleId, 
      rating: ratingValue, 
      isUpdate: existingRating.length > 0 
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error creating/updating rating:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}