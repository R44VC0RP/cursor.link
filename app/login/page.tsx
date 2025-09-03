"use client"

import { MagicLinkForm } from "@/components/auth/magic-link-form"
import { Header } from "@/components/header"
import { useSession } from "@/lib/auth-client"
import { redirect, useSearchParams } from "next/navigation"
import { useState } from "react"

function LoginSkeleton() {
  return (
    <div className="min-h-screen bg-[#16171A] text-white">
      <main className="mx-auto max-w-4xl p-4 sm:p-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-[35px] h-[35px] bg-[#1B1D21] rounded-lg animate-pulse"></div>
            <div className="w-32 h-8 bg-[#1B1D21] rounded animate-pulse"></div>
          </div>
          <div className="w-[35px] h-[35px] bg-[#1B1D21] rounded-lg animate-pulse"></div>
        </div>
        
        {/* Centered login form skeleton */}
        <div className="flex items-center justify-center mt-16">
          <div className="w-full max-w-md">
            <div className="bg-[#1B1D21] border border-white/10 rounded-lg p-6">
              {/* Title skeleton */}
              <div className="text-center mb-6">
                <div className="w-32 h-7 bg-[#2A2D32] rounded animate-pulse mx-auto mb-2"></div>
                <div className="w-48 h-4 bg-[#2A2D32] rounded animate-pulse mx-auto"></div>
              </div>
              
              {/* Form skeleton */}
              <div className="space-y-4">
                <div>
                  <div className="w-24 h-4 bg-[#2A2D32] rounded animate-pulse mb-2"></div>
                  <div className="w-full h-10 bg-[#2A2D32] rounded animate-pulse"></div>
                </div>
                <div className="w-full h-10 bg-[#70A7D7] opacity-50 rounded animate-pulse"></div>
              </div>
              
              {/* Footer skeleton */}
              <div className="mt-6 text-center">
                <div className="w-64 h-3 bg-[#2A2D32] rounded animate-pulse mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function LoginPage() {
  const { data: session, isPending } = useSession()
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [sentEmail, setSentEmail] = useState("")
  const searchParams = useSearchParams()
  const nextParam = searchParams?.get('next') || '/'

  // Show skeleton while loading
  if (isPending) {
    return <LoginSkeleton />
  }

  // Redirect to home if already logged in (but not if we just sent a magic link)
  if (session && !magicLinkSent) {
    return redirect(nextParam)
  }

  const handleMagicLinkSent = (email: string) => {
    setMagicLinkSent(true)
    setSentEmail(email)
  }

  const handleResetForm = () => {
    setMagicLinkSent(false)
    setSentEmail("")
  }

  return (
    <div className="min-h-screen bg-[#16171A] text-white">
      {/* Header matching home page */}
      <main className="mx-auto max-w-4xl p-4 sm:p-6">
        <Header />
        {/* Centered login form */}
        <div className="flex items-center justify-center mt-16">
          <div className="w-full max-w-md">
            <MagicLinkForm 
              isSuccess={magicLinkSent}
              sentEmail={sentEmail}
              onMagicLinkSent={handleMagicLinkSent}
              onResetForm={handleResetForm}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
