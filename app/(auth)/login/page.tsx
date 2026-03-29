import { Suspense } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoginForm } from "./login-form"
import { appConfig } from "@/config/app.config"
import { getAppSettings } from "@/modules/settings/queries"

export default async function LoginPage() {
  const settings = await getAppSettings()
  const locationConfig = {
    requireLocationForAuth: settings?.requireLocationForAuth ?? false,
    allowedCountries: settings?.allowedCountries ?? [],
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl font-bold">
            {appConfig.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-2xl font-bold">{appConfig.name}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense>
              <LoginForm locationConfig={locationConfig} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
