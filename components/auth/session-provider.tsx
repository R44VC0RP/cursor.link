"use client"

import { useSession } from "@/lib/auth-client"

interface SessionUser {
  id: string
  name: string
  email: string
  image?: string | null
}

interface SessionProviderProps {
  children: (session: { user: SessionUser } | null) => React.ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  const { data: session } = useSession()
  
  return <>{children(session)}</>
}
