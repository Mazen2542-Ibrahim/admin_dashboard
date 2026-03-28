/**
 * Feature flags — set to false to disable entire modules.
 * Disabling a module hides its nav item and redirects its routes.
 */
export const features = {
  smtp: true,
  emailTemplates: true,
  auditLogs: true,
  roles: true,
  /** Set false to disable the public /register page */
  registration: true,
  settings: true,
} satisfies Record<string, boolean>

export type Features = typeof features
