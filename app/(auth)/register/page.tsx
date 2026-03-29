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
  const locationConfig = {
    requireLocationForAuth: settings?.requireLocationForAuth ?? false,
    allowedCountries: settings?.allowedCountries ?? [],
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl font-bold">
            A
          </div>
          <h1 className="text-2xl font-bold">{appConfig.name}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Register to access {appConfig.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm locationConfig={locationConfig} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
