"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { generateWebPromptDeeplink, formatRuleAsPrompt, isPromptValidForDeeplink } from "@/lib/cursor-deeplink"
import { track } from "@vercel/analytics"
import { toast } from "sonner"
import { ExternalLink } from "lucide-react"

interface TryInCursorButtonProps {
  /** The rule title */
  title: string
  /** The rule content */
  content: string
  /** The rule ID for analytics tracking */
  ruleId: string
  /** Button variant */
  variant?: "default" | "secondary" | "ghost" | "outline"
  /** Button size */
  size?: "sm" | "default" | "lg"
  /** Additional CSS classes */
  className?: string
  /** Button text (defaults to "Try in Cursor") */
  children?: React.ReactNode
  /** Analytics context for tracking */
  analyticsContext?: string
}

export function TryInCursorButton({
  title,
  content,
  ruleId,
  variant = "default",
  size = "sm",
  className,
  children = "Try in Cursor",
  analyticsContext = "unknown"
}: TryInCursorButtonProps) {
  const [isClicked, setIsClicked] = useState(false)

  const handleClick = () => {
    try {
      const promptText = formatRuleAsPrompt(title, content)
      
      // Check if the prompt would fit in a deeplink URL
      if (!isPromptValidForDeeplink(promptText)) {
        toast.error("This rule is too long to share as a Cursor deeplink")
        return
      }

      const deeplink = generateWebPromptDeeplink(promptText)
      
      // Open the deeplink in a new window/tab
      window.open(deeplink, '_blank', 'noopener,noreferrer')
      
      // Show feedback
      setIsClicked(true)
      setTimeout(() => setIsClicked(false), 2000)
      
      // Track the event
      track("Try in Cursor Clicked", { 
        ruleId, 
        ruleTitle: title,
        context: analyticsContext,
        promptLength: promptText.length
      })
      
      toast.success("Opening in Cursor...")
    } catch (error) {
      console.error("Error generating Cursor deeplink:", error)
      toast.error("Failed to generate Cursor deeplink")
    }
  }

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={className}
      disabled={isClicked}
    >
      {isClicked ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 18 18">
            <g fill="currentColor">
              <path d="M9 1.5C4.86 1.5 1.5 4.86 1.5 9C1.5 13.14 4.86 16.5 9 16.5C13.14 16.5 16.5 13.14 16.5 9C16.5 4.86 13.14 1.5 9 1.5ZM7.5 12.75L3.75 9L5.16 7.59L7.5 9.93L12.84 4.59L14.25 6L7.5 12.75Z"/>
            </g>
          </svg>
          Opened!
        </>
      ) : (
        <>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15,3 21,3 21,9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          {children}
        </>
      )}
    </Button>
  )
}