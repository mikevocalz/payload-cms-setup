import Link from "next/link";
import { Button } from "@/components/ui/button";
import Logo from "@/components/admin/ui/logo";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 gap-8 bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950">
      <div className="flex flex-col items-center gap-6 text-center max-w-2xl">
        <Logo width={300} height={116} />
        <p className="text-xl text-slate-300">
          Express yourself. Connect authentically. Break the mold.
        </p>
        <p className="text-slate-400">
          A social platform for creators, thinkers, and those who dare to be
          different.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          asChild
          size="lg"
          className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0"
        >
          <Link href="/auth/signup">Get Started</Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="border-slate-600 text-white hover:bg-slate-800"
        >
          <Link href="/auth/login">Login</Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="ghost"
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <Link href="/admin">Admin</Link>
        </Button>
      </div>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl">
        <div className="text-center p-6 rounded-xl bg-slate-800/50 border border-slate-700">
          <div className="w-10 h-10 mx-auto mb-4 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-violet-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Real Conversations
          </h3>
          <p className="text-slate-400 text-sm">
            Engage in meaningful discussions with real-time messaging
          </p>
        </div>
        <div className="text-center p-6 rounded-xl bg-slate-800/50 border border-slate-700">
          <div className="w-10 h-10 mx-auto mb-4 rounded-lg bg-fuchsia-500/20 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-fuchsia-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Creator Economy
          </h3>
          <p className="text-slate-400 text-sm">
            Support creators with subscriptions and exclusive content
          </p>
        </div>
        <div className="text-center p-6 rounded-xl bg-slate-800/50 border border-slate-700">
          <div className="w-10 h-10 mx-auto mb-4 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-cyan-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Events & Stories
          </h3>
          <p className="text-slate-400 text-sm">
            Share moments and organize events with your community
          </p>
        </div>
      </div>
    </div>
  );
}
