"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"
import { track } from "@vercel/analytics"

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
    track("Magic link requested")

    try {
      const result = await authClient.signIn.magicLink({
        email,
      })

      if (result.error) {
        track("Magic link error")
        setError(result.error.message || "Something went wrong")
      } else {
        track("Magic link sent")
        onMagicLinkSent?.(email)
      }
    } catch (err) {
      track("Magic link error")
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
                track("Magic link reset")
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
    <Card className="w-full max-w-md mx-auto p-6 bg-[#1B1D21] border-white/10 gap-4">
      <div className="text-center ">
        <h1 className="text-2xl font-semibold text-white mb-2">Welcome back</h1>
        <p className="text-gray-400">Sign in to your account with a magic link</p>
      </div>

      {/* GitHub Sign In Button */}
      <div className="space-y-4">
        <Button
          onClick={async () => {
            track("Sign in with GitHub clicked")
            setIsLoading(true)
            setError("")
            try {
              await authClient.signIn.social({
                provider: "github",
                callbackURL: "/dashboard", // Redirect to dashboard after successful login
              })
            } catch (err) {
              setError("Failed to sign in with GitHub. Please try again.")
              console.error("GitHub sign in error:", err)
              setIsLoading(false)
            }
          }}
          disabled={isLoading}
          className="w-full bg-[#24292e] hover:bg-[#32383f] text-white border-0 flex items-center justify-center gap-2 py-3"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          {isLoading ? "Signing in..." : "Continue with GitHub"}
        </Button>
        
        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#1B1D21] px-2 text-gray-400">Or continue with email</span>
          </div>
        </div>
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
