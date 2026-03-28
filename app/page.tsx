import Link from "next/link"
import { appConfig } from "@/config/app.config"

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">{appConfig.name}</h1>
      <p className="text-muted-foreground">{appConfig.description}</p>
      <Link
        href="/admin/dashboard"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Go to Admin Dashboard
      </Link>
    </main>
  )
}
