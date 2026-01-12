import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 gap-8">
      <div className="flex flex-col items-center gap-4 text-center max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight">Welcome to Social Network</h1>
        <p className="text-lg text-muted-foreground">
          A modern social platform built with Payload CMS, Next.js, and Supabase
        </p>
      </div>

      <div className="flex gap-4">
        <Button asChild size="lg">
          <Link href="/auth/signup">Get Started</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/auth/login">Login</Link>
        </Button>
        <Button asChild size="lg" variant="secondary">
          <Link href="/admin">Admin Panel</Link>
        </Button>
      </div>
    </div>
  )
}
