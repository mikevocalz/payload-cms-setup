import { AccountLinking } from "@/components/account-linking"

export default function AccountsSettingsPage() {
  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">Manage your connected accounts and sign-in methods</p>
        </div>
        <AccountLinking />
      </div>
    </div>
  )
}
