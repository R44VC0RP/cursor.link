"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"

interface MagicLinkFormProps {
  isSuccess?: boolean
  sentEmail?: string
  onMagicLinkSent?: (email: string) => void
  onResetForm?: () => void
}

export function MagicLinkForm({ 
  isSuccess = false, 
  sentEmail = "", 
  onMagicLinkSent, 
  onResetForm 
}: MagicLinkFormProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    setError("")

    try {
      const result = await authClient.signIn.magicLink({
        email,

      })

      if (result.error) {
        setError(result.error.message || "Something went wrong")
      } else {
        onMagicLinkSent?.(email)
      }
    } catch (err) {
      setError("Failed to send magic link. Please try again.")
      console.error("Magic link error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto p-8 bg-[#1B1D21] border-white/10">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center ring-4 ring-green-500/20">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Check your email</h2>
          <p className="text-gray-300 mb-6 text-base">
            We've sent a magic link to <br />
            <strong className="text-white">{sentEmail}</strong>
          </p>
          <div className="bg-[#2A2D32] rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400 leading-relaxed">
              Click the link in your email to sign in securely. The link will expire in <strong className="text-white">5 minutes</strong> for your security.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-500">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            <Button
              onClick={() => {
                onResetForm?.()
                setEmail("")
                setError("")
              }}
              variant="secondary"
              className="w-full"
            >
              Send another magic link
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto p-6 bg-[#1B1D21] border-white/10">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold text-white mb-2">Welcome back</h1>
        <p className="text-gray-400">Sign in to your account with a magic link</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
            Email address
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full bg-[#2A2D32] border-white/10 text-white placeholder:text-gray-500 focus:border-white/20"
            required
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading || !email.trim()}
          variant="primary"
          className="w-full"
        >
          {isLoading ? "Sending magic link..." : "Send magic link"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          By signing in, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </Card>
  )
}
