"use client"

import { useState, useEffect } from "react"
import { Star } from "lucide-react"
import { useSession } from "@/lib/auth-client"
import { toast } from "sonner"
import { track } from "@vercel/analytics"

interface StarRatingProps {
  ruleId: string
  initialRating?: number
  totalRatings?: number
  averageRating?: number
  readonly?: boolean
  size?: "sm" | "md" | "lg"
  onRatingChange?: (rating: number) => void
}

export function StarRating({ 
  ruleId, 
  initialRating = 0, 
  totalRatings = 0,
  averageRating = 0,
  readonly = false, 
  size = "md",
  onRatingChange 
}: StarRatingProps) {
  const { data: session } = useSession()
  const [rating, setRating] = useState(initialRating)
  const [hoverRating, setHoverRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  }

  const handleRatingClick = async (newRating: number) => {
    if (readonly || !session) {
      if (!session) {
        toast.error("Please sign in to rate this rule")
      }
      return
    }

    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ruleId,
          rating: newRating,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit rating')
      }

      setRating(newRating)
      onRatingChange?.(newRating)
      track("Rating Submitted", { ruleId, rating: newRating })
      toast.success(`Rated ${newRating} star${newRating !== 1 ? 's' : ''}!`)
    } catch (error) {
      console.error('Error submitting rating:', error)
      toast.error("Failed to submit rating. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayRating = readonly ? averageRating : (hoverRating || rating)

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRatingClick(star)}
            onMouseEnter={() => !readonly && setHoverRating(star)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            disabled={readonly || isSubmitting}
            className={`
              transition-colors duration-150
              ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
              ${isSubmitting ? 'opacity-50' : ''}
            `}
          >
            <Star
              className={`
                ${sizeClasses[size]}
                transition-all duration-150
                ${star <= displayRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-transparent text-gray-400 hover:text-yellow-300'
                }
              `}
            />
          </button>
        ))}
      </div>
      
      {readonly && totalRatings > 0 && (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <span>{averageRating.toFixed(1)}</span>
          <span>•</span>
          <span>{totalRatings} rating{totalRatings !== 1 ? 's' : ''}</span>
        </div>
      )}
      
      {!readonly && session && (
        <div className="text-xs text-gray-400">
          {rating > 0 ? `You rated ${rating} star${rating !== 1 ? 's' : ''}` : 'Click to rate'}
        </div>
      )}
    </div>
  )
}