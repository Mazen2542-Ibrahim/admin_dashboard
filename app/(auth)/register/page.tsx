import { redirect } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RegisterForm } from "./register-form"
import { appConfig } from "@/config/app.config"
import { features } from "@/config/features.config"
import { getAppSettings } from "@/modules/settings/queries"

export default async function RegisterPage() {
  if (!features.registration) {
    redirect("/login")
  }

  const settings = await getAppSettings()
  const displayName = settings?.siteName ?? appConfig.name
  const locationConfig = {
    requireLocationForAuth: settings?.requireLocationForAuth ?? false,
    allowedCountries: settings?.allowedCountries ?? [],
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          {settings?.siteLogoUrl ? (
            <img
              src={settings.siteLogoUrl}
              alt={displayName}
              className="mx-auto mb-4 h-12 w-auto object-contain"
            />
          ) : (
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="text-2xl font-bold">{displayName}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Register to access {displayName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm
              locationConfig={locationConfig}
              emailVerificationEnabled={settings?.emailVerificationEnabled ?? false}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
