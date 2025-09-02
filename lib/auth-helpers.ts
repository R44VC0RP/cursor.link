import { auth } from "@/lib/auth"
import { NextRequest } from "next/server"

/**
 * Get session from request, supporting both Bearer tokens and cookies
 * This allows the API to work with both web sessions and CLI/device auth
 */
export async function getSessionFromRequest(request: NextRequest) {
  let session = null
  
  // Try Bearer token first (for CLI/device auth)
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    try {
      // Better-auth should validate the Bearer token
      // The device auth token should work as a session token
      session = await auth.api.getSession({
        headers: new Headers({
          ...Object.fromEntries(request.headers.entries()),
          'Authorization': `Bearer ${token}`
        })
      })
    } catch (error) {
      console.error('Bearer token validation failed:', error)
    }
  }
  
  // Fall back to cookie-based session
  if (!session) {
    try {
      session = await auth.api.getSession({
        headers: request.headers
      })
    } catch (error) {
      // Session not found is expected for unauthenticated requests
    }
  }
  
  return session
}

/**
 * Require authentication or throw
 */
export async function requireAuth(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}
