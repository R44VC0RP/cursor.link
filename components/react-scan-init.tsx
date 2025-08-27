'use client'

import { useEffect } from 'react'

export function ReactScanInit() {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV === 'development') {
      import('react-scan').then((scan) => {
        scan.scan({
          enabled: true,
          log: true          
        })
      })
    }
  }, [])

  return null
}
