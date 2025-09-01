import { createAuthClient } from "better-auth/react"
import { magicLinkClient, deviceAuthorizationClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://cursor.link",
  plugins: [magicLinkClient(), deviceAuthorizationClient()],
})

// Pre-hydrate session store from server-injected data to avoid flicker
if (typeof window !== "undefined") {
  const injected = (window as any).__BETTER_AUTH_SESSION__
  if (typeof injected !== "undefined") {
    const current = authClient.$store.atoms.session.get()
    authClient.$store.atoms.session.set({
      data: injected ?? null,
      error: null,
      isPending: false,
      isRefetching: false,
      refetch: current?.refetch,
    })
  }
}

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  magicLink,
} = authClient
