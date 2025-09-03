import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { magicLink, deviceAuthorization } from "better-auth/plugins"
import { bearer } from "better-auth/plugins/bearer"
import { Inbound } from "@inboundemail/sdk"
import { db } from "./db"
import { env } from "./env"


// Initialize Inbound for email sending
const inbound = new Inbound(env.INBOUND_API_KEY)

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production' ? "http://localhost:3000" : "https://cursor.link"),
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: false, // Disable password auth since we only want magic link
  },
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
  plugins: [
    bearer(),
    deviceAuthorization({ 
      // Optional configuration
      expiresIn: "30m", // Device code expiration time
      interval: "5s",    // Minimum polling interval
      // Allow any client ID for now (can add validation later)
      validateClient: async (clientId) => {
        console.log('Device auth request for client:', clientId);
        return true; // Accept all clients for now
      },
      onDeviceAuthRequest: async (clientId, scope) => {
        console.log('Device authorization request:', { clientId, scope });
      },
    }), 
    magicLink({
      sendMagicLink: async ({ email, token, url }) => {
        // Console log magic link in development environments
        if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
          console.log('🔗 Magic Link for development:')
          console.log(`📧 Email: ${email}`)
          console.log(`🔐 Magic Link: ${url}`)
          console.log('Copy and paste the magic link above into your browser to sign in.')
        }

        try {
          await inbound.emails.send({
            from: process.env.NODE_ENV === 'development' ? "Cursor Link <agent@inbnd.dev>" : "Cursor Link <auth@cursor.link>",
            to: email,
            subject: "Sign in to Cursor Link",
            html: `
              <p>Welcome to Cursor Link</p>
              <p>Click the link below to sign in:</p>
              <a href="${url}">click here to sign in</a><br>
              <p>This link will expire in 5 minutes.</p>
              <p>If you didn't request this link, you can safely ignore this email.</p>
              <br>
              <br>
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
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 // Cache duration in seconds
    }
  },
})
