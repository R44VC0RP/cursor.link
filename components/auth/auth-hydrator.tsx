"use client"

import { useLayoutEffect } from "react"
import { authClient } from "@/lib/auth-client"

type AuthHydratorProps = {
  initialSession: any | null
}

export function AuthHydrator({ initialSession }: AuthHydratorProps) {
  useLayoutEffect(() => {
    try {
      const current = authClient.$store.atoms.session.get()
      authClient.$store.atoms.session.set({
        data: initialSession ?? null,
        error: null,
        isPending: false,
        isRefetching: false,
        refetch: current?.refetch,
      })
    } catch (e) {
      // noop
    }
  }, [initialSession])

  return null
}


