"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function AccountLinking() {
  const [isLinking, setIsLinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleLinkGoogle = async () => {
    setIsLinking(true)
    setError(null)
    setSuccess(null)
    try {
      await authClient.linkSocial({
        provider: "google",
        callbackURL: "/settings/accounts",
      })
      setSuccess("Google account linked successfully!")
    } catch (err) {
      setError("Failed to link Google account. Please try again.")
      console.error("[v0] Google linking error:", err)
    } finally {
      setIsLinking(false)
    }
  }

  const handleLinkApple = async () => {
    setIsLinking(true)
    setError(null)
    setSuccess(null)
    try {
      await authClient.linkSocial({
        provider: "apple",
        callbackURL: "/settings/accounts",
      })
      setSuccess("Apple account linked successfully!")
    } catch (err) {
      setError("Failed to link Apple account. Please try again.")
      console.error("[v0] Apple linking error:", err)
    } finally {
      setIsLinking(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Accounts</CardTitle>
        <CardDescription>
          Link your Google or Apple account to your profile. Once linked, you can sign in with either method using the
          same account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>}
        {success && <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-600">{success}</div>}

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium">Google</p>
              <p className="text-sm text-muted-foreground">Link your Google account</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLinkGoogle} disabled={isLinking}>
            {isLinking ? "Linking..." : "Link Account"}
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Apple</p>
              <p className="text-sm text-muted-foreground">Link your Apple ID</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLinkApple} disabled={isLinking}>
            {isLinking ? "Linking..." : "Link Account"}
          </Button>
        </div>

        <div className="rounded-lg bg-muted p-4 text-sm">
          <p className="font-medium">About Account Linking</p>
          <p className="mt-1 text-muted-foreground">
            When you link a Google or Apple account, you can sign in with either your email/password or social account.
            Accounts are merged automatically if they share the same email address.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
