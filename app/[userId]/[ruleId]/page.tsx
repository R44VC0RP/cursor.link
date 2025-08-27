"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Copy, Eye, Download, Terminal, Share2 } from "lucide-react"
import { countTokens } from "gpt-tokenizer"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

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
    email: string
  }
}

function PublicRuleSkeleton() {
  return (
    <div className="min-h-screen bg-[#16171A] text-white">
      <main className="mx-auto max-w-4xl p-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-[35px] h-[35px] bg-[#1B1D21] rounded-lg animate-pulse"></div>
            <div className="w-32 h-8 bg-[#1B1D21] rounded animate-pulse"></div>
          </div>
          <div className="w-[35px] h-[35px] bg-[#1B1D21] rounded-lg animate-pulse"></div>
        </div>

        <div className="space-y-4">
          {/* Title skeleton */}
          <div className="w-64 h-6 bg-[#1B1D21] rounded animate-pulse"></div>
          
          {/* Content skeleton */}
          <Card className="border-0 bg-[#1B1D21] p-6">
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-4 bg-[#2A2D32] rounded animate-pulse ${
                    i === 7 ? "w-1/2" : "w-full"
                  }`}
                />
              ))}
            </div>
          </Card>

          {/* Stats skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-24 h-4 bg-[#1B1D21] rounded animate-pulse"></div>
              <div className="w-20 h-4 bg-[#1B1D21] rounded animate-pulse"></div>
            </div>
            <div className="w-32 h-4 bg-[#1B1D21] rounded animate-pulse"></div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function PublicRulePage() {
  const params = useParams()
  const [rule, setRule] = useState<CursorRule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [tokenCount, setTokenCount] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchRule = async () => {
      try {
        // Extract params values safely
        const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId
        const ruleId = Array.isArray(params.ruleId) ? params.ruleId[0] : params.ruleId
        
        const response = await fetch(`/api/public-rule/${userId}/${ruleId}`)
        
        if (!response.ok) {
          throw new Error('Rule not found')
        }

        const ruleData = await response.json()
        setRule(ruleData)
        
        // Count tokens
        if (ruleData.content.trim()) {
          try {
            const tokens = countTokens(ruleData.content)
            setTokenCount(tokens)
          } catch (error) {
            console.error("Error counting tokens:", error)
          }
        }
      } catch (err) {
        setError('Rule not found or not public')
      } finally {
        setLoading(false)
      }
    }

    if (params.userId && params.ruleId) {
      fetchRule()
    }
  }, [params.userId, params.ruleId])

  const handleCopy = async () => {
    if (!rule) return
    
    await navigator.clipboard.writeText(rule.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyViewURL = async () => {
    const currentUrl = window.location.href
    await navigator.clipboard.writeText(currentUrl)
    toast.success("View URL copied to clipboard!")
  }

  const handleInstallCopy = async () => {
    if (!rule) return
    
    const installCommand = `npx shadcn add ${window.location.origin}/api/registry/${rule.id}`
    await navigator.clipboard.writeText(installCommand)
    toast.success("Install command copied to clipboard!", {
      description: "You can now paste it in your terminal to install the rule."
    })
  }

  if (loading) {
    return <PublicRuleSkeleton />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#16171A] text-white">
        <main className="mx-auto max-w-4xl p-6">
          <Header />
          <div className="text-center py-12">
            <h1 className="text-2xl font-semibold mb-4">Rule Not Found</h1>
            <p className="text-gray-400">This cursor rule doesn't exist or isn't public.</p>
          </div>
        </main>
      </div>
    )
  }

  if (!rule) return null

  return (
    <div className="min-h-screen bg-[#16171A] text-white">
      <main className="mx-auto max-w-4xl p-6">
        <Header />
        
        <div className="space-y-4">
          {/* Title Input (Read-only) */}
          <div className="space-y-3">
            <Input
              value={rule.title}
              readOnly
              className="h-auto py-0 bg-transparent border-0 border-b border-white/10 text-white text-lg font-medium rounded-none px-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-white/10"
            />
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>by {rule.user.name}</span>
              <span>•</span>
              <span>{new Date(rule.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Content Editor (Read-only) */}
          <div className="space-y-3">
            <Card
              className="border-0 bg-[#1B1D21] p-0"
              style={{
                border: "1px solid rgba(255, 255, 255, 0.04)",
                boxShadow: "rgba(0, 0, 0, 0.06) 0px 18px 25.8px 0px",
              }}
            >
              <Textarea
                value={rule.content}
                readOnly
                className="min-h-[500px] resize-none border-0 bg-[#1B1D21] text-white leading-relaxed"
                style={{ fontSize: "14px" }}
              />
            </Card>
          </div>

          {/* Installation Instructions */}
          <Card
            className="border-0 bg-[#1B1D21] p-4"
            style={{
              border: "1px solid rgba(255, 255, 255, 0.04)",
              boxShadow: "rgba(0, 0, 0, 0.06) 0px 18px 25.8px 0px",
            }}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-[#70A7D7]" />
                <span className="text-sm font-semibold text-white">Install with shadcn CLI</span>
              </div>
              <div className="flex items-center gap-2 bg-[#0F1419] rounded-lg p-3 border border-white/5">
                <code className="flex-1 text-sm text-gray-300 font-mono">
                  npx shadcn add {window.location.origin}/api/registry/{rule.id}
                </code>
                <Button
                  onClick={handleInstallCopy}
                  variant="primary"
                  size="sm"
                  className="text-xs px-2 py-1 h-auto"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </Button>
              </div>
              <div className="text-xs text-gray-400">
                This will install the cursor rule to <code className="text-gray-300">~/.cursor/rules/{rule.title}.mdc</code>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-[0]">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleInstallCopy}
                variant="primary"
                size="sm"
              >
                <Copy className="h-3 w-3" />
                Copy CLI
              </Button>
              
              <Button
                onClick={handleCopyViewURL}
                variant="primary"
                size="sm"
              >
                <Share2 className="h-3 w-3" />
                Copy View URL
              </Button>
              
              <Button
                onClick={handleCopy}
                variant="secondary"
                size="sm"
              >
                <Copy className="h-3 w-3" />
                {copied ? "Copied!" : "Copy Text"}
              </Button>
              
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Eye className="h-3 w-3" />
                {rule.views.toLocaleString()} views
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {rule.content.length} characters • {tokenCount.toLocaleString()} tokens
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
