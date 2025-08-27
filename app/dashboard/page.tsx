"use client"

import { useSession } from "@/lib/auth-client"
import { MagicLinkForm } from "@/components/auth/magic-link-form"
import { Header } from "@/components/header"
import { redirect } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { track } from "@vercel/analytics"

interface CursorRule {
  id: string
  title: string
  content: string
  ruleType: string
  isPublic: boolean
  views: number
  createdAt: string
  updatedAt: string
}

// Helper function to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)
  const diffInWeeks = Math.floor(diffInDays / 7)

  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`
  } else {
    return date.toLocaleDateString()
  }
}

// Helper function to truncate content for description
function truncateContent(content: string, maxLength: number = 120): string {
  // Remove frontmatter if present
  const cleanContent = content.replace(/^---\n[\s\S]*?\n---\n/, '')

  if (cleanContent.length <= maxLength) return cleanContent
  return cleanContent.substring(0, maxLength).trim() + '...'
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#16171A] text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-[35px] h-[35px] bg-[#1B1D21] rounded-lg animate-pulse"></div>
            <div className="w-32 h-8 bg-[#1B1D21] rounded animate-pulse"></div>
          </div>
          <div className="w-[35px] h-[35px] bg-[#1B1D21] rounded-lg animate-pulse"></div>
        </div>

        {/* Dashboard Title Skeleton */}
        <div className="mb-8">
          <div className="w-32 h-8 bg-[#1B1D21] rounded animate-pulse"></div>
        </div>

        {/* Rules Header Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="w-40 h-6 bg-[#1B1D21] rounded animate-pulse"></div>
          <div className="w-16 h-5 bg-[#1B1D21] rounded animate-pulse"></div>
        </div>

        {/* Rules List Skeleton */}
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="p-4 bg-[#1B1D21] border border-white/10 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-[18px] h-[18px] bg-[#2A2D32] rounded animate-pulse"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="w-48 h-5 bg-[#2A2D32] rounded animate-pulse mb-2"></div>
                  <div className="w-full h-4 bg-[#2A2D32] rounded animate-pulse mb-1"></div>
                  <div className="w-3/4 h-4 bg-[#2A2D32] rounded animate-pulse mb-3"></div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-3 bg-[#2A2D32] rounded animate-pulse"></div>
                    <div className="w-16 h-3 bg-[#2A2D32] rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: session, isPending } = useSession()
  const [rules, setRules] = useState<CursorRule[]>([])
  const [rulesLoading, setRulesLoading] = useState(true)
  const [actionStates, setActionStates] = useState<{[key: string]: boolean}>({})
  const [nameInput, setNameInput] = useState("")
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [isUpdatingName, setIsUpdatingName] = useState(false)

  // Helper function to show checkmark feedback
  const showActionFeedback = (actionKey: string) => {
    setActionStates(prev => ({ ...prev, [actionKey]: true }))
    setTimeout(() => {
      setActionStates(prev => ({ ...prev, [actionKey]: false }))
    }, 1500)
  }

  // Check if user needs to set their name
  const needsNameUpdate = (user: any) => {
    if (!user?.name) return true
    if (user.name === user.email) return true
    if (user.name.trim().length === 0) return true
    return false
  }

  // Handle name update
  const handleNameUpdate = async () => {
    if (!nameInput.trim() || !session?.user?.id) return

    setIsUpdatingName(true)
    try {
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.trim() })
      })

      if (!response.ok) throw new Error('Failed to update name')

      setShowNamePrompt(false)
      toast.success("Name updated successfully!")
      track("Profile Name Updated")
      
      // Refresh the session to get updated user data
      window.location.reload()
    } catch (error) {
      console.error('Error updating name:', error)
      toast.error("Failed to update name")
    } finally {
      setIsUpdatingName(false)
    }
  }

  // Checkmark icon component
  const CheckmarkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
      <g fill="#70A7D7">
        <path d="M9 1.5C4.86 1.5 1.5 4.86 1.5 9C1.5 13.14 4.86 16.5 9 16.5C13.14 16.5 16.5 13.14 16.5 9C16.5 4.86 13.14 1.5 9 1.5ZM7.5 12.75L3.75 9L5.16 7.59L7.5 9.93L12.84 4.59L14.25 6L7.5 12.75Z"/>
      </g>
    </svg>
  )

  // Handle copying shadcn install command
  const handleCopyInstallCommand = async (ruleId: string) => {
    const installCommand = `npx shadcn add ${window.location.origin}/api/registry/${ruleId}`
    await navigator.clipboard.writeText(installCommand)
    showActionFeedback(`cli-${ruleId}`)
    track("CLI Copied", { ruleId })
    toast.success("Install command copied to clipboard!", {
      description: "You can now paste it in your terminal to install the rule."
    })
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

  const handleCopyViewURL = async (rule: CursorRule) => {
    const slug = createSlug(rule.title, rule.id)
    const viewURL = `${window.location.origin}/rule/${slug}`
    await navigator.clipboard.writeText(viewURL)
    showActionFeedback(`link-${rule.id}`)
    track("View URL Copied", { ruleId: rule.id })
    toast.success("View URL copied to clipboard!", {
      description: "You can now paste it in your browser to view the rule."
    })
  }

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const response = await fetch('/api/cursor-rules', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ruleId })
      })

      if (!response.ok) throw new Error('Failed to delete rule')

      // Remove the rule from the local state
      setRules(prevRules => prevRules.filter(rule => rule.id !== ruleId))
      showActionFeedback(`delete-${ruleId}`)
      track("Rule Deleted", { ruleId })
      toast.success("Rule deleted successfully!")
    } catch (error) {
      console.error('Error deleting rule:', error)
      toast.error("Failed to delete rule")
    }
  }

  // Handle making rule public
  const handleMakePublic = async (rule: CursorRule) => {
    try {
      const response = await fetch('/api/cursor-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rule.id,
          title: rule.title,
          content: rule.content,
          ruleType: rule.ruleType,
          isPublic: true
        })
      })

      if (!response.ok) throw new Error('Failed to make rule public')

      const updatedRule = await response.json()

      // Update the rule in local state
      setRules(prevRules => 
        prevRules.map(r => 
          r.id === rule.id ? { ...r, isPublic: true } : r
        )
      )
      
      showActionFeedback(`public-${rule.id}`)
      track("Rule Made Public", { ruleId: rule.id })
      toast.success("Rule made public successfully!", {
        description: "You can now share the view URL and CLI install command."
      })
    } catch (error) {
      console.error('Error making rule public:', error)
      toast.error("Failed to make rule public")
    }
  }

  // Handle editing rule
  const handleEditRule = (rule: CursorRule) => {
    showActionFeedback(`edit-${rule.id}`)
    track("Rule Edit Triggered", { ruleId: rule.id })
    const params = new URLSearchParams({
      title: rule.title,
      content: rule.content,
      ruleType: rule.ruleType,
      isPublic: rule.isPublic.toString(),
      editId: rule.id
    })
    setTimeout(() => {
      window.location.href = `/?${params.toString()}`
    }, 100) // Small delay to show the checkmark
  }

  // Fetch user's rules
  useEffect(() => {
    const fetchRules = async () => {
      if (!session) return

      try {
        const response = await fetch('/api/my-rules')
        if (response.ok) {
          const rulesData = await response.json()
          setRules(rulesData)
        }
      } catch (error) {
        console.error('Error fetching rules:', error)
      } finally {
        setRulesLoading(false)
      }
    }

    if (session) {
      fetchRules()
    }
  }, [session])

  // Check if user needs to set their name
  useEffect(() => {
    if (session?.user && needsNameUpdate(session.user)) {
      setShowNamePrompt(true)
      setNameInput(session.user.name || "")
    }
  }, [session])

  // Show skeleton while loading
  if (isPending) {
    return <DashboardSkeleton />
  }

  // Redirect to login if no session
  if (!session) {
    return redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#16171A] text-white">
      <div className="max-w-4xl mx-auto p-6">
        <Header />
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
        </div>

        <div className="space-y-6">
          {/* Name prompt card */}
          {showNamePrompt && (
            <Card className="p-4 bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-white mb-1">Complete your profile</h3>
                    <p className="text-xs text-gray-400 mb-3">Add your name to personalize your experience</p>
                    <div className="flex items-center gap-3">
                      <Input
                        type="text"
                        placeholder="Enter your name"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="flex-1 bg-[#1B1D21] border-white/10 text-white text-sm h-8"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleNameUpdate()
                          }
                        }}
                      />
                      <Button
                        onClick={handleNameUpdate}
                        disabled={!nameInput.trim() || isUpdatingName}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 h-8"
                      >
                        {isUpdatingName ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowNamePrompt(false)}
                  className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
                  title="Dismiss"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </Card>
          )}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">Your Cursor Rules</h2>
            <div className="text-sm text-gray-400">
              {rulesLoading ? "Loading..." : `${rules.length} rule${rules.length !== 1 ? 's' : ''}`}
            </div>
          </div>

          {rulesLoading ? (
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="p-4 bg-[#1B1D21] border border-white/10 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-[18px] h-[18px] bg-[#2A2D32] rounded animate-pulse"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="w-48 h-5 bg-[#2A2D32] rounded animate-pulse mb-2"></div>
                      <div className="w-full h-4 bg-[#2A2D32] rounded animate-pulse mb-1"></div>
                      <div className="w-3/4 h-4 bg-[#2A2D32] rounded animate-pulse mb-3"></div>
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-3 bg-[#2A2D32] rounded animate-pulse"></div>
                        <div className="w-16 h-3 bg-[#2A2D32] rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-4 bg-[#1B1D21] border border-white/10 rounded-lg hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left side - Rule info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
                            <title>compose-3</title>
                            <g fill="#70A7D7">
                              <path d="M4.75 2C3.23079 2 2 3.23079 2 4.75V13.25C2 14.7692 3.23079 16 4.75 16H13.25C14.7692 16 16 14.7692 16 13.25V4.75C16 3.23079 14.7692 2 13.25 2H4.75Z" fillOpacity="0.4"></path>
                              <path d="M16.9203 2.10469C17.0492 1.86207 17.0351 1.56839 16.8836 1.33921C16.7321 1.11003 16.4674 0.982029 16.1937 1.00558C11.5935 1.40129 8.92498 3.89611 7.4184 6.37012C5.92835 8.817 5.56482 11.2509 5.50782 11.6418C5.44806 12.0517 5.73189 12.4324 6.14177 12.4922C6.55165 12.5519 6.93237 12.2681 6.99213 11.8582C7.01886 11.6749 7.13344 10.9067 7.4627 9.88243C7.66774 9.9158 7.87256 9.95107 8.0774 9.98635C8.4907 10.0575 8.90407 10.1287 9.31953 10.1844C10.5757 10.3525 11.9097 10.3279 13.0091 9.81425C13.5291 9.57128 13.9762 9.22841 14.3298 8.77989C13.2293 8.62136 12.2835 8.05888 11.85 7.70001C12.627 7.70001 13.4396 7.66594 14.154 7.45121C14.5836 7.32212 14.9751 7.12566 15.3021 6.84819C15.7633 6.45675 16.0878 5.89944 16.2221 5.3104C16.3331 4.82343 16.4123 4.32551 16.4827 3.88323C16.5104 3.70902 16.5367 3.54344 16.5631 3.39056C16.6634 2.80913 16.7659 2.39542 16.9203 2.10469Z"></path>
                            </g>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-white text-sm truncate">
                              {rule.title}
                            </h3>
                            {rule.isPublic && (
                              <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full flex-shrink-0">
                                Public
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                            {truncateContent(rule.content)}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Updated {formatRelativeTime(rule.updatedAt)}</span>
                            <span>{rule.views.toLocaleString()} views</span>
                            <span className="capitalize text-gray-600">{rule.ruleType}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right side - Action buttons */}
                      <div className="flex flex-col gap-2 flex-shrink-0 items-end">
                        {/* First row - Copy buttons for public rules, Make Public button for private rules */}
                        <div className="flex items-center gap-2">
                          {rule.isPublic ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCopyViewURL(rule)
                                }}
                                className="flex items-center justify-end gap-1.5 px-2 py-1 rounded-md hover:bg-white/10 transition-colors text-right"
                                title="Copy view URL"
                              >
                                {actionStates[`link-${rule.id}`] ? (
                                  <CheckmarkIcon />
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
                                    <title>link-4</title>
                                    <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" stroke="#70A7D7">
                                      <path d="M5.25101 5.5V7.25V12.5C5.25101 14.5711 6.92991 16.25 9.00101 16.25C11.0721 16.25 12.751 14.5711 12.751 12.5V7.25V5.5C12.751 3.4289 11.0721 1.75 9.00101 1.75C6.92991 1.75 5.25101 3.4289 5.25101 5.5Z" fill="#70A7D7" fillOpacity="0.3" data-stroke="none" stroke="none"></path>
                                      <path d="M5.25101 7.25V5.5C5.25101 3.4289 6.92991 1.75 9.00101 1.75C11.0721 1.75 12.751 3.4289 12.751 5.5V7.25"></path>
                                      <path d="M5.25101 10.75V12.5C5.25101 14.5711 6.92991 16.25 9.00101 16.25C11.0721 16.25 12.751 14.5711 12.751 12.5V10.75"></path>
                                      <path d="M9.00101 11.25V6.75"></path>
                                    </g>
                                  </svg>
                                )}
                                <span className="text-xs text-gray-400">Copy Link</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCopyInstallCommand(rule.id)
                                }}
                                className="flex items-center justify-end gap-1.5 px-2 py-1 rounded-md hover:bg-white/10 transition-colors text-right"
                                title="Copy install command"
                              >
                                {actionStates[`cli-${rule.id}`] ? (
                                  <CheckmarkIcon />
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
                                    <title>duplicate-plus-2</title>
                                    <g fill="#70A7D7">
                                      <path opacity="0.4" d="M10.75 1.5H4.25C2.73122 1.5 1.5 2.73122 1.5 4.25V10.75C1.5 12.2688 2.73122 13.5 4.25 13.5H10.75C12.2688 13.5 13.5 12.2688 13.5 10.75V4.25C13.5 2.73122 12.2688 1.5 10.75 1.5Z"></path>
                                      <path d="M13.5 4.25V10.75C13.5 12.2666 12.2666 13.5 10.75 13.5H4.9458L5.10019 14.5391C5.32309 16.0391 6.72429 17.0779 8.22449 16.855L14.6539 15.8999C16.154 15.677 17.1928 14.2756 16.9699 12.7756L16.0147 6.34619C15.8212 5.04399 14.739 4.09199 13.4756 4.00879C13.4827 4.08939 13.5 4.1675 13.5 4.25Z"></path>
                                      <path d="M7.5 4.5C7.9141 4.5 8.25 4.8359 8.25 5.25V9.75C8.25 10.1641 7.9141 10.5 7.5 10.5C7.0859 10.5 6.75 10.1641 6.75 9.75V5.25C6.75 4.8359 7.0859 4.5 7.5 4.5Z"></path>
                                      <path d="M5.25 6.75H9.75C10.1641 6.75 10.5 7.0859 10.5 7.5C10.5 7.9141 10.1641 8.25 9.75 8.25H5.25C4.8359 8.25 4.5 7.9141 4.5 7.5C4.5 7.0859 4.8359 6.75 5.25 6.75Z"></path>
                                    </g>
                                  </svg>
                                )}
                                <span className="text-xs text-gray-400">Copy CLI</span>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMakePublic(rule)
                              }}
                              className="flex items-center justify-end gap-1.5 px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-md transition-colors text-right"
                              title="Make rule public"
                            >
                              {actionStates[`public-${rule.id}`] ? (
                                <CheckmarkIcon />
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
                                  <title>earth</title>
                                  <g fill="#70A7D7">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M1 9C1 4.58169 4.58169 1 9 1C13.4183 1 17 4.58169 17 9C17 13.4183 13.4183 17 9 17C4.58169 17 1 13.4183 1 9Z" fillOpacity="0.4"></path>
                                    <path d="M13.532 3.592C13.369 3.719 13.159 3.776 12.955 3.743C11.841 3.568 11.045 3.663 10.774 4.002C10.554 4.276 10.605 4.832 10.65 5.322C10.712 6.001 10.789 6.845 10.083 7.295C9.45315 7.69491 8.80129 7.37513 8.32432 7.14115C7.89832 6.93215 7.49302 6.734 7.07502 6.85C6.54702 6.996 6.25702 7.539 6.20402 7.646C5.96002 8.141 6.05502 8.663 6.18202 9.022C7.46602 8.769 8.56002 8.90099 9.44102 9.41699C9.87183 9.66976 10.2155 10.0146 10.533 10.395C10.782 10.694 10.856 10.767 11.013 10.796C11.286 10.851 11.556 10.672 11.972 10.383C12.5457 9.9828 13.1622 9.6273 13.89 9.76499C14.66 9.91099 15.272 10.525 15.755 11.618C15.9357 11.9641 16.0588 12.2997 16.1308 12.6246C14.8065 15.2191 12.1072 17 9.00006 17C8.53528 17 8.07963 16.9602 7.63634 16.8837C7.75522 16.4639 7.87307 16.0473 7.87902 16.026C7.95202 15.77 8.09202 15.128 7.81302 14.71C7.71702 14.565 7.61302 14.506 7.38702 14.387C6.97464 14.1698 6.61767 13.9044 6.37302 13.498C6.10112 13.0467 6.05352 12.5651 6.08102 12.051C6.09602 11.788 6.10702 11.58 6.01302 11.318C5.88402 10.96 5.62902 10.719 5.33502 10.499C5.17436 10.3613 4.9866 10.2495 4.81402 10.127C3.72702 9.33299 2.84702 8.135 2.16502 6.601C1.98335 6.2386 1.8577 5.88887 1.78186 5.55215C3.07209 2.86207 5.82283 1 9.00006 1C11.0181 1 12.8641 1.75122 14.2731 2.98868L13.532 3.592Z"></path>
                                  </g>
                                </svg>
                              )}
                              <span className="text-xs text-gray-400">Make Public</span>
                            </button>
                          )}
                        </div>

                        {/* Second row - Edit button */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditRule(rule)
                            }}
                            className="flex items-center justify-end gap-1.5 px-2 py-1 rounded-md hover:bg-white/10 transition-colors text-right"
                            title="Edit rule"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
                              <title>file-pen</title>
                              <g fill="#70A7D7">
                                <path fillRule="evenodd" clipRule="evenodd" d="M8.76417 17C8.78227 16.8363 8.81853 16.6732 8.8736 16.5136L9.79447 13.8428C9.90579 13.5205 10.0889 13.2277 10.3303 12.9863L13.4927 9.82397C14.1676 9.15057 15.0937 8.84071 15.999 8.89668V6.66302C15.999 6.19602 15.817 5.75602 15.486 5.42602L11.572 1.51202C11.241 1.18102 10.802 0.999023 10.335 0.999023H4.75C3.233 0.999023 2 2.23202 2 3.74902V14.25C2 15.767 3.233 17 4.75 17H8.76417Z" fillOpacity="0.4"></path>
                                <path d="M17.3627 11.2217L17.0273 10.8863C16.3671 10.2247 15.2143 10.2252 14.5522 10.8858L11.391 14.0469C11.3104 14.1275 11.2494 14.2251 11.2123 14.3325L10.2914 17.0034C10.1976 17.2749 10.267 17.5757 10.4701 17.7783C10.6132 17.9214 10.8046 17.998 11.0004 17.998C11.0824 17.998 11.165 17.9848 11.245 17.957L13.9159 17.0361C14.0233 16.999 14.121 16.938 14.2015 16.8574L17.3626 13.6963C17.6932 13.3657 17.8753 12.9263 17.8753 12.459C17.8753 11.9912 17.6933 11.5518 17.3627 11.2217Z"></path>
                                <path d="M7.75 5.99902H5.75C5.336 5.99902 5 6.33502 5 6.74902C5 7.16302 5.336 7.49902 5.75 7.49902H7.75C8.164 7.49902 8.5 7.16302 8.5 6.74902C8.5 6.33502 8.164 5.99902 7.75 5.99902Z"></path>
                                <path d="M5.75 8.99902C5.336 8.99902 5 9.33502 5 9.74902C5 10.163 5.336 10.499 5.75 10.499H10.25C10.664 10.499 11 10.163 11 9.74902C11 9.33502 10.664 8.99902 10.25 8.99902H5.75Z"></path>
                                <path d="M15.8691 6.00095H12C11.45 6.00095 11 5.55095 11 5.00095V1.13098C11.212 1.21803 11.4068 1.34674 11.572 1.51197L15.487 5.42697C15.6527 5.59263 15.7818 5.78817 15.8691 6.00095Z"></path>
                              </g>
                            </svg>
                            <span className="text-xs text-gray-400">Edit</span>
                          </button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                }}
                                className="flex items-center justify-end gap-1.5 px-2 py-1 rounded-md hover:bg-red-500/10 transition-colors text-right group"
                                title="Delete rule"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
                                  <title>trash-2</title>
                                  <g fill="#EF4444" className="group-hover:fill-red-400">
                                    <path opacity="0.4" d="M3.40771 5L3.90253 14.3892C3.97873 15.8531 5.18472 17 6.64862 17H11.3527C12.8166 17 14.0226 15.853 14.0988 14.3896L14.5936 5H3.40771Z"></path>
                                    <path d="M7.37407 14.0001C6.98007 14.0001 6.64908 13.69 6.62608 13.2901L6.37608 8.7901C6.35408 8.3801 6.67008 8.02006 7.08308 8.00006C7.48908 7.98006 7.85107 8.29002 7.87407 8.71002L8.12407 13.21C8.14707 13.62 7.83007 13.9801 7.41707 14.0001H7.37407Z"></path>
                                    <path d="M10.6261 14.0001H10.5831C10.1701 13.9801 9.85408 13.62 9.87608 13.21L10.1261 8.71002C10.1491 8.29012 10.4981 7.98006 10.9171 8.00006C11.3301 8.02006 11.6471 8.3801 11.6241 8.7901L11.3741 13.2901C11.3521 13.69 11.0211 14.0001 10.6261 14.0001Z"></path>
                                    <path d="M15.25 4H12V2.75C12 1.7852 11.2148 1 10.25 1H7.75C6.7852 1 6 1.7852 6 2.75V4H2.75C2.3359 4 2 4.3359 2 4.75C2 5.1641 2.3359 5.5 2.75 5.5H15.25C15.6641 5.5 16 5.1641 16 4.75C16 4.3359 15.6641 4 15.25 4ZM7.5 2.75C7.5 2.6143 7.6143 2.5 7.75 2.5H10.25C10.3857 2.5 10.5 2.6143 10.5 2.75V4H7.5V2.75Z"></path>
                                  </g>
                                </svg>
                                <span className="text-xs text-red-500 group-hover:text-red-400">Delete</span>
                              </button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#1B1D21] border-white/10 text-white">
                              <DialogHeader>
                                <DialogTitle>Delete Cursor Rule</DialogTitle>
                                <DialogDescription className="text-gray-400">
                                  Are you sure you want to delete "{rule.title}"? This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter className="gap-2">
                                <DialogTrigger asChild>
                                  <Button variant="secondary" size="sm">
                                    Cancel
                                  </Button>
                                </DialogTrigger>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="primary" 
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    onClick={() => handleDeleteRule(rule.id)}
                                  >
                                    Delete
                                  </Button>
                                </DialogTrigger>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {rules.length === 0 && (
                <div className="text-center py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 18 18" className="mx-auto mb-4 opacity-30">
                    <title>compose-3</title>
                    <g fill="#70A7D7">
                      <path d="M4.75 2C3.23079 2 2 3.23079 2 4.75V13.25C2 14.7692 3.23079 16 4.75 16H13.25C14.7692 16 16 14.7692 16 13.25V4.75C16 3.23079 14.7692 2 13.25 2H4.75Z" fillOpacity="0.4"></path>
                      <path d="M16.9203 2.10469C17.0492 1.86207 17.0351 1.56839 16.8836 1.33921C16.7321 1.11003 16.4674 0.982029 16.1937 1.00558C11.5935 1.40129 8.92498 3.89611 7.4184 6.37012C5.92835 8.817 5.56482 11.2509 5.50782 11.6418C5.44806 12.0517 5.73189 12.4324 6.14177 12.4922C6.55165 12.5519 6.93237 12.2681 6.99213 11.8582C7.01886 11.6749 7.13344 10.9067 7.4627 9.88243C7.66774 9.9158 7.87256 9.95107 8.0774 9.98635C8.4907 10.0575 8.90407 10.1287 9.31953 10.1844C10.5757 10.3525 11.9097 10.3279 13.0091 9.81425C13.5291 9.57128 13.9762 9.22841 14.3298 8.77989C13.2293 8.62136 12.2835 8.05888 11.85 7.70001C12.627 7.70001 13.4396 7.66594 14.154 7.45121C14.5836 7.32212 14.9751 7.12566 15.3021 6.84819C15.7633 6.45675 16.0878 5.89944 16.2221 5.3104C16.3331 4.82343 16.4123 4.32551 16.4827 3.88323C16.5104 3.70902 16.5367 3.54344 16.5631 3.39056C16.6634 2.80913 16.7659 2.39542 16.9203 2.10469Z"></path>
                    </g>
                  </svg>
                  <h3 className="text-lg font-medium text-white mb-2">No cursor rules yet</h3>
                  <p className="text-gray-400 text-sm mb-4">Create your first cursor rule to get started.</p>
                  <Button
                    onClick={() => window.location.href = '/'}
                    variant="primary"
                    size="sm"
                    className="px-4 py-2"
                  >
                    Create Rule
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
