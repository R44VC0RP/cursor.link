"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { List, Plus, Trash2, Copy, Check, Download } from "lucide-react"
import { toast } from "sonner"
import { track } from "@vercel/analytics"

interface ListRule {
  id: string
  title: string
  content: string
  ruleType: string
  isPublic: boolean
  views: number
  createdAt: string
  updatedAt: string
  addedAt: string
  user: {
    name: string
  }
}

interface UserList {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  rules?: ListRule[]
}

interface UserListsProps {
  onListsChange?: () => void
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
function truncateContent(content: string, maxLength: number = 100): string {
  // Remove frontmatter if present
  const cleanContent = content.replace(/^---\n[\s\S]*?\n---\n/, '')
  if (cleanContent.length <= maxLength) return cleanContent
  return cleanContent.substring(0, maxLength).trim() + '...'
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

function createListSlug(title: string, listId: string): string {
  const urlTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const last4 = listId.slice(-4)
  return `${urlTitle}${last4}`
}

export function UserLists({ onListsChange }: UserListsProps) {
  const [lists, setLists] = useState<UserList[]>([])
  const [loading, setLoading] = useState(true)
  const [newListTitle, setNewListTitle] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [actionStates, setActionStates] = useState<{[key: string]: boolean}>({})

  // Helper function to show checkmark feedback
  const showActionFeedback = (actionKey: string) => {
    setActionStates(prev => ({ ...prev, [actionKey]: true }))
    setTimeout(() => {
      setActionStates(prev => ({ ...prev, [actionKey]: false }))
    }, 1500)
  }

  const fetchLists = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/lists')
      if (response.ok) {
        const data = await response.json()
        setLists(data)
        // Fetch rules for each list for always-expanded UI
        for (const l of data as UserList[]) {
          fetchListRules(l.id)
        }
      } else {
        console.error('Failed to fetch lists')
      }
    } catch (error) {
      console.error('Error fetching lists:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchListRules = async (listId: string) => {
    try {
      const response = await fetch(`/api/lists/${listId}`)
      if (response.ok) {
        const data = await response.json()
        setLists(prev => prev.map(list => 
          list.id === listId ? { ...list, rules: data.rules } : list
        ))
      }
    } catch (error) {
      console.error('Error fetching list rules:', error)
    }
  }

  // No expand/collapse — lists are always shown with their rules

  const handleCreateList = async () => {
    if (!newListTitle.trim()) {
      toast.error("Please enter a list name")
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newListTitle.trim() })
      })

      if (!response.ok) {
        throw new Error('Failed to create list')
      }

      const newList = await response.json()
      setLists(prev => [newList, ...prev])
      setNewListTitle("")
      toast.success(`Created list "${newListTitle}"!`)
      track("List Created", { listId: newList.id })
      onListsChange?.()
    } catch (error) {
      console.error('Error creating list:', error)
      toast.error('Failed to create list')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteList = async (listId: string) => {
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete list')
      }

      setLists(prev => prev.filter(list => list.id !== listId))
      showActionFeedback(`delete-${listId}`)
      toast.success("List deleted successfully!")
      track("List Deleted", { listId })
      onListsChange?.()
    } catch (error) {
      console.error('Error deleting list:', error)
      toast.error('Failed to delete list')
    }
  }

  const handleCopyListRegistryCommand = async (list: UserList) => {
    const slug = createListSlug(list.title, list.id)
    const installCommand = `npx shadcn add ${window.location.origin}/api/registry/lists/${slug}`
    await navigator.clipboard.writeText(installCommand)
    showActionFeedback(`registry-${list.id}`)
    track("List Registry Copied", { listId: list.id })
    toast.success("List registry command copied to clipboard!")
  }

  const handleCopyRuleContent = async (rule: ListRule) => {
    await navigator.clipboard.writeText(rule.content)
    showActionFeedback(`copy-${rule.id}`)
    track("List Rule Content Copied", { ruleId: rule.id })
    toast.success("Rule content copied to clipboard!")
  }

  const handleDownloadRule = (rule: ListRule) => {
    const blob = new Blob([rule.content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${rule.title}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showActionFeedback(`download-${rule.id}`)
    track("List Rule Downloaded", { ruleId: rule.id })
  }

  const handleCopyRuleLink = async (rule: ListRule) => {
    const slug = createRuleSlug(rule.title, rule.id)
    const viewURL = `${window.location.origin}/rule/${slug}`
    await navigator.clipboard.writeText(viewURL)
    showActionFeedback(`link-${rule.id}`)
    track("List Rule Link Copied", { ruleId: rule.id })
    toast.success("View URL copied to clipboard!", {
      description: "Paste in your browser to view the rule."
    })
  }

  const handleRemoveFromList = async (listId: string, ruleId: string) => {
    try {
      const response = await fetch(`/api/lists/${listId}/rules?ruleId=${ruleId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to remove rule from list')
      }

      // Update the list rules
      setLists(prev => prev.map(list => 
        list.id === listId && list.rules
          ? { ...list, rules: list.rules.filter(rule => rule.id !== ruleId) }
          : list
      ))
      
      showActionFeedback(`remove-${ruleId}`)
      toast.success("Rule removed from list!")
      track("Rule Removed From List", { listId, ruleId })
    } catch (error) {
      console.error('Error removing rule from list:', error)
      toast.error('Failed to remove rule from list')
    }
  }

  useEffect(() => {
    fetchLists()
  }, [])

  const CheckmarkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 18 18">
      <g fill="#70A7D7">
        <path d="M9 1.5C4.86 1.5 1.5 4.86 1.5 9C1.5 13.14 4.86 16.5 9 16.5C13.14 16.5 16.5 13.14 16.5 9C16.5 4.86 13.14 1.5 9 1.5ZM7.5 12.75L3.75 9L5.16 7.59L7.5 9.93L12.84 4.59L14.25 6L7.5 12.75Z"/>
      </g>
    </svg>
  )

  // Inline icon for list cards (provided SVG)
  const ListCardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
      <title>ballot-rect</title>
      <g fill="#70A7D7">
        <path opacity="0.4" d="M10.2501 6H15.2501C15.6641 6 16.0001 5.664 16.0001 5.25C16.0001 4.836 15.6641 4.5 15.2501 4.5H10.2501C9.83612 4.5 9.50012 4.836 9.50012 5.25C9.50012 5.664 9.83612 6 10.2501 6Z"></path>
        <path opacity="0.4" d="M15.2501 12H10.2501C9.83612 12 9.50012 12.336 9.50012 12.75C9.50012 13.164 9.83612 13.5 10.2501 13.5H15.2501C15.6641 13.5 16.0001 13.164 16.0001 12.75C16.0001 12.336 15.6641 12 15.2501 12Z"></path>
        <path d="M6.25012 2H3.75012C2.78362 2 2.00012 2.7835 2.00012 3.75V6.25C2.00012 7.2165 2.78362 8 3.75012 8H6.25012C7.21662 8 8.00012 7.2165 8.00012 6.25V3.75C8.00012 2.7835 7.21662 2 6.25012 2Z"></path>
        <path d="M6.25012 10H3.75012C2.78362 10 2.00012 10.7835 2.00012 11.75V14.25C2.00012 15.2165 2.78362 16 3.75012 16H6.25012C7.21662 16 8.00012 15.2165 8.00012 14.25V11.75C8.00012 10.7835 7.21662 10 6.25012 10Z"></path>
      </g>
    </svg>
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-white">Your Lists</h2>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-400">
            {loading ? "Loading..." : `${lists.length} list${lists.length !== 1 ? 's' : ''}`}
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create List
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1B1D21] border-white/10 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">Create New List</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Create a new list to organize your cursor rules
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Enter list name"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  className="bg-[#0F1419] border-white/10 text-white"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                />
              </div>
              <DialogFooter>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-white/10 bg-transparent hover:bg-white/5">
                    Cancel
                  </Button>
                </DialogTrigger>
                <Button
                  onClick={handleCreateList}
                  disabled={isCreating || !newListTitle.trim()}
                >
                  {isCreating ? "Creating..." : "Create List"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="p-3 bg-[#1B1D21] border border-white/10 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-[#2A2D32] rounded animate-pulse"></div>
                <div className="w-48 h-5 bg-[#2A2D32] rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-3">
            {lists.map((list) => {
              const ruleCount = list.rules?.length ?? 0

              return (
                <Card key={list.id} className="p-0 bg-[#1B1D21] border border-white/10 gap-0">
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <ListCardIcon />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white text-sm truncate">
                            {list.title}
                          </h3>
                        </div>
                        <div className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {ruleCount} rule{ruleCount !== 1 ? 's' : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 ml-3">
                        <button
                          onClick={() => handleCopyListRegistryCommand(list)}
                          className="p-1 rounded-md hover:bg-white/10 transition-colors"
                          title="Copy install command"
                        >
                          {actionStates[`registry-${list.id}`] ? (
                            <Check className="h-3 w-3 text-green-500" />
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
                        </button>

                        <Dialog>
                          <DialogTrigger asChild>
                            <button
                              className="p-1 rounded-md hover:bg-red-500/10 transition-colors group"
                              title="Delete list"
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
                            </button>
                          </DialogTrigger>
                          <DialogContent className="bg-[#1B1D21] border-white/10 text-white">
                            <DialogHeader>
                              <DialogTitle>Delete List</DialogTitle>
                              <DialogDescription className="text-gray-400">
                                Are you sure you want to delete "{list.title}"? This action cannot be undone.
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
                                  onClick={() => handleDeleteList(list.id)}
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

                  <div className="border-t border-white/10 rounded-b-lg overflow-hidden">
                      {list.rules?.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 text-sm">
                          No rules in this list yet
                        </div>
                      ) : list.rules ? (
                        <div className="py-1 divide-y divide-white/5">
                          {list.rules.map((rule, index) => (
                            <div
                              key={rule.id}
                              className={`px-3 py-1.5 hover:bg-white/5 transition-colors flex items-center justify-between gap-2`}
                            >
                              <div className="min-w-0 truncate">
                                {rule.isPublic ? (
                                  <button
                                    onClick={() => {
                                      const slug = createRuleSlug(rule.title, rule.id)
                                      window.open(`${window.location.origin}/rule/${slug}`, '_blank')
                                    }}
                                    className="text-[#70A7D7] hover:text-[#8BB8E8] transition-colors text-sm truncate text-left"
                                    title="View rule"
                                  >
                                    {rule.title}
                                  </button>
                                ) : (
                                  <span className="text-white text-sm">{rule.title}</span>
                                )}
                              </div>

                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => handleCopyRuleLink(rule)}
                                  className="p-1 rounded-md hover:bg-white/10 transition-colors"
                                  title="Copy view URL"
                                >
                                  {actionStates[`link-${rule.id}`] ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    // Same SVG as other Copy Link on dashboard
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
                                </button>

                                <button
                                  onClick={() => handleDownloadRule(rule)}
                                  className="p-1 rounded-md hover:bg-white/10 transition-colors"
                                  title="Download rule"
                                >
                                  {actionStates[`download-${rule.id}`] ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Download className="h-3 w-3 text-gray-400" />
                                  )}
                                </button>

                                <button
                                  onClick={() => handleRemoveFromList(list.id, rule.id)}
                                  className="p-1 rounded-md hover:bg-red-500/10 transition-colors group"
                                  title="Remove from list"
                                >
                                  {actionStates[`remove-${rule.id}`] ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Trash2 className="h-3 w-3 text-red-500 group-hover:text-red-400" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-gray-400 text-sm">
                          Loading rules...
                        </div>
                      )}
                  </div>
                </Card>
              )
            })}
          </div>

          {lists.length === 0 && (
            <div className="text-center py-8">
              <List className="h-12 w-12 mx-auto mb-4 text-gray-400 opacity-30" />
              <h3 className="text-lg font-medium text-white mb-2">No lists yet</h3>
              <p className="text-gray-400 text-sm mb-4">Create your first list to organize your cursor rules.</p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="primary" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First List
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1B1D21] border-white/10 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create New List</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Create a new list to organize your cursor rules
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Enter list name"
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      className="bg-[#0F1419] border-white/10 text-white"
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                    />
                  </div>
                  <DialogFooter>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-white/10 bg-transparent hover:bg-white/5">
                        Cancel
                      </Button>
                    </DialogTrigger>
                    <Button
                      onClick={handleCreateList}
                      disabled={isCreating || !newListTitle.trim()}
                    >
                      {isCreating ? "Creating..." : "Create List"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </>
      )}
    </div>
  )
}
