"use client"

import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { X, CalendarIcon, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTransition } from "react"

const RESOURCE_TYPES = ["user", "role", "smtp", "email_template", "settings", "audit_log"]

const ACTION_OPTIONS = [
  "user.signed_in",
  "user.registered",
  "user.created",
  "user.updated",
  "user.deleted",
  "user.hard_deleted",
  "user.deactivated",
  "user.password_changed",
  "user.password_reset_requested",
  "user.password_reset_email_sent",
  "user.session_revoked",
  "user.sessions_revoked_all",
  "user.email_change_requested",
  "user.verification_email_sent_by_admin",
  "user.account_locked",
  "user.account_unlocked",
  "user.login_failed",
  "role.created",
  "role.updated",
  "role.deleted",
  "smtp.updated",
  "email_template.created",
  "email_template.updated",
  "email_template.deleted",
  "settings.updated",
  "audit_logs.purged",
]

/** Parse a "yyyy-MM-dd" string to a Date (midnight local). Returns undefined if blank/invalid. */
function parseDate(s: string | undefined): Date | undefined {
  if (!s) return undefined
  const d = new Date(s + "T00:00:00")
  return isNaN(d.getTime()) ? undefined : d
}

/** Format a Date to "yyyy-MM-dd" for URL params. */
function formatDate(d: Date): string {
  return d.toLocaleDateString("en-CA") // "en-CA" gives yyyy-MM-dd natively
}

/** Format a Date to a short human-readable string for the button label. */
function formatLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

interface DatePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  placeholder: string
}

function DatePicker({ value, onChange, placeholder }: DatePickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 w-full justify-start text-left font-normal sm:w-36",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{value ? formatLabel(value) : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date)
            setOpen(false)
          }}
          captionLayout="dropdown"
          startMonth={new Date(2020, 0)}
          endMonth={new Date(2030, 11)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

interface AuditLogFiltersProps {
  actorEmail?: string
  resourceType?: string
  action?: string
  dateFrom?: string
  dateTo?: string
  page: number
}

export function AuditLogFilters({
  actorEmail,
  resourceType,
  action,
  dateFrom,
  dateTo,
  page,
}: AuditLogFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [actorInput, setActorInput] = useState(actorEmail ?? "")
  const [isRefreshing, startRefresh] = useTransition()

  useEffect(() => { setActorInput(actorEmail ?? "") }, [actorEmail])

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    const merged = {
      actorEmail,
      resourceType,
      action,
      dateFrom,
      dateTo,
      page: String(page),
      ...overrides,
    }
    if (merged.actorEmail)   params.set("actorEmail",   merged.actorEmail)
    if (merged.resourceType) params.set("resourceType", merged.resourceType)
    if (merged.action)       params.set("action",       merged.action)
    if (merged.dateFrom)     params.set("dateFrom",     merged.dateFrom)
    if (merged.dateTo)       params.set("dateTo",       merged.dateTo)
    params.set("page", overrides.page ?? "1")
    return `${pathname}?${params.toString()}`
  }

  function handleActorChange(value: string) {
    setActorInput(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      router.push(buildUrl({ actorEmail: value || undefined, page: "1" }))
    }, 300)
  }

  function handleResourceTypeChange(value: string) {
    router.push(buildUrl({ resourceType: value === "all" ? undefined : value, page: "1" }))
  }

  function handleActionChange(value: string) {
    router.push(buildUrl({ action: value === "all" ? undefined : value, page: "1" }))
  }

  function handleDateFromChange(date: Date | undefined) {
    router.push(buildUrl({ dateFrom: date ? formatDate(date) : undefined, page: "1" }))
  }

  function handleDateToChange(date: Date | undefined) {
    router.push(buildUrl({ dateTo: date ? formatDate(date) : undefined, page: "1" }))
  }

  const hasFilters = !!actorEmail || !!resourceType || !!action || !!dateFrom || !!dateTo

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <Input
        placeholder="Search by actor…"
        value={actorInput}
        onChange={(e) => handleActorChange(e.target.value)}
        className="h-9 w-full sm:w-48"
      />
      <Select value={resourceType ?? "all"} onValueChange={handleResourceTypeChange}>
        <SelectTrigger className="h-9 w-full sm:w-40">
          <SelectValue placeholder="All resources" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All resources</SelectItem>
          {RESOURCE_TYPES.map((r) => (
            <SelectItem key={r} value={r}>
              {r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={action ?? "all"} onValueChange={handleActionChange}>
        <SelectTrigger className="h-9 w-full sm:w-48">
          <SelectValue placeholder="All actions" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All actions</SelectItem>
          {ACTION_OPTIONS.map((a) => (
            <SelectItem key={a} value={a}>
              {a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DatePicker
        value={parseDate(dateFrom)}
        onChange={handleDateFromChange}
        placeholder="From date"
      />
      <DatePicker
        value={parseDate(dateTo)}
        onChange={handleDateToChange}
        placeholder="To date"
      />
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          <X className="mr-1 h-3.5 w-3.5" />
          Clear
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => startRefresh(() => router.refresh())}
        disabled={isRefreshing}
      >
        <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
      </Button>
    </div>
  )
}
