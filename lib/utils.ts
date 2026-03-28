import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

/** Merge Tailwind classes safely — shadcn standard */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Format a date consistently across the app */
export function formatDate(
  date: Date | string | null | undefined,
  fmt = "PPP"
): string {
  if (!date) return "—"
  try {
    return format(new Date(date), fmt)
  } catch {
    return "—"
  }
}

/** Format a date with time */
export function formatDateTime(
  date: Date | string | null | undefined
): string {
  return formatDate(date, "MMM d, yyyy 'at' h:mm a")
}

/** Truncate a string to a given length */
export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.slice(0, length)}...` : str
}

/**
 * Check whether a permissions array grants the given permission.
 * A set containing "*" (super_admin wildcard) grants everything.
 */
export function canAccess(permissions: string[], permission: string): boolean {
  return permissions.includes("*") || permissions.includes(permission)
}

/** Get user initials for avatar fallback */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 1)
}
