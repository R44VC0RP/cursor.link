"use client"

import { useSession } from "@/lib/auth-client"
import { MagicLinkForm } from "@/components/auth/magic-link-form"
import { Header } from "@/components/header"
import { redirect } from "next/navigation"
import { useState, useEffect } from "react"

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
                    className="p-4 bg-[#1B1D21] border border-white/10 rounded-lg hover:border-white/20 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/?title=${encodeURIComponent(rule.title)}&content=${encodeURIComponent(rule.content)}`}
                  >
                    <div className="flex items-start gap-3">
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
                  <button
                    onClick={() => window.location.href = '/'}
                    className="px-4 py-2 bg-[#70A7D7] text-[#2A2A2A] rounded-md text-sm font-medium hover:bg-[#90BAE0] transition-colors"
                  >
                    Create Rule
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
