"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Eye, Clock } from "lucide-react"
import { toast } from "sonner"
import { track } from "@vercel/analytics"
import { AddToListButton } from "@/components/lists/add-to-list-button"
import { useSession } from "@/lib/auth-client"
import Link from "next/link"

interface CursorRule {
  id: string
  title: string
  content: string
  ruleType: string
  views: number
  createdAt: string
  updatedAt: string
  user: {
    name: string
  }
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

// Helper: return only the first non-empty line of the content
function firstLine(content: string): string {
  // Remove frontmatter if present
  const cleanContent = content.replace(/^---\n[\s\S]*?\n---\n/, '')
  const lines = cleanContent.split(/\r?\n/)
  const line = lines.find(l => l.trim().length > 0) ?? ''
  return line.trim()
}

function createRuleSlug(title: string, ruleId: string): string {
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

function FeedSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="p-4 bg-[#1B1D21] border border-white/10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
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
                  <div className="w-20 h-3 bg-[#2A2D32] rounded animate-pulse"></div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-6 bg-[#2A2D32] rounded animate-pulse"></div>
              <div className="w-16 h-6 bg-[#2A2D32] rounded animate-pulse"></div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export default function FeedPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'hot' | 'new'>('hot')
  const [hotRules, setHotRules] = useState<CursorRule[]>([])
  const [newRules, setNewRules] = useState<CursorRule[]>([])
  const [loading, setLoading] = useState(true)
  const [actionStates, setActionStates] = useState<{[key: string]: boolean}>({})

  // Helper function to show checkmark feedback
  const showActionFeedback = (actionKey: string) => {
    setActionStates(prev => ({ ...prev, [actionKey]: true }))
    setTimeout(() => {
      setActionStates(prev => ({ ...prev, [actionKey]: false }))
    }, 1500)
  }

  // Checkmark icon component (same as dashboard)
  const CheckmarkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
      <g fill="#70A7D7">
        <path d="M9 1.5C4.86 1.5 1.5 4.86 1.5 9C1.5 13.14 4.86 16.5 9 16.5C13.14 16.5 16.5 13.14 16.5 9C16.5 4.86 13.14 1.5 9 1.5ZM7.5 12.75L3.75 9L5.16 7.59L7.5 9.93L12.84 4.59L14.25 6L7.5 12.75Z"/>
      </g>
    </svg>
  )

  useEffect(() => {
    const fetchRules = async () => {
      setLoading(true)
      try {
        // Fetch both hot and new rules in parallel
        const [hotResponse, newResponse] = await Promise.all([
          fetch('/api/feed/hot'),
          fetch('/api/feed/new')
        ])

        if (hotResponse.ok) {
          const hotData = await hotResponse.json()
          setHotRules(hotData)
        }

        if (newResponse.ok) {
          const newData = await newResponse.json()
          setNewRules(newData)
        }
      } catch (error) {
        console.error('Error fetching feed rules:', error)
        toast.error('Failed to load feed')
      } finally {
        setLoading(false)
      }
    }

    fetchRules()
  }, [])

  const handleCopyContent = async (rule: CursorRule) => {
    await navigator.clipboard.writeText(rule.content)
    showActionFeedback(`copy-${rule.id}`)
    track("Feed Rule Content Copied", { ruleId: rule.id, category: activeTab })
    toast.success("Rule content copied to clipboard!")
  }

  const handleDownload = (rule: CursorRule) => {
    const blob = new Blob([rule.content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${rule.title}.mdc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showActionFeedback(`download-${rule.id}`)
    track("Feed Rule Downloaded", { ruleId: rule.id, category: activeTab })
  }

  const handleCopyInstallCommand = async (ruleId: string) => {
    const installCommand = `npx shadcn add ${window.location.origin}/api/registry/${ruleId}`
    await navigator.clipboard.writeText(installCommand)
    showActionFeedback(`cli-${ruleId}`)
    track("Feed CLI Copied", { ruleId, category: activeTab })
    toast.success("Install command copied to clipboard!")
  }

  const currentRules = activeTab === 'hot' ? hotRules : newRules

  return (
    <div className="min-h-screen bg-[#16171A] text-white">
      <main className="mx-auto max-w-4xl p-6">
        <Header />
        
        <div className="space-y-6">
          {/* Page Title */}
          <div>
            <h1 className="text-2xl font-semibold text-white">Feed</h1>
            <p className="text-gray-400 text-sm mt-1">Discover popular and recently created cursor rules from the community</p>
          </div>

          {/* Tabs */}
          <div className="flex items-center border-b border-white/10">
            <button
              onClick={() => setActiveTab('hot')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'hot'
                  ? 'text-white border-[#70A7D7]'
                  : 'text-gray-400 border-transparent hover:text-white hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Hot
                {!loading && <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded-full">{hotRules.length}</span>}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'new'
                  ? 'text-white border-[#70A7D7]'
                  : 'text-gray-400 border-transparent hover:text-white hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                New
                {!loading && <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded-full">{newRules.length}</span>}
              </div>
            </button>
          </div>

          {/* Rules List */}
          {loading ? (
            <FeedSkeleton />
          ) : (
            <div className="grid gap-3">
              {currentRules.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 mx-auto mb-4 opacity-30">
                    {activeTab === 'hot' ? (
                      <Eye className="w-full h-full text-gray-400" />
                    ) : (
                      <Clock className="w-full h-full text-gray-400" />
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    No {activeTab} rules yet
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {activeTab === 'hot' 
                      ? 'Be the first to create a popular rule!' 
                      : 'Check back later for new rules from the community.'
                    }
                  </p>
                  <Link 
                    href="/"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#70A7D7] hover:bg-[#8BB8E8] transition-colors rounded-md"
                  >
                    Create a Rule
                  </Link>
                </div>
              ) : (
                currentRules.map((rule, index) => (
                  <Card key={rule.id} className="p-4 bg-[#1B1D21] border border-white/10 hover:border-white/20 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      {/* Left side - Rule info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 mt-1">
                          <div className="flex items-center justify-center w-8 h-8 bg-[#2A2D32] rounded-lg text-xs font-medium text-gray-400">
                            #{index + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Link href={`/rule/${createRuleSlug(rule.title, rule.id)}`}>
                              <h3 className="font-medium text-white text-sm hover:text-[#70A7D7] transition-colors cursor-pointer line-clamp-2">
                                {rule.title}
                              </h3>
                            </Link>
                          </div>
                          <p className="text-xs text-gray-400 mb-1 line-clamp-2">
                            {firstLine(rule.content)}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>by {rule.user?.name || 'Anonymous'}</span>
                            <span>{formatRelativeTime(rule.createdAt)}</span>
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {rule.views.toLocaleString()} views
                            </div>
                            <span className="capitalize text-gray-600">{rule.ruleType}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right side - Action buttons */}
                      <div className="flex flex-col gap-2 flex-shrink-0 items-end">
                        {/* First row - Copy buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopyContent(rule)
                            }}
                            className="flex items-center justify-end gap-1.5 px-2 py-1 rounded-md hover:bg-white/10 transition-colors text-right"
                            title="Copy rule content"
                          >
                            {actionStates[`copy-${rule.id}`] ? (
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
                            <span className="text-xs text-gray-400">Copy Text</span>
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
                        </div>

                        {/* Second row - Download and Add to List */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownload(rule)
                            }}
                            className="flex items-center justify-end gap-1.5 px-2 py-1 rounded-md hover:bg-white/10 transition-colors text-right"
                            title="Download rule"
                          >
                            {actionStates[`download-${rule.id}`] ? (
                              <CheckmarkIcon />
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#70A7D7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7,10 12,15 17,10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                              </svg>
                            )}
                            <span className="text-xs text-gray-400">Download</span>
                          </button>
                          
                          {/* Add to List button - only show if user is authenticated */}
                          {session?.user && (
                            <AddToListButton
                              ruleId={rule.id}
                              ruleTitle={rule.title}
                              variant="feed"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
