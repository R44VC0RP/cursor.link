"use client"

import { useState } from "react"
import { useSession, signOut } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LogOut, User } from "lucide-react"

export function UserNav() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            // Redirect to home page or refresh
            window.location.href = "/"
          },
        },
      })
    } catch (error) {
      console.error("Sign out error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!session) {
    return null
  }

  return (
    <div className="relative">
      <Card className="p-3 bg-[#2A2D32] border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#70A7D7] rounded-full flex items-center justify-center">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <User className="w-4 h-4 text-[#2A2A2A]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {session.user.name}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {session.user.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            disabled={isLoading}
            className="text-gray-400 hover:text-white hover:bg-white/10 p-1"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  )
}
