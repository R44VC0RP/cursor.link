import { UserAvatar } from "@/components/auth/user-avatar"
import Link from "next/link"

export function Header() {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
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

      <UserAvatar />
    </div>
  )
}
