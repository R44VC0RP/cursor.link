"use client"

import { useState, useRef, useEffect } from "react"
import { useSession, signOut } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import Link from "next/link"

// Generate a consistent color based on email
function generateAvatarColors(email: string) {
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Generate two complementary colors
  const hue1 = Math.abs(hash) % 360
  const hue2 = (hue1 + 180) % 360

  return {
    primary: `hsl(${hue1}, 65%, 55%)`,
    secondary: `hsl(${hue2}, 65%, 75%)`
  }
}

// Skeleton loader component
function UserAvatarSkeleton() {
  return (
    <div className="w-[35px] h-[35px] bg-gray-700/50 animate-pulse rounded-lg" />
  )
}

export function UserAvatar() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [rulesCount, setRulesCount] = useState(0)
  const [totalViews, setTotalViews] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside - always call this hook
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showMenu])

  // Fetch user stats when session is available - always call this hook
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!session) return

      try {
        const response = await fetch('/api/my-rules')
        if (response.ok) {
          const rules = await response.json()
          setRulesCount(rules.length)

          // Calculate total views
          const totalViews = rules.reduce((sum: number, rule: any) => sum + rule.views, 0)
          setTotalViews(totalViews)
        }
      } catch (error) {
        console.error('Error fetching user stats:', error)
      }
    }

    if (session && showMenu) {
      fetchUserStats()
    }
  }, [session, showMenu])

  // Show skeleton while loading
  if (isPending) {
    return <UserAvatarSkeleton />
  }

  if (!session) {
    // Show fingerprint icon when not signed in
    return (
      <button
        onClick={() => router.push('/login')}
        className="w-[35px] h-[35px] transition-transform duration-200 hover:scale-105 relative flex items-center justify-center"
        title="Sign in"
      >
        <svg className="block" xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 35 35" fill="none">
          <g clipPath="url(#clip0_572_477)">
            <mask id="mask0_572_477" style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="0" y="0" width="35" height="35">
              <path d="M34.5371 0.721191H0.537109V34.7212H34.5371V0.721191Z" fill="white" />
            </mask>
            <g mask="url(#mask0_572_477)">
              <path d="M34.5371 0.721191H0.537109V34.7212H34.5371V0.721191Z" fill="#70A7D7" />
              <g style={{ mixBlendMode: "screen" }} opacity="0.6" filter="url(#filter0_572_477)">
                <path d="M68.7587 18.1098L36.3035 55.4453L27.8356 48.0843L31.4059 16.7693L31.1492 16.5462L14.1075 36.1506L4.02303 27.3843L36.4783 -9.95117L45.0744 -2.47866L41.3435 28.6066L41.6514 28.8742L58.6486 9.32122L68.7587 18.1098Z" fill="white" />
              </g>
              <g style={{ mixBlendMode: "screen" }} opacity="0.6" filter="url(#filter1_f_572_477)">
                <path d="M44.7925 26.5398L48.5137 36.7637L8.09749 51.474L4.37631 41.2501L18.3702 36.1567L5.1484 -0.1699L17.6087 -4.70509L30.8422 31.6535L44.7925 26.5398Z" fill="#70A7D7" />
              </g>
            </g>
          </g>
          <defs>
            <filter id="filter0_572_477" x="-27.9771" y="-41.9512" width="128.736" height="129.396" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="16" result="effect1_foregroundBlur_572_477" />
            </filter>
            <filter id="filter1_f_572_477" x="-27.6238" y="-36.7051" width="108.137" height="120.179" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="16" result="effect1_foregroundBlur_572_477" />
            </filter>
            <clipPath id="clip0_572_477">
              <rect x="0.537109" y="0.721191" width="34" height="34" rx="6" fill="white" />
            </clipPath>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-semibold text-sm leading-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><title>open-rect-arrow-in</title><g fill="#16171A"><path opacity="0.4" d="M13.25 2H9.75C9.336 2 9 2.336 9 2.75C9 3.164 9.336 3.5 9.75 3.5H13.25C13.939 3.5 14.5 4.061 14.5 4.75V13.25C14.5 13.939 13.939 14.5 13.25 14.5H9.75C9.336 14.5 9 14.836 9 15.25C9 15.664 9.336 16 9.75 16H13.25C14.767 16 16 14.767 16 13.25V4.75C16 3.233 14.767 2 13.25 2Z"></path> <path d="M10.78 8.46999L7.28 4.96999C6.987 4.67699 6.51199 4.67699 6.21899 4.96999C5.92599 5.26299 5.92599 5.73803 6.21899 6.03103L8.439 8.251H2.75C2.336 8.251 2 8.587 2 9.001C2 9.415 2.336 9.751 2.75 9.751H8.439L6.21899 11.971C5.92599 12.264 5.92599 12.739 6.21899 13.032C6.36499 13.178 6.55699 13.252 6.74899 13.252C6.94099 13.252 7.13301 13.179 7.27901 13.032L10.779 9.53201C11.072 9.23901 11.072 8.76397 10.779 8.47097L10.78 8.46999Z"></path></g></svg>
          </span>
        </div>
      </button>
    )
  }

  // Generate colors based on user's email
  const colors = generateAvatarColors(session.user.email)

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-[35px] h-[35px] transition-transform duration-200 hover:scale-105 relative flex items-center justify-center"
        title="Account menu"
      >
        <svg className="block" xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 35 35" fill="none">
          <g clipPath="url(#clip0_572_477)">
            <mask id="mask0_572_477" style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="0" y="0" width="35" height="35">
              <path d="M34.5371 0.721191H0.537109V34.7212H34.5371V0.721191Z" fill="white" />
            </mask>
            <g mask="url(#mask0_572_477)">
              <path d="M34.5371 0.721191H0.537109V34.7212H34.5371V0.721191Z" fill={colors.primary} />
              <g style={{ mixBlendMode: "screen" }} opacity="0.6" filter="url(#filter0_572_477)">
                <path d="M68.7587 18.1098L36.3035 55.4453L27.8356 48.0843L31.4059 16.7693L31.1492 16.5462L14.1075 36.1506L4.02303 27.3843L36.4783 -9.95117L45.0744 -2.47866L41.3435 28.6066L41.6514 28.8742L58.6486 9.32122L68.7587 18.1098Z" fill="white" />
              </g>
              <g style={{ mixBlendMode: "screen" }} opacity="0.6" filter="url(#filter1_f_572_477)">
                <path d="M44.7925 26.5398L48.5137 36.7637L8.09749 51.474L4.37631 41.2501L18.3702 36.1567L5.1484 -0.1699L17.6087 -4.70509L30.8422 31.6535L44.7925 26.5398Z" fill={colors.secondary} />
              </g>
            </g>
          </g>
          <defs>
            <filter id="filter0_572_477" x="-27.9771" y="-41.9512" width="128.736" height="129.396" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="16" result="effect1_foregroundBlur_572_477" />
            </filter>
            <filter id="filter1_f_572_477" x="-27.6238" y="-36.7051" width="108.137" height="120.179" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="16" result="effect1_foregroundBlur_572_477" />
            </filter>
            <clipPath id="clip0_572_477">
              <rect x="0.537109" y="0.721191" width="34" height="34" rx="6" fill="white" />
            </clipPath>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-semibold text-sm leading-none">
            {session.user.email?.charAt(0).toUpperCase()}
          </span>
        </div>
      </button>

      {/* User Menu */}
      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-[#1B1D21] border border-white/10 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">

              <p className="text-sm font-medium text-white truncate">
                {session.user.name ? `${session.user.name}` : "Anonymous"}
                <br />
                {session.user.email}


              </p>
              <button
                onClick={async () => {
                  setShowMenu(false)
                  try {
                    await signOut({
                      fetchOptions: {
                        onSuccess: () => {
                          // Redirect to home page after sign out
                          router.push('/')
                        },
                      },
                    })
                  } catch (error) {
                    console.error("Sign out error:", error)
                  }
                }}
                className="p-1 text-gray-400 hover:text-[#d66f6f] rounded-md transition-colors flex-shrink-0"
                title="Sign out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
                  <title>rect-logout</title>
                  <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" stroke="currentColor">
                    <path d="M6 5.75V4.25C6 3.145 6.895 2.25 8 2.25H13.75C14.855 2.25 15.75 3.145 15.75 4.25V13.75C15.75 14.855 14.855 15.75 13.75 15.75H8C6.895 15.75 6 14.855 6 13.75V12.25" fill="currentColor" fillOpacity="0.3" data-stroke="none" stroke="none"></path>
                    <path d="M6.25 5.75V4.25C6.25 3.145 7.145 2.25 8.25 2.25H13.75C14.855 2.25 15.75 3.145 15.75 4.25V13.75C15.75 14.855 14.855 15.75 13.75 15.75H8.25C7.145 15.75 6.25 14.855 6.25 13.75V12.25"></path>
                    <path d="M3.5 11.75L0.75 9L3.5 6.25"></path>
                    <path d="M0.75 9H9.25"></path>
                  </g>
                </svg>
              </button>
            </div>
          </div>
          <div className="p-4 border-b border-white/10">
            <div className="space-y-3 ">
              <Link href="/dashboard" className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Dashboard</span>
              </Link>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Cursor Rules</span>
                <span className="text-sm font-medium text-white">{rulesCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Total Views</span>
                <span className="text-sm font-medium text-white">{totalViews.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
