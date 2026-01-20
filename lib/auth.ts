import { betterAuth } from "better-auth";
import { admin, username } from "better-auth/plugins";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URI,
  }),
  emailAndPassword: {
    username: true,
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
  plugins: [admin(), username()],
  trustedOrigins: [
    process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000",
    "https://appleid.apple.com", // Required for Apple Sign In
    "http://localhost:8081", // Expo dev
    "exp://localhost:8081", // Expo Go
    "dvnt://", // Expo app scheme
  ],
  secret: process.env.BETTER_AUTH_SECRET || "",
  baseURL:
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_SERVER_URL ||
    "http://localhost:3000",
});
