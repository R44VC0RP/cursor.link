"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { useQueryState } from "nuqs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Copy, Download, Share2, ChevronDown, Save, User, ChevronUp, Image } from "lucide-react"
import { countTokens } from "gpt-tokenizer"
import { Header } from "@/components/header"
import { useSession } from "@/lib/auth-client"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { track } from "@vercel/analytics"

function HomePage() {
  const { data: session, isPending } = useSession()

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
  const [urlRuleType, setUrlRuleType] = useQueryState("ruleType", {
    defaultValue: "always",
    shallow: true
  })
  const [urlIsPublic, setUrlIsPublic] = useQueryState("isPublic", {
    defaultValue: "false",
    shallow: true
  })
  const [urlEditId, setUrlEditId] = useQueryState("editId", {
    defaultValue: "",
    shallow: true
  })

  // Local state for immediate updates
  const [localTitle, setLocalTitle] = useState(urlTitle)
  const [localContent, setLocalContent] = useState(urlContent)

  const [isShared, setIsShared] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedRuleId, setSavedRuleId] = useState<string | null>(urlEditId || null)
  const [isPublic, setIsPublic] = useState(urlIsPublic === "true")
  const [tokenCount, setTokenCount] = useState(0)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState(urlRuleType || "always")
  const [isSignInDialogOpen, setIsSignInDialogOpen] = useState(false)
  const [signInSuccess, setSignInSuccess] = useState(false)
  const [sentEmail, setSentEmail] = useState("")
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const [detectedSlugs, setDetectedSlugs] = useState<string[]>([])
  const [showSlugsList, setShowSlugsList] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const cursorPositionRef = useRef<number>(0)
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null)
  const autoDetectionAppliedRef = useRef<boolean>(false)

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

  // Sync URL state to local state on initial load or URL change
  useEffect(() => {
    setLocalTitle(urlTitle)
  }, [urlTitle])

  useEffect(() => {
    setLocalContent(urlContent)
    // Reset auto-detection flag when content changes from URL
    autoDetectionAppliedRef.current = false
  }, [urlContent])

  useEffect(() => {
    setSelectedRule(urlRuleType || "always")
  }, [urlRuleType])

  useEffect(() => {
    setSavedRuleId(urlEditId || null)
    const isRulePublic = urlIsPublic === "true"
    setIsPublic(isRulePublic)
    if (urlEditId && isRulePublic) {
      setIsShared(true)
    }
  }, [urlEditId, urlIsPublic])

  // Debounced URL update for title with sanitization
  const handleTitleChange = useCallback((value: string) => {
    // More restrictive sanitization - only allow letters, numbers, hyphens, and dots
    const sanitizedValue = value
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-zA-Z0-9.-]/g, '') // Remove any characters that aren't letters, numbers, hyphens, or dots
      .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
      .replace(/-{2,}/g, '-') // Replace multiple hyphens with single hyphen

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

    // Detect if this looks like a large cursor rule and auto-set to manual if needed
    // Only run auto-detection if it hasn't been applied already and this is user input
    if (value.length > 2000 && selectedRule === 'always' && !autoDetectionAppliedRef.current) {
      // Extract potential slugs from the content
      const slugMatches = value.match(/@[a-zA-Z0-9-_]+/g) || []
      const uniqueSlugs = Array.from(new Set(slugMatches)).slice(0, 10) // Limit to 10 slugs
      
      if (slugMatches.length > 3) {
        // Mark auto-detection as applied to prevent re-triggering
        autoDetectionAppliedRef.current = true
        
        setDetectedSlugs(uniqueSlugs)
        setShowSlugsList(true)
        setSelectedRule('manual')
        const rule = ruleOptions.find((r) => r.id === 'manual')
        if (rule) {
          let cleanContent = value
          const frontmatterRegex = /^---\n[\s\S]*?\n---\n/
          if (frontmatterRegex.test(value)) {
            cleanContent = value.replace(frontmatterRegex, "")
          }
          const newContent = rule.frontmatter + cleanContent
          setLocalContent(newContent)
          toast.info("Large rule detected! Set to 'Apply Manually' and found @-mentions", {
            description: `Found ${uniqueSlugs.length} potential slugs`
          })
        }
      }
    }

    // Clear existing timer
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current)
    }

    // Set new timer for URL update
    updateTimerRef.current = setTimeout(() => {
      setUrlContent(value)
    }, 500)
  }, [setUrlContent, selectedRule, ruleOptions])

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

  // Handle scroll detection for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
    track('Scroll to Top Clicked')
  }

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
      track("Rule Saved", {
        isUpdate: Boolean(savedRuleId),
        ruleType: selectedRule,
        titleLength: localTitle.length,
        contentLength: localContent.length,
      })

      // If this was a new rule (no existing savedRuleId), update URL to put user in edit mode
      if (!savedRuleId) {
        setUrlEditId(rule.id)
        toast.success("Rule saved! You're now in edit mode.")
      } else {
        toast.success("Rule updated!")
      }
    } catch (error) {
      console.error('Error saving rule:', error)
      toast.error("Failed to save rule")
    } finally {
      setIsSaving(false)
    }
  }

  const createSlug = (title: string, ruleId: string): string => {
    // Convert title to URL-friendly format
    const urlTitle = title
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, '') // Remove any characters that aren't letters, numbers, or hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens

    // Get last 3 characters of rule ID
    const last3 = ruleId.slice(-3)

    return `${urlTitle}-${last3}`
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

      // Create slug and copy public URL to clipboard
      const slug = createSlug(localTitle, savedRuleId)
      const publicUrl = `${window.location.origin}/rule/${slug}`
      await navigator.clipboard.writeText(publicUrl)
      track("Rule Shared", {
        ruleId: savedRuleId,
        ruleType: selectedRule,
        contentLength: localContent.length,
      })

      // Update local and URL state
      setIsShared(true)
      setIsPublic(true)
      setUrlIsPublic("true")

      toast.success("Rule shared!", {
        description: "Public URL copied to clipboard"
      })
    } catch (error) {
      console.error('Error sharing rule:', error)
      toast.error("Failed to share rule")
    }
  }

  const handleCopyCLI = async () => {
    if (!savedRuleId) {
      toast.error("Please save the rule first")
      return
    }

    const cliCommand = `npx shadcn add ${window.location.origin}/api/registry/${savedRuleId}`
    await navigator.clipboard.writeText(cliCommand)
    track("CLI Copied", { ruleId: savedRuleId })
    toast.success("CLI command copied to clipboard!", {
      description: "You can now paste it in your terminal to install the rule."
    })
  }

  const handleCopyViewURL = async () => {
    if (!session || !savedRuleId) {
      toast.error("Please save the rule first")
      return
    }

    const slug = createSlug(localTitle, savedRuleId)
    const publicUrl = `${window.location.origin}/rule/${slug}`
    await navigator.clipboard.writeText(publicUrl)
    track("View URL Copied", { ruleId: savedRuleId })
    toast.success("View URL copied to clipboard!")
  }

  const handleCopyPreviewImage = async () => {
    if (!session || !savedRuleId) {
      toast.error("Please save the rule first")
      return
    }

    try {
      const slug = createSlug(localTitle, savedRuleId)
      const imageUrl = `${window.location.origin}/rule/${slug}/opengraph-image`
      
      // Fetch the image
      const response = await fetch(imageUrl)
      if (!response.ok) throw new Error('Failed to fetch image')
      
      // Convert to blob
      const blob = await response.blob()
      
      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ])
      
      track("Preview Image Copied", { ruleId: savedRuleId })
      toast.success("Preview image copied to clipboard!")
    } catch (error) {
      console.error('Error copying image:', error)
      toast.error("Failed to copy preview image")
    }
  }

  const handleClone = () => {
    // Clear the editId to create a new rule with same content
    setUrlEditId("")
    setSavedRuleId(null)
    setIsShared(false)
    track("Rule Forked", { fromRuleId: savedRuleId ?? null })
    toast.success("Rule cloned! You can now modify and save as a new rule.")
  }

  const handleShareAnonLink = async () => {
    const currentUrl = window.location.href
    await navigator.clipboard.writeText(currentUrl)
    track("Anon Link Copied")
    toast.success("Anonymous link copied to clipboard!", {
      description: "Anyone can view this rule with this link"
    })
  }

  const handleMagicLinkSent = (email: string) => {
    setSentEmail(email)
    setSignInSuccess(true)
  }

  const handleResetForm = () => {
    setSignInSuccess(false)
    setSentEmail("")
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(localContent)
    track("Content Copied", { contentLength: localContent.length })
  }

  const handleDownload = () => {
    const blob = new Blob([localContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${localTitle || "cursor-rules"}.mdc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    track("Rule Downloaded", { contentLength: localContent.length })
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
      
      // Reset auto-detection flag when rule is manually changed
      autoDetectionAppliedRef.current = false
    }
    setIsDropdownOpen(false)
    track("Rule Type Changed", { ruleType: ruleId })
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#16171A] text-white">
        {/* Scroll to Top Button */}
        {showScrollToTop && (
          <button
            onClick={scrollToTop}
            className="fixed left-4 bottom-4 z-50 p-2 sm:p-3 bg-neutral-300/20 dark:bg-neutral-400/20 text-neutral-600 dark:text-neutral-300 backdrop-blur-[1px] border border-neutral-400/20 rounded-full shadow-lg"
          >
            <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        )}

        {/* Main Content */}
        <main className="mx-auto max-w-4xl p-4 sm:p-6">
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

            {/* Smart Slugs List */}
            {showSlugsList && detectedSlugs.length > 0 && (
              <Card className="border-0 bg-[#1B1D21] p-4" style={{
                border: "1px solid rgba(255, 255, 255, 0.04)",
              }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-white">Detected @-mentions</h3>
                  <button 
                    onClick={() => setShowSlugsList(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ×
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {detectedSlugs.map((slug, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-neutral-300/10 text-neutral-300 text-xs rounded border border-neutral-400/20 font-mono"
                    >
                      {slug}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Spacer for floating action bar */}
            <div className="h-20"></div>
          </div>
        </main>

        {/* Glassmorphic Floating Action Bar */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 max-w-[calc(100vw-2rem)]">
          <div className="bg-neutral-300/20 dark:bg-neutral-400/20 text-neutral-600 dark:text-neutral-300 backdrop-blur-[1px] border border-neutral-400/20 rounded-xl p-2 sm:p-3 shadow-2xl overflow-x-auto">
            <div className="flex items-center gap-2 sm:gap-3 min-w-max">
              {/* Primary Actions */}
              <Button
                onClick={handleDownload}
                disabled={!localContent.trim()}
                variant="primary"
                size="sm"
                className="hover:bg-[#70A7D7] px-2 py-2 sm:px-3 sm:py-1 aspect-square sm:aspect-auto"
              >
                <Download className="h-3 w-3" />
                <span className="hidden md:inline ml-1">Download</span>
              </Button>
              
              {isPending ? (
                <div className="h-8 w-8 sm:w-12 bg-gray-700/50 animate-pulse rounded-lg" />
              ) : session ? (
                <>
                  {!savedRuleId ? (
                    <Button
                      onClick={handleSave}
                      disabled={!localTitle.trim() || !localContent.trim() || isSaving}
                      variant="primary"
                      size="sm"
                      className="hover:bg-[#90BAE0] min-w-[32px] sm:min-w-[64px] px-2 py-2 sm:px-3 sm:py-1 aspect-square sm:aspect-auto"
                    >
                      <Save className="h-3 w-3" />
                      <span className="hidden md:inline ml-1">{isSaving ? "..." : "Save"}</span>
                    </Button>
                  ) : !isPublic ? (
                    <Button
                      onClick={handleShare}
                      disabled={!localTitle.trim() || !localContent.trim()}
                      variant="primary"
                      size="sm"
                      className="hover:bg-[#90BAE0] min-w-[32px] sm:min-w-[64px] px-2 py-2 sm:px-3 sm:py-1 aspect-square sm:aspect-auto"
                    >
                      <Share2 className="h-3 w-3" />
                      <span className="hidden md:inline ml-1">Share</span>
                    </Button>
                  ) : null}

                  {savedRuleId && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={isPublic ? handleCopyCLI : undefined}
                            disabled={!isPublic}
                            variant="primary"
                            size="sm"
                            className={`hover:bg-[#90BAE0] px-2 py-2 sm:px-3 sm:py-1 aspect-square sm:aspect-auto ${!isPublic ? "opacity-50" : ""}`}
                          >
                            <Copy className="h-3 w-3" />
                            <span className="hidden md:inline ml-1">CLI</span>
                          </Button>
                        </TooltipTrigger>
                        {!isPublic && (
                          <TooltipContent>
                            <p>Share first</p>
                          </TooltipContent>
                        )}
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={isPublic ? handleCopyViewURL : undefined}
                            disabled={!isPublic}
                            variant="primary"
                            size="sm"
                            className={`hover:bg-[#90BAE0] px-2 py-2 sm:px-3 sm:py-1 aspect-square sm:aspect-auto ${!isPublic ? "opacity-50" : ""}`}
                          >
                            <Share2 className="h-3 w-3" />
                            <span className="hidden md:inline ml-1">URL</span>
                          </Button>
                        </TooltipTrigger>
                        {!isPublic && (
                          <TooltipContent>
                            <p>Share first</p>
                          </TooltipContent>
                        )}
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={isPublic ? handleCopyPreviewImage : undefined}
                            disabled={!isPublic}
                            variant="primary"
                            size="sm"
                            className={`hover:bg-[#90BAE0] px-2 py-2 sm:px-3 sm:py-1 aspect-square sm:aspect-auto ${!isPublic ? "opacity-50" : ""}`}
                          >
                            <Image className="h-3 w-3" />
                            <span className="hidden md:inline ml-1">Image</span>
                          </Button>
                        </TooltipTrigger>
                        {!isPublic && (
                          <TooltipContent>
                            <p>Share first</p>
                          </TooltipContent>
                        )}
                      </Tooltip>

                      <Button
                        onClick={handleClone}
                        variant="secondary"
                        size="sm"
                        className="bg-transparent border-neutral-400/30 text-neutral-300 hover:text-neutral-300 hover:bg-transparent hover:border-neutral-400/30 px-2 py-2 sm:px-3 sm:py-1 aspect-square sm:aspect-auto"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 18 18">
                          <g fill="currentColor">
                            <path opacity="0.4" d="M15.942 2.46301C15.866 2.28001 15.72 2.13401 15.537 2.05701C15.445 2.01901 15.348 1.99902 15.25 1.99902H11C10.586 1.99902 10.25 2.33502 10.25 2.74902C10.25 3.16302 10.586 3.49902 11 3.49902H13.439L10.219 6.71899C9.92599 7.01199 9.92599 7.48703 10.219 7.78003C10.365 7.92603 10.557 8 10.749 8C10.941 8 11.133 7.92703 11.279 7.78003L14.499 4.56006V6.99902C14.499 7.41302 14.835 7.74902 15.249 7.74902C15.663 7.74902 15.999 7.41302 15.999 6.99902V2.75C15.999 2.652 15.98 2.55501 15.942 2.46301Z"></path>
                            <path d="M4.561 3.5H7C7.414 3.5 7.75 3.164 7.75 2.75C7.75 2.336 7.414 2 7 2H2.75C2.336 2 2 2.336 2 2.75V7C2 7.414 2.336 7.75 2.75 7.75C3.164 7.75 3.5 7.414 3.5 7V4.56104L7.884 8.94495C8.12 9.18095 8.25 9.49498 8.25 9.82898V16.25C8.25 16.664 8.586 17 9 17C9.414 17 9.75 16.664 9.75 16.25V9.82898C9.75 9.09398 9.464 8.40403 8.944 7.88403L4.561 3.5Z"></path>
                          </g>
                        </svg>
                        <span className="hidden md:inline ml-1">Fork</span>
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <Button
                  onClick={() => window.location.href = '/login'}
                  variant="primary"
                  size="sm"
                  className="hover:bg-[#90BAE0] px-2 py-2 sm:px-3 sm:py-1 aspect-square sm:aspect-auto"
                >
                  <User className="h-3 w-3" />
                  <span className="hidden lg:inline ml-1">Sign in to save</span>
                  <span className="hidden md:inline lg:hidden ml-1">Sign in</span>
                </Button>
              )}

              {/* Secondary Actions */}
              <div className="h-4 sm:h-6 w-px bg-neutral-400/30 mx-1"></div>
              
              {!savedRuleId && (
                <Button
                  onClick={handleShareAnonLink}
                  disabled={!localContent.trim()}
                  variant="secondary"
                  size="sm"
                  className="bg-transparent border-neutral-400/30 text-neutral-300 hover:text-neutral-300 hover:bg-transparent hover:border-neutral-400/30 px-2 py-2 sm:px-3 sm:py-1 aspect-square sm:aspect-auto"
                >
                  <Share2 className="h-3 w-3" />
                  <span className="hidden md:inline ml-1">Share</span>
                </Button>
              )}
              
              <div className="text-xs text-neutral-400 pl-1 sm:pl-2 flex-shrink-0">
                <div className="hidden sm:block">{localContent.length} chars</div>
                <div className="hidden sm:block">{tokenCount.toLocaleString()} tokens</div>
                <div className="sm:hidden">{Math.round(localContent.length/1000)}k</div>
              </div>
              
              {savedRuleId && (
                <span className={`px-1 sm:px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                  isPublic ? "bg-green-500/20 text-green-400" : "bg-neutral-500/20 text-neutral-400"
                }`}>
                  <span className="hidden sm:inline">{isPublic ? "Public" : "Private"}</span>
                  <span className="sm:hidden">{isPublic ? "Pub" : "Pri"}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#16171A] text-white flex items-center justify-center">Loading...</div>}>
      <HomePage />
    </Suspense>
  )
}
