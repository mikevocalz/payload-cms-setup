import { betterAuth } from "better-auth"
import { admin, username } from "better-auth/plugins"
import { Pool } from "pg"

export const auth = betterAuth({
  database: new Pool({
    host: "db.llmqdmljkxvgtgrluypn.supabase.co",
    port: 5432,
    database: "postgres",
    user: "postgres",
    password: "Jabari516253Beekman",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "apple", "email-password"],
      allowDifferentEmails: false, // Only link accounts with same email
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID || "",
      clientSecret: process.env.APPLE_CLIENT_SECRET || "",
    },
  },
  plugins: [
    admin(),
    username()
  ],
  trustedOrigins: [
    process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000",
    "https://appleid.apple.com", // Required for Apple Sign In
  ],
  secret: process.env.BETTER_AUTH_SECRET || "",
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000",
})
