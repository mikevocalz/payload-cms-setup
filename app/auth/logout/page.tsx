"use client"

import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await authClient.signOut()
        router.push("/auth/login")
      } catch (error) {
        console.error("Logout error:", error)
        router.push("/auth/login")
      }
    }

    handleLogout()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Signing out...</div>
    </div>
  )
}
