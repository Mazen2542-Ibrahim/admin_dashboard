export const appConfig = {
  name: "Admin Dashboard",
  description: "Production-ready admin panel for your application",
  logo: "/logo.svg",
  primaryColor: "blue",
  supportEmail: "support@example.com",
} as const

export type AppConfig = typeof appConfig
