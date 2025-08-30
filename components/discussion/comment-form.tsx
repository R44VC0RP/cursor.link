"use client"

import { useState } from "react"
import { useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { track } from "@vercel/analytics"

interface CommentFormProps {
  ruleId: string
  parentId?: string
  placeholder?: string
  onCommentAdded?: (comment: any) => void
  onCancel?: () => void
  compact?: boolean
}

export function CommentForm({ 
  ruleId, 
  parentId, 
  placeholder = "Share your thoughts...",
  onCommentAdded,
  onCancel,
  compact = false
}: CommentFormProps) {
  const { data: session } = useSession()
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!session) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm border border-white/10 rounded-lg bg-[#1B1D21]">
        Please sign in to join the discussion
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      toast.error("Please enter a comment")
      return
    }

    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ruleId,
          content: content.trim(),
          parentId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to post comment')
      }

      const newComment = await response.json()
      setContent("")
      onCommentAdded?.(newComment)
      track("Comment Posted", { ruleId, isReply: Boolean(parentId) })
      toast.success(parentId ? "Reply posted!" : "Comment posted!")
    } catch (error) {
      console.error('Error posting comment:', error)
      toast.error("Failed to post comment. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className={`
          bg-[#1B1D21] border-white/10 text-white resize-none
          focus:border-[#70A7D7] focus:ring-1 focus:ring-[#70A7D7]
          ${compact ? 'min-h-[80px]' : 'min-h-[120px]'}
        `}
        disabled={isSubmitting}
      />
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">
          {content.length}/1000 characters
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!content.trim() || isSubmitting || content.length > 1000}
          >
            {isSubmitting ? "Posting..." : (parentId ? "Reply" : "Comment")}
          </Button>
        </div>
      </div>
    </form>
  )
}