"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Star } from "lucide-react"
import { Card } from "@/components/ui/card"
import { CommentForm } from "./comment-form"
import { CommentItem } from "./comment-item"
import { StarRating } from "../rating/star-rating"
import { useSession } from "@/lib/auth-client"

interface DiscussionSectionProps {
  ruleId: string
}

interface Comment {
  id: string
  content: string
  parentId?: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    image?: string | null
  }
  replies?: Comment[]
}

interface RatingData {
  averageRating: number
  totalRatings: number
  userRating: number | null
}

export function DiscussionSection({ ruleId }: DiscussionSectionProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [ratingData, setRatingData] = useState<RatingData>({
    averageRating: 0,
    totalRatings: 0,
    userRating: null
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'rating' | 'discussion'>('rating')

  useEffect(() => {
    fetchComments()
    fetchRatings()
  }, [ruleId])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?ruleId=${ruleId}`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRatings = async () => {
    try {
      const response = await fetch(`/api/ratings?ruleId=${ruleId}`)
      if (response.ok) {
        const data = await response.json()
        setRatingData(data)
      }
    } catch (error) {
      console.error('Error fetching ratings:', error)
    }
  }

  const handleCommentAdded = (newComment: Comment) => {
    if (newComment.parentId) {
      // It's a reply, add it to the parent comment's replies
      setComments(prev => prev.map(comment => 
        comment.id === newComment.parentId
          ? { ...comment, replies: [...(comment.replies || []), newComment] }
          : comment
      ))
    } else {
      // It's a top-level comment
      setComments(prev => [newComment, ...prev])
    }
  }

  const handleCommentDeleted = (commentId: string) => {
    setComments(prev => {
      // Remove top-level comment or reply
      const filtered = prev.filter(comment => comment.id !== commentId)
      // Also remove from replies
      return filtered.map(comment => ({
        ...comment,
        replies: comment.replies?.filter(reply => reply.id !== commentId) || []
      }))
    })
  }

  const handleRatingChange = () => {
    // Refresh rating data after user rates
    fetchRatings()
  }

  const totalComments = comments.reduce((total, comment) => 
    total + 1 + (comment.replies?.length || 0), 0
  )

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center border-b border-white/10 overflow-x-auto">
        <button
          onClick={() => setActiveTab('rating')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'rating'
              ? 'text-white border-[#70A7D7]'
              : 'text-gray-400 border-transparent hover:text-white hover:border-white/20'
          }`}
        >
          <Star className="h-4 w-4" />
          <span className="hidden sm:inline">Rating</span>
          <span className="sm:hidden">Rate</span>
          {ratingData.totalRatings > 0 && (
            <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded-full">
              {ratingData.totalRatings}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('discussion')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'discussion'
              ? 'text-white border-[#70A7D7]'
              : 'text-gray-400 border-transparent hover:text-white hover:border-white/20'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Discussion</span>
          <span className="sm:hidden">Discuss</span>
          {totalComments > 0 && (
            <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded-full">
              {totalComments}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'rating' && (
        <Card
          className="border-0 bg-[#1B1D21] p-6"
          style={{
            border: "1px solid rgba(255, 255, 255, 0.04)",
            boxShadow: "rgba(0, 0, 0, 0.06) 0px 18px 25.8px 0px",
          }}
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Rate this rule</h3>
              <p className="text-sm text-gray-400 mb-4">
                Help others discover quality rules by sharing your rating
              </p>
            </div>
            
            <div className="space-y-3">
              {/* User Rating */}
              <div>
                <StarRating
                  ruleId={ruleId}
                  initialRating={ratingData.userRating || 0}
                  size="lg"
                  onRatingChange={handleRatingChange}
                />
              </div>
              
              {/* Average Rating Display */}
              {ratingData.totalRatings > 0 && (
                <div className="pt-3 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <StarRating
                      ruleId={ruleId}
                      averageRating={ratingData.averageRating}
                      totalRatings={ratingData.totalRatings}
                      readonly={true}
                      size="md"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'discussion' && (
        <div className="space-y-6">
          {/* Comment Form */}
          <Card
            className="border-0 bg-[#1B1D21] p-6"
            style={{
              border: "1px solid rgba(255, 255, 255, 0.04)",
              boxShadow: "rgba(0, 0, 0, 0.06) 0px 18px 25.8px 0px",
            }}
          >
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Join the discussion</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Share your thoughts, suggestions, or ask questions about this rule
                </p>
              </div>
              <CommentForm
                ruleId={ruleId}
                onCommentAdded={handleCommentAdded}
              />
            </div>
          </Card>

          {/* Comments List */}
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4 bg-[#1B1D21] border border-white/10">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-[#2A2D32] rounded-full animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="w-32 h-4 bg-[#2A2D32] rounded animate-pulse" />
                      <div className="w-full h-4 bg-[#2A2D32] rounded animate-pulse" />
                      <div className="w-3/4 h-4 bg-[#2A2D32] rounded animate-pulse" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <Card
              className="border-0 bg-[#1B1D21] p-8 text-center"
              style={{
                border: "1px solid rgba(255, 255, 255, 0.04)",
                boxShadow: "rgba(0, 0, 0, 0.06) 0px 18px 25.8px 0px",
              }}
            >
              <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No comments yet</h3>
              <p className="text-gray-400 text-sm">
                Be the first to share your thoughts about this rule!
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <Card
                  key={comment.id}
                  className="border-0 bg-[#1B1D21] p-4"
                  style={{
                    border: "1px solid rgba(255, 255, 255, 0.04)",
                    boxShadow: "rgba(0, 0, 0, 0.06) 0px 18px 25.8px 0px",
                  }}
                >
                  <CommentItem
                    comment={comment}
                    ruleId={ruleId}
                    onCommentDeleted={handleCommentDeleted}
                    onReplyAdded={handleCommentAdded}
                  />
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Helper function to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInMinutes < 1) {
    return 'just now'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`
  } else {
    return date.toLocaleDateString()
  }
}