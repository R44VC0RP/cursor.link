import type React from "react"
import type { Metadata } from "next"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { ReactScanInit } from "@/components/react-scan-init"
import { Toaster } from "@/components/ui/sonner"
import Script from "next/script"
import { headers as nextHeaders } from "next/headers"
import { auth } from "@/lib/auth"
import { AuthHydrator } from "@/components/auth/auth-hydrator"
import { Analytics } from "@vercel/analytics/react"
import { RootProvider } from 'fumadocs-ui/provider'
import "./globals.css"

export const metadata: Metadata = {
  title: "cursor.link - share cursor rules",
  description: "create and share cursor rules files - like gist but for cursor rules",
  generator: "v0.app & ryan",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const hdrs = await nextHeaders()
  const session = await auth.api.getSession({ headers: hdrs })
  const sessionJson = JSON.stringify(session ?? null).replace(/</g, "\\u003c")

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body 
        className="font-sans antialiased"
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <RootProvider>
          <AuthHydrator initialSession={session} />
          <ReactScanInit />
          <NuqsAdapter>{children}</NuqsAdapter>
          <Toaster />
          <Analytics />
        </RootProvider>
      </body>
    </html>
  )
}
