"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useQueryState } from "nuqs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Copy, Download, Share2, ChevronDown, Save } from "lucide-react"
import { countTokens } from "gpt-tokenizer"
import { Header } from "@/components/header"
import { useSession } from "@/lib/auth-client"

export default function HomePage() {
  const { data: session } = useSession()
  
  // URL state - only for persistence
  const [urlTitle, setUrlTitle] = useQueryState("title", { 
    defaultValue: "",
    shallow: true,
    throttleMs: 500 // Increased throttle for less frequent updates
  })
  const [urlContent, setUrlContent] = useQueryState("content", {
    defaultValue: "",
    shallow: true,
    throttleMs: 500 // Increased throttle for less frequent updates
  })
  
  // Local state for immediate updates
  const [localTitle, setLocalTitle] = useState(urlTitle)
  const [localContent, setLocalContent] = useState(urlContent)
  
  const [isShared, setIsShared] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedRuleId, setSavedRuleId] = useState<string | null>(null)
  const [tokenCount, setTokenCount] = useState(0)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState("always")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const cursorPositionRef = useRef<number>(0)
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Sync URL state to local state on initial load or URL change
  useEffect(() => {
    setLocalTitle(urlTitle)
  }, [urlTitle])

  useEffect(() => {
    setLocalContent(urlContent)
  }, [urlContent])

    // Debounced URL update for title with sanitization
  const handleTitleChange = useCallback((value: string) => {
    // Replace spaces with hyphens and filter to only allow letters, numbers, and hyphens
    const sanitizedValue = value
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-zA-Z0-9-]/g, '') // Remove any characters that aren't letters, numbers, or hyphens
    
    setLocalTitle(sanitizedValue)
    
    // Clear existing timer
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current)
    }
    
    // Set new timer for URL update
    updateTimerRef.current = setTimeout(() => {
      setUrlTitle(sanitizedValue)
    }, 500)
  }, [setUrlTitle])

  // Handle content change with local state
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    const value = textarea.value
    cursorPositionRef.current = textarea.selectionStart
    setLocalContent(value)

    // Clear existing timer
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current)
    }

    // Set new timer for URL update
    updateTimerRef.current = setTimeout(() => {
      setUrlContent(value)
    }, 500)
  }, [setUrlContent])

  // Restore cursor position after content updates
  useEffect(() => {
    if (textareaRef.current && document.activeElement === textareaRef.current) {
      const position = cursorPositionRef.current
      textareaRef.current.setSelectionRange(position, position)
    }
  }, [localContent])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current)
      }
    }
  }, [])

  const ruleOptions = [
    {
      id: "always",
      label: "Always Apply",
      description: "Apply to every chat and cmd-k session",
      frontmatter: "---\nalwaysApply: true\n---\n",
    },
    {
      id: "intelligent",
      label: "Apply Intelligently",
      description: "When Agent decides it's relevant based on description",
      frontmatter: "---\ndescription: <apply intelligently>\nalwaysApply: false\n---\n",
    },
    {
      id: "specific",
      label: "Apply to Specific Files",
      description: "When file matches a specified pattern",
      frontmatter: "---\nglobs: *.tsx\nalwaysApply: false\n---\n",
    },
    {
      id: "manual",
      label: "Apply Manually",
      description: "When @-mentioned",
      frontmatter: "---\nalwaysApply: false\n---\n",
    },
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isDropdownOpen])

  useEffect(() => {
    if (localContent.trim()) {
      try {
        const tokens = countTokens(localContent)
        setTokenCount(tokens)
      } catch (error) {
        console.error("Error counting tokens:", error)
        setTokenCount(0)
      }
    } else {
      setTokenCount(0)
    }
  }, [localContent])

  const handleSave = async () => {
    if (!session || !localTitle.trim() || !localContent.trim()) return

    setIsSaving(true)
    try {
      const method = savedRuleId ? 'PUT' : 'POST'
      const body = {
        ...(savedRuleId && { id: savedRuleId }),
        title: localTitle,
        content: localContent,
        ruleType: selectedRule,
        isPublic: false
      }

      const response = await fetch('/api/cursor-rules', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) throw new Error('Failed to save')

      const rule = await response.json()
      setSavedRuleId(rule.id)
    } catch (error) {
      console.error('Error saving rule:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleShare = async () => {
    if (!session || !savedRuleId) return

    try {
      // Update rule to be public
      await fetch('/api/cursor-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: savedRuleId,
          title: localTitle,
          content: localContent,
          ruleType: selectedRule,
          isPublic: true
        })
      })

      // Copy public URL to clipboard
      const publicUrl = `${window.location.origin}/${session.user.id}/${savedRuleId}`
      await navigator.clipboard.writeText(publicUrl)
      
      setIsShared(true)
      setTimeout(() => setIsShared(false), 2000)
    } catch (error) {
      console.error('Error sharing rule:', error)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(localContent)
  }

  const handleDownload = () => {
    const blob = new Blob([localContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${localTitle || "cursor-rules"}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleRuleChange = (ruleId: string) => {
    const rule = ruleOptions.find((r) => r.id === ruleId)
    if (rule) {
      setSelectedRule(ruleId)

      let cleanContent = localContent
      const frontmatterRegex = /^---\n[\s\S]*?\n---\n/
      if (frontmatterRegex.test(localContent)) {
        cleanContent = localContent.replace(frontmatterRegex, "")
      }

      const newContent = rule.frontmatter + cleanContent
      setLocalContent(newContent)
      setUrlContent(newContent) // Update URL immediately for rule changes
    }
    setIsDropdownOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#16171A] text-white">
      {/* Main Content */}
      <main className="mx-auto max-w-4xl p-6">
        <Header />
        <div className="space-y-4">
          {/* Title Input with Dropdown */}
          <div className="space-y-3">
            <div className="flex items-end gap-3">
              <Input
                id="title"
                placeholder="index.mdc"
                value={localTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="h-auto py-0 bg-transparent border-0 border-b border-white/10 text-white placeholder:text-gray-500 focus:border-white/20 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-lg font-medium rounded-none px-0 flex-1"
              />

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-[#2A2D32] border border-white/10 rounded-md hover:bg-[#34373C] transition-colors"
                >
                  {ruleOptions.find((r) => r.id === selectedRule)?.label}
                  <ChevronDown className="h-3 w-3" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-80 bg-[#2A2D32] border border-white/10 rounded-md shadow-lg z-10">
                    {ruleOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleRuleChange(option.id)}
                        className={`w-full text-left px-3 py-2 hover:bg-[#34373C] transition-colors first:rounded-t-md last:rounded-b-md ${selectedRule === option.id ? "bg-[#34373C]" : ""
                          }`}
                      >
                        <div className="font-medium text-white text-xs">{option.label}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{option.description}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Editor */}
          <div className="space-y-3">
            <Card
              className="border-0 bg-[#1B1D21] p-0"
              style={{
                border: "1px solid rgba(255, 255, 255, 0.04)",
                boxShadow: "rgba(0, 0, 0, 0.06) 0px 18px 25.8px 0px",
              }}
            >
              <Textarea
                ref={textareaRef}
                id="content"
                placeholder={`# Cursor Rules

You are an expert in TypeScript, Node.js, Next.js App Router, React, Shadcn UI, Radix UI and Tailwind.

Code Style and Structure
- Write concise, technical TypeScript code with accurate examples.
- Use functional and declarative programming patterns; avoid classes.
- Prefer iteration and modularization over code duplication.
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError).
- Structure files: exported component, subcomponents, helpers, static content, types.

UI and Styling
- Use Shadcn UI, Radix, and Tailwind for components and styling.
- Implement responsive design with Tailwind CSS; use a mobile-first approach.`}
                value={localContent}
                onChange={handleContentChange}
                className="min-h-[500px] resize-none border-0 bg-[#1B1D21] text-white placeholder:text-gray-500 focus:ring-0 focus-visible:ring-0 leading-relaxed"
                style={{ fontSize: "14px" }}
              />
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-[0]">
            <div className="flex items-center gap-3">
              {session && (
                <button
                  onClick={savedRuleId ? handleShare : handleSave}
                  disabled={!localTitle.trim() || !localContent.trim() || isSaving}
                  className="group flex min-h-[32px] items-center justify-center gap-1 rounded-[6px] bg-[#70A7D7] px-2 py-1 text-[12px] font-semibold text-[#2A2A2A] outline-none transition-colors duration-200 hover:bg-[#90BAE0] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savedRuleId ? (
                    <>
                      <Share2 className="h-3 w-3" />
                      {isShared ? "Copied!" : "Share"}
                    </>
                  ) : (
                    <>
                      <Save className="h-3 w-3" />
                      {isSaving ? "Saving..." : "Save"}
                    </>
                  )}
                </button>
              )}

              <button
                onClick={handleCopy}
                disabled={!localContent.trim()}
                className="group flex min-h-[32px] items-center justify-center gap-1 rounded-[6px] bg-[#70A7D7] px-2 py-1 text-[12px] font-semibold text-[#2A2A2A] outline-none transition-colors duration-200 hover:bg-[#90BAE0] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Copy className="h-3 w-3" />
                Copy
              </button>

              <button
                onClick={handleDownload}
                disabled={!localContent.trim()}
                className="group flex min-h-[32px] items-center justify-center gap-1 rounded-[6px] bg-[#70A7D7] px-2 py-1 text-[12px] font-semibold text-[#2A2A2A] outline-none transition-colors duration-200 hover:bg-[#90BAE0] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-3 w-3" />
                Download
              </button>
            </div>
            <div className="text-sm text-gray-500">
              {localContent.length} characters • {tokenCount.toLocaleString()} tokens
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
