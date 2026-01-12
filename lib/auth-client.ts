"use client"

import { createAuthClient } from "better-auth/client"
import { adminClient, usernameClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000",
  plugins: [adminClient(), usernameClient()],
})

export const { signIn, signUp, signOut, useSession } = authClient
