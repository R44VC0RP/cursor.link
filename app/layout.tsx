import type React from "react"
import type { Metadata } from "next"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { ReactScanInit } from "@/components/react-scan-init"
import { Toaster } from "sonner"
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
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1B1D21',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white',
            },
            className: 'sonner-toast',
          }}
        />
      </body>
    </html>
  )
}
