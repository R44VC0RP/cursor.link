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
  socialProviders: {
    github: { 
      clientId: process.env.GITHUB_CLIENT_ID as string, 
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string, 
    }, 
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, token, url }) => {
        try {
          await inbound.emails.send({
            from: "Cursor Link <auth@cursor.link>",
            to: email,
            subject: "Sign in to Cursor Link",
            html: `
              <p>Welcome to Cursor Link</p>
              <p>Click the link below to sign in:</p>
              <a href="${url}">click here to sign in</a><br>
              <p>This link will expire in 5 minutes.</p>
              <p>If you didn't request this link, you can safely ignore this email.</p>
              <p>Thanks,<br>
              The Cursor Link Team</p>
              <p>if that above link doesn't work, you can copy and paste this into your browser: ${url}</p>
            `,
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
