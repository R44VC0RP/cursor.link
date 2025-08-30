"use client"

import { useState } from "react"
import { useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, MoreHorizontal, Trash2, Reply, Flag } from "lucide-react"
import { CommentForm } from "./comment-form"
import { toast } from "sonner"
import { track } from "@vercel/analytics"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface CommentItemProps {
  comment: {
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
    replies?: CommentItemProps['comment'][]
  }
  ruleId: string
  onCommentDeleted?: (commentId: string) => void
  onReplyAdded?: (reply: any) => void
  isReply?: boolean
}

export function CommentItem({ 
  comment, 
  ruleId, 
  onCommentDeleted, 
  onReplyAdded,
  isReply = false 
}: CommentItemProps) {
  const { data: session } = useSession()
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isReporting, setIsReporting] = useState(false)

  const isOwner = session?.user?.id === comment.user.id
  const timeAgo = formatRelativeTime(comment.createdAt)

  const handleDelete = async () => {
    if (!isOwner || isDeleting) return

    setIsDeleting(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId: comment.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete comment')
      }

      onCommentDeleted?.(comment.id)
      track("Comment Deleted", { commentId: comment.id, ruleId })
      toast.success("Comment deleted")
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error("Failed to delete comment")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleReplyAdded = (reply: any) => {
    setShowReplyForm(false)
    onReplyAdded?.(reply)
  }

  const handleReport = async (reason: string) => {
    if (!session || isReporting) return

    setIsReporting(true)
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId: comment.id,
          reason,
          description: `Reported comment: "${comment.content.substring(0, 100)}..."`
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to report comment')
      }

      track("Comment Reported", { commentId: comment.id, reason, ruleId })
      toast.success("Comment reported. Thank you for helping keep our community safe.")
    } catch (error) {
      console.error('Error reporting comment:', error)
      toast.error("Failed to report comment")
    } finally {
      setIsReporting(false)
    }
  }

  return (
    <div className={`space-y-3 ${isReply ? 'ml-4 sm:ml-8 pl-2 sm:pl-4 border-l border-white/10' : ''}`}>
      <div className="flex items-start gap-2 sm:gap-3">
        <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
          <AvatarImage src={comment.user.image || undefined} />
          <AvatarFallback className="bg-[#2A2D32] text-gray-300 text-xs">
            {comment.user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-white">
              {comment.user.name}
            </span>
            <span className="text-xs text-gray-500">
              {timeAgo}
            </span>
          </div>
          
          <div className="text-sm text-gray-200 leading-relaxed mb-3">
            {comment.content}
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            {!isReply && session && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="h-auto py-1 px-2 text-xs text-gray-400 hover:text-white hover:bg-white/5"
              >
                <Reply className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Reply</span>
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1 px-2 text-gray-400 hover:text-white hover:bg-white/5"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#1B1D21] border-white/10">
                {isOwner && (
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    {isDeleting ? "Deleting..." : "Delete"}
                  </DropdownMenuItem>
                )}
                
                {session && !isOwner && (
                  <>
                    {isOwner && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onClick={() => handleReport('inappropriate')}
                      disabled={isReporting}
                      className="text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer"
                    >
                      <Flag className="h-3 w-3 mr-2" />
                      {isReporting ? "Reporting..." : "Report"}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {showReplyForm && (
        <div className="ml-9 sm:ml-11">
          <CommentForm
            ruleId={ruleId}
            parentId={comment.id}
            placeholder="Write a reply..."
            onCommentAdded={handleReplyAdded}
            onCancel={() => setShowReplyForm(false)}
            compact={true}
          />
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              ruleId={ruleId}
              onCommentDeleted={onCommentDeleted}
              onReplyAdded={onReplyAdded}
              isReply={true}
            />
          ))}
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