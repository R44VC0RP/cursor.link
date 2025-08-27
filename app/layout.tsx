import type React from "react"
import type { Metadata } from "next"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { ReactScanInit } from "@/components/react-scan-init"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "cursor.link - share cursor rules",
  description: "create and share cursor rules files - like gist but for cursor rules",
  generator: "v0.app & ryan",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <ReactScanInit />
        <NuqsAdapter>{children}</NuqsAdapter>
        <Toaster />
      </body>
    </html>
  )
}
