import { UserAvatar } from "@/components/auth/user-avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Header() {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-[35px] h-[35px] bg-[#1B1D21] rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
              <title>cursor-ripple</title>
              <g fill="#70A7D7">
                <path fillRule="evenodd" clipRule="evenodd" d="M4 7.75C4 5.67879 5.67879 4 7.75 4C8.45824 4 9.11725 4.20058 9.67812 4.54314C10.0316 4.75904 10.1432 5.22062 9.92726 5.57412C9.71136 5.92762 9.24978 6.03916 8.89628 5.82326C8.56055 5.61822 8.17056 5.5 7.75 5.5C6.50721 5.5 5.5 6.50721 5.5 7.75C5.5 8.16726 5.61598 8.55354 5.81732 8.88669C6.03155 9.2412 5.91783 9.70226 5.56332 9.9165C5.20882 10.1307 4.74776 10.017 4.53352 9.66251C4.19666 9.10506 4 8.45194 4 7.75Z" fillOpacity="0.4"></path>
                <path fillRule="evenodd" clipRule="evenodd" d="M7.31879 8.58887C7.04566 7.79551 7.80722 7.05157 8.58751 7.31696C8.60202 7.32189 8.61632 7.32725 8.6304 7.33301L15.9019 9.82843C16.7895 10.1328 16.8066 11.3808 15.93 11.71L12.8632 12.8632L11.7093 15.9318C11.3797 16.8016 10.1345 16.7945 9.82862 15.9024L7.31879 8.58887Z"></path>
                <path fillRule="evenodd" clipRule="evenodd" d="M11.7688 11.7688C12.0617 11.4759 12.5365 11.4759 12.8294 11.7688L16.2733 15.2127C16.5662 15.5056 16.5662 15.9804 16.2733 16.2733C15.9804 16.5662 15.5056 16.5662 15.2127 16.2733L11.7688 12.8294C11.4759 12.5365 11.4759 12.0617 11.7688 11.7688Z"></path>
                <path fillRule="evenodd" clipRule="evenodd" d="M1 7.75C1 4.02179 4.02179 1 7.75 1C11.0663 1 13.819 3.39167 14.3883 6.54286C14.462 6.95047 14.1913 7.34061 13.7837 7.41426C13.376 7.48791 12.9859 7.21717 12.9123 6.80956C12.4694 4.35855 10.3267 2.5 7.75 2.5C4.85021 2.5 2.5 4.85021 2.5 7.75C2.5 10.3271 4.35897 12.4701 6.81082 12.9134C7.21843 12.987 7.48912 13.3772 7.41544 13.7848C7.34175 14.1924 6.95159 14.4631 6.54398 14.3894C3.39223 13.8197 1 11.0667 1 7.75Z" fillOpacity="0.4"></path>
              </g>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white">
            cursor.link
          </h1>
        </Link>
      </div>
      <div className="flex items-center gap-1">
        <Button asChild variant="ghost" size="sm" className="h-[35px] min-h-0 py-0 px-3">
          <Link href="/feed">
            <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><title>users-separation</title><g fill="#70A7D7"><path d="M9 1.25C8.586 1.25 8.25 1.586 8.25 2V16C8.25 16.414 8.586 16.75 9 16.75C9.414 16.75 9.75 16.414 9.75 16V2C9.75 1.586 9.414 1.25 9 1.25Z"></path> <path d="M4 7.5C5.24264 7.5 6.25 6.49264 6.25 5.25C6.25 4.00736 5.24264 3 4 3C2.75736 3 1.75 4.00736 1.75 5.25C1.75 6.49264 2.75736 7.5 4 7.5Z" fill-opacity="0.4"></path> <path d="M4 8.5C2.346 8.5 1 9.846 1 11.5V13.75C1 14.715 1.785 15.5 2.75 15.5H5.25C6.215 15.5 7 14.715 7 13.75V11.5C7 9.846 5.654 8.5 4 8.5Z" fill-opacity="0.4"></path> <path d="M14 7.5C15.2426 7.5 16.25 6.49264 16.25 5.25C16.25 4.00736 15.2426 3 14 3C12.7574 3 11.75 4.00736 11.75 5.25C11.75 6.49264 12.7574 7.5 14 7.5Z" fill-opacity="0.4"></path> <path d="M14 8.5C12.346 8.5 11 9.846 11 11.5V13.75C11 14.715 11.785 15.5 12.75 15.5H15.25C16.215 15.5 17 14.715 17 13.75V11.5C17 9.846 15.654 8.5 14 8.5Z" fill-opacity="0.4"></path></g></svg>
              <span>Feed</span>
            </span>
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="h-[35px] min-h-0 py-0 px-3">
          <Link href="/">
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><title>file-plus</title><g fill="#70A7D7"><path d="M11.572 1.512L15.487 5.427C15.8155 5.7553 16 6.2009 16 6.6655V8.87889C15.6425 8.63957 15.2125 8.5 14.75 8.5C13.5074 8.5 12.5 9.50736 12.5 10.75V11H12.25C11.0074 11 10 12.0074 10 13.25C10 14.4926 11.0074 15.5 12.25 15.5H12.5V15.75C12.5 16.2125 12.6396 16.6425 12.8789 17H4.75C3.2312 17 2 15.7688 2 14.25V3.75C2 2.2312 3.2312 1 4.75 1H10.336C10.7996 1 11.2442 1.1841 11.572 1.512Z" fill-opacity="0.4"></path> <path d="M15.8691 6.00098H12C11.45 6.00098 11 5.55098 11 5.00098V1.13101C11.212 1.21806 11.4068 1.34677 11.572 1.512L15.487 5.427C15.6527 5.59266 15.7818 5.7882 15.8691 6.00098Z"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M5 6.75C5 6.33579 5.33579 6 5.75 6H7.75C8.16421 6 8.5 6.33579 8.5 6.75C8.5 7.16421 8.16421 7.5 7.75 7.5H5.75C5.33579 7.5 5 7.16421 5 6.75Z"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M5 9.75C5 9.33579 5.33579 9 5.75 9H10.25C10.6642 9 11 9.33579 11 9.75C11 10.1642 10.6642 10.5 10.25 10.5H5.75C5.33579 10.5 5 10.1642 5 9.75Z"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M15.5 10.75C15.5 10.3358 15.1642 10 14.75 10C14.3358 10 14 10.3358 14 10.75V12.5H12.25C11.8358 12.5 11.5 12.8358 11.5 13.25C11.5 13.6642 11.8358 14 12.25 14H14V15.75C14 16.1642 14.3358 16.5 14.75 16.5C15.1642 16.5 15.5 16.1642 15.5 15.75V14H17.25C17.6642 14 18 13.6642 18 13.25C18 12.8358 17.6642 12.5 17.25 12.5H15.5V10.75Z"></path></g></svg>
              <span>Create</span>
            </span>
          </Link>
        </Button>

        <UserAvatar />
      </div>

    </div>
  )
}
