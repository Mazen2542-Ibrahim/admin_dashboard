import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { appConfig } from "@/config/app.config"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { getAppSettings } from "@/modules/settings/queries"

const inter = Inter({ subsets: ["latin"] })

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getAppSettings()
  return {
    title: appConfig.name,
    description: appConfig.description,
    icons: settings?.siteFaviconUrl
      ? [{ rel: "icon", url: settings.siteFaviconUrl }]
      : undefined,
  }
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
