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

export function UserAvatar() {
  const { data: session } = useSession()
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [rulesCount, setRulesCount] = useState(0)
  const [totalViews, setTotalViews] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
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

  // Fetch user stats when session is available
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

  if (!session) {
    // Show fingerprint icon when not signed in
    return (
      <button
        onClick={() => router.push('/login')}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`w-[35px] h-[35px] bg-[#1B1D21] rounded-lg flex items-center justify-center transition-all duration-200 ${isHovered ? 'bg-[#2A2D32] scale-105' : 'hover:bg-[#2A2D32]'
          }`}
        title="Sign in"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
          <title>fingerprint</title>
          <g fill={isHovered ? "#90BAE0" : "#70A7D7"} className="transition-colors duration-200">
            <path fillRule="evenodd" clipRule="evenodd" d="M9.00001 2.75C7.68924 2.75 6.48996 3.23143 5.56899 4.02896C5.25586 4.30012 4.78221 4.2661 4.51105 3.95297C4.2399 3.63985 4.27392 3.16619 4.58704 2.89504C5.77007 1.87057 7.31478 1.25 9.00001 1.25C12.7232 1.25 15.75 4.27679 15.75 8C15.75 10.387 15.3742 12.5347 14.7222 14.4542C14.5889 14.8464 14.163 15.0564 13.7708 14.9232C13.3786 14.7899 13.1686 14.364 13.3019 13.9718C13.8998 12.2113 14.25 10.227 14.25 8C14.25 5.10521 11.8948 2.75 9.00001 2.75Z"></path>
            <path fillRule="evenodd" clipRule="evenodd" d="M3.89029 4.76983C4.26484 4.94671 4.42507 5.39373 4.24819 5.76828C3.92854 6.44514 3.75 7.20096 3.75 8.00001C3.75 8.38139 3.6915 10.2337 2.54695 12.0957C2.33005 12.4486 1.86815 12.5589 1.51527 12.342C1.16238 12.1251 1.05215 11.6632 1.26905 11.3103C2.20451 9.78836 2.25 8.25862 2.25 8.00001C2.25 6.97506 2.47949 6.00087 2.89184 5.12773C3.06872 4.75319 3.51574 4.59295 3.89029 4.76983Z"></path>
            <path fillRule="evenodd" clipRule="evenodd" d="M11.9626 9.39774C12.3737 9.44889 12.6654 9.82357 12.6143 10.2346C12.3232 12.5733 11.5837 14.5968 10.5655 16.3282C10.3555 16.6852 9.89586 16.8045 9.53881 16.5945C9.18176 16.3845 9.06254 15.9249 9.27251 15.5678C10.1903 14.0072 10.8608 12.1787 11.1257 10.0494C11.1769 9.63834 11.5516 9.34659 11.9626 9.39774Z" fillOpacity="0.4"></path>
            <path fillRule="evenodd" clipRule="evenodd" d="M9.00001 5.75C7.75722 5.75 6.75001 6.75721 6.75001 8C6.75001 10.8522 5.77746 13.0139 4.44979 14.6182C4.18571 14.9373 3.71293 14.9819 3.39382 14.7178C3.07472 14.4537 3.03011 13.9809 3.2942 13.6618C4.41453 12.3081 5.25001 10.4798 5.25001 8C5.25001 5.92879 6.9288 4.25 9.00001 4.25C10.9056 4.25 12.4786 5.67128 12.7187 7.51093C12.7723 7.92166 12.4828 8.29808 12.0721 8.35169C11.6613 8.4053 11.2849 8.1158 11.2313 7.70507C11.0874 6.60272 10.1424 5.75 9.00001 5.75Z" fillOpacity="0.4"></path>
            <path fillRule="evenodd" clipRule="evenodd" d="M9.00001 7.25C9.41423 7.25 9.75001 7.58579 9.75001 8C9.75001 11.4326 8.6672 14.0727 7.14816 16.0718C6.89756 16.4016 6.42704 16.4658 6.09724 16.2152C5.76744 15.9646 5.70324 15.494 5.95385 15.1642C7.28281 13.4153 8.25001 11.0914 8.25001 8C8.25001 7.58579 8.5858 7.25 9.00001 7.25Z"></path>
          </g>
        </svg>
      </button>
    )
  }

  // Generate colors based on user's email
  const colors = generateAvatarColors(session.user.email)

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-[35px] h-[35px] transition-transform duration-200 hover:scale-105"
        title="Account menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 35 35" fill="none">
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
      </button>

      {/* User Menu */}
      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-[#1B1D21] border border-white/10 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white truncate">
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
