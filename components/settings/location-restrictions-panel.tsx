"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { updateLocationSettingsAction } from "@/modules/settings/actions"
import { toast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { COUNTRIES, countryFlag, countryName } from "@/lib/countries"
import type { AppSettings } from "@/modules/settings/types"

interface LocationRestrictionsPanelProps {
  settings: AppSettings
}

export function LocationRestrictionsPanel({ settings }: LocationRestrictionsPanelProps) {
  const [requireLocationForAuth, setRequireLocationForAuth] = React.useState(
    settings.requireLocationForAuth
  )
  const [allowedCountries, setAllowedCountries] = React.useState<string[]>(
    settings.allowedCountries
  )
  const [saving, setSaving] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  async function save(patch: Partial<{ requireLocationForAuth: boolean; allowedCountries: string[] }>) {
    const next = { requireLocationForAuth, allowedCountries, ...patch }
    setSaving(true)
    const result = await updateLocationSettingsAction(next)
    setSaving(false)

    if (result.error) {
      toast({
        title: "Failed to save",
        description:
          result.error && "message" in result.error
            ? (result.error as { message: string }).message
            : "Could not update location settings.",
        variant: "destructive",
      })
    } else {
      toast({ title: "Location settings saved" })
    }
  }

  function handleToggle(checked: boolean) {
    setRequireLocationForAuth(checked)
    save({ requireLocationForAuth: checked })
  }

  function handleAddCountry(code: string) {
    if (allowedCountries.includes(code)) return
    const next = [...allowedCountries, code]
    setAllowedCountries(next)
    save({ allowedCountries: next })
    setOpen(false)
  }

  function handleRemoveCountry(code: string) {
    const next = allowedCountries.filter((c) => c !== code)
    setAllowedCountries(next)
    save({ allowedCountries: next })
  }

  const availableCountries = COUNTRIES.filter(
    (c) => !allowedCountries.includes(c.code)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label htmlFor="location-toggle" className="text-sm font-medium">
            Require Location for Authentication
          </Label>
          <p className="text-sm text-muted-foreground">
            Users must share their location before signing in or registering.
          </p>
        </div>
        <Switch
          id="location-toggle"
          checked={requireLocationForAuth}
          onCheckedChange={handleToggle}
          disabled={saving}
        />
      </div>

      {requireLocationForAuth && (
        <div className="space-y-4 border-t pt-4">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Allowed Countries</Label>
            <p className="text-sm text-muted-foreground">
              Only users from these countries can authenticate. Leave empty to allow all countries.
            </p>
          </div>

          {allowedCountries.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allowedCountries.map((code) => (
                <Badge key={code} variant="secondary" className="gap-1 pr-1">
                  <span>{countryFlag(code)}</span>
                  <span>{countryName(code)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCountry(code)}
                    disabled={saving}
                    className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5 disabled:opacity-50"
                    aria-label={`Remove ${countryName(code)}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full sm:w-[220px] justify-between"
                disabled={saving}
              >
                Add country…
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[min(280px,_calc(100vw_-_2rem))] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search countries…" />
                <CommandList>
                  <CommandEmpty>No country found.</CommandEmpty>
                  <CommandGroup>
                    {availableCountries.map((country) => (
                      <CommandItem
                        key={country.code}
                        value={`${country.name} ${country.code}`}
                        onSelect={() => handleAddCountry(country.code)}
                      >
                        <span className="mr-2">{countryFlag(country.code)}</span>
                        {country.name}
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            allowedCountries.includes(country.code) ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  )
}
