/** The three built-in authorization levels used by requireRole(). */
export type SystemRole = "super_admin" | "admin" | "user"

export interface User {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  role: string
  isActive: boolean
  lastLoginAt?: Date | null
  lastLoginCountry: string | null
  lastLoginLatitude: number | null
  lastLoginLongitude: number | null
  failedLoginAttempts: number
  lockedUntil: Date | null
  themePreference: string
  createdAt: Date
  updatedAt: Date
}

export interface UserSession {
  id: string
  userId: string
  token: string
  expiresAt: Date
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserInput {
  name: string
  email: string
  password: string
  role: string
}

export interface UpdateUserInput {
  name?: string
  email?: string
  emailVerified?: boolean
  role?: string
  isActive?: boolean
  themePreference?: string
}

export interface UserListFilters {
  page?: number
  limit?: number
  search?: string
  role?: string
  status?: "active" | "inactive"
}
