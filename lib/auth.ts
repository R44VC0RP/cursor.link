import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { magicLink } from "better-auth/plugins"
import { Inbound } from "@inboundemail/sdk"
import { db } from "./db"

// Initialize Inbound for email sending
const inbound = new Inbound(process.env.INBOUND_API_KEY!)

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: false, // Disable password auth since we only want magic link
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, token, url }) => {
        try {
          await inbound.emails.send({
            from: "Cursor Link <auth@cursor.link>",
            to: email,
            subject: "Sign in to Cursor Link",
            text: `Welcome to Cursor Link\n\nClick the link below to sign in:\n${url}\n\nThis link will expire in 5 minutes.\n\nIf you didn't request this link, you can safely ignore this email.`,
          })
        } catch (error) {
          console.error("Failed to send magic link email:", error)
          throw error
        }
      },
      expiresIn: 300, // 5 minutes
      disableSignUp: false, // Allow new user signup
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
})
