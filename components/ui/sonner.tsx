"use client"

import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      className="toaster group"
      expand={true}
      richColors={true}
      closeButton={true}
      toastOptions={{
        style: {
          background: '#1B1D21',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'white',
          borderRadius: '8px',
          boxShadow: 'rgba(0, 0, 0, 0.06) 0px 18px 25.8px 0px',
        },
        className: 'sonner-toast',
        duration: 4000,
      }}
      style={
        {
          "--normal-bg": "#1B1D21",
          "--normal-text": "white",
          "--normal-border": "rgba(255, 255, 255, 0.1)",
          "--success-bg": "#1B1D21",
          "--success-text": "white",
          "--success-border": "rgba(34, 197, 94, 0.3)",
          "--error-bg": "#1B1D21",
          "--error-text": "white",
          "--error-border": "rgba(239, 68, 68, 0.3)",
          "--warning-bg": "#1B1D21",
          "--warning-text": "white",
          "--warning-border": "rgba(245, 158, 11, 0.3)",
          "--info-bg": "#1B1D21",
          "--info-text": "white",
          "--info-border": "rgba(112, 167, 215, 0.3)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
