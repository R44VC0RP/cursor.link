"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Copy, Download, Share2, ChevronDown } from "lucide-react"
import { countTokens } from "gpt-tokenizer"

export default function HomePage() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isShared, setIsShared] = useState(false)
  const [tokenCount, setTokenCount] = useState(0)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState("always")
  const dropdownRef = useRef<HTMLDivElement>(null)

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
    if (content.trim()) {
      try {
        const tokens = countTokens(content)
        setTokenCount(tokens)
      } catch (error) {
        console.error("Error counting tokens:", error)
        setTokenCount(0)
      }
    } else {
      setTokenCount(0)
    }
  }, [content])

  const handleShare = () => {
    setIsShared(true)
    setTimeout(() => setIsShared(false), 2000)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
  }

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title || "cursor-rules"}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleRuleChange = (ruleId: string) => {
    const rule = ruleOptions.find((r) => r.id === ruleId)
    if (rule) {
      setSelectedRule(ruleId)

      let cleanContent = content
      const frontmatterRegex = /^---\n[\s\S]*?\n---\n/
      if (frontmatterRegex.test(content)) {
        cleanContent = content.replace(frontmatterRegex, "")
      }

      setContent(rule.frontmatter + cleanContent)
    }
    setIsDropdownOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#16171A] text-white">
      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-4">
          {/* Title Input with Dropdown */}
          <div className="space-y-3">
            <div className="flex items-end gap-3">
              <Input
                id="title"
                placeholder="untitled.cursorrules"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
                        className={`w-full text-left px-3 py-2 hover:bg-[#34373C] transition-colors first:rounded-t-md last:rounded-b-md ${
                          selectedRule === option.id ? "bg-[#34373C]" : ""
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
                id="content"
                placeholder="# Cursor Rules

You are an expert in TypeScript, Node.js, Next.js App Router, React, Shadcn UI, Radix UI and Tailwind.

Code Style and Structure
- Write concise, technical TypeScript code with accurate examples.
- Use functional and declarative programming patterns; avoid classes.
- Prefer iteration and modularization over code duplication.
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError).
- Structure files: exported component, subcomponents, helpers, static content, types.

Naming Conventions
- Use lowercase with dashes for directories (e.g., components/auth-wizard).
- Favor named exports for components.

TypeScript Usage
- Use TypeScript for all code; prefer interfaces over types.
- Avoid enums; use maps or objects with 'as const' assertion.
- Use functional components with TypeScript interfaces.

Syntax and Formatting
- Use the 'function' keyword for pure functions.
- Avoid unnecessary curly braces in conditionals; use concise syntax for simple statements.
- Use declarative JSX.

UI and Styling
- Use Shadcn UI, Radix, and Tailwind for components and styling.
- Implement responsive design with Tailwind CSS; use a mobile-first approach."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[600px] resize-none border-0 bg-[#1B1D21] text-white placeholder:text-gray-500 focus:ring-0 focus-visible:ring-0 leading-relaxed"
                style={{ fontSize: "14px" }}
              />
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-[0]">
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                disabled={!content.trim()}
                className="group flex min-h-[32px] items-center justify-center gap-1 rounded-[6px] bg-[#70A7D7] px-2 py-1 text-[12px] font-semibold text-[#2A2A2A] outline-none transition-colors duration-200 hover:bg-[#90BAE0] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Share2 className="h-3 w-3" />
                {isShared ? "Shared!" : "Share"}
              </button>

              <button
                onClick={handleCopy}
                disabled={!content.trim()}
                className="group flex min-h-[32px] items-center justify-center gap-1 rounded-[6px] bg-[#70A7D7] px-2 py-1 text-[12px] font-semibold text-[#2A2A2A] outline-none transition-colors duration-200 hover:bg-[#90BAE0] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Copy className="h-3 w-3" />
                Copy
              </button>

              <button
                onClick={handleDownload}
                disabled={!content.trim()}
                className="group flex min-h-[32px] items-center justify-center gap-1 rounded-[6px] bg-[#70A7D7] px-2 py-1 text-[12px] font-semibold text-[#2A2A2A] outline-none transition-colors duration-200 hover:bg-[#90BAE0] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-3 w-3" />
                Download
              </button>
            </div>
            <div className="text-sm text-gray-500">
              {content.length} characters • {tokenCount.toLocaleString()} tokens
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
