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
import { X } from "lucide-react"

const RESOURCE_TYPES = ["user", "role", "smtp", "email_template", "settings", "audit_log"]

interface AuditLogFiltersProps {
  actorEmail?: string
  resourceType?: string
  page: number
}

export function AuditLogFilters({ actorEmail, resourceType, page }: AuditLogFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [actorInput, setActorInput] = useState(actorEmail ?? "")

  // Keep input in sync when URL params change (e.g. Clear button)
  useEffect(() => {
    setActorInput(actorEmail ?? "")
  }, [actorEmail])

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    const merged = { actorEmail, resourceType, page: String(page), ...overrides }
    if (merged.actorEmail) params.set("actorEmail", merged.actorEmail)
    if (merged.resourceType) params.set("resourceType", merged.resourceType)
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

  const hasFilters = !!actorEmail || !!resourceType

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Search by actor…"
        value={actorInput}
        onChange={(e) => handleActorChange(e.target.value)}
        className="h-9 w-48"
      />
      <Select value={resourceType ?? "all"} onValueChange={handleResourceTypeChange}>
        <SelectTrigger className="h-9 w-40">
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
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          <X className="mr-1 h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  )
}
