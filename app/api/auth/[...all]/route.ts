/**
 * Better Auth Catch-All Route
 * Handles all authentication requests at /api/auth/*
 */
import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

export const { GET, POST } = toNextJsHandler(auth)

// Ensure runtime is Edge-compatible
export const runtime = 'nodejs'
