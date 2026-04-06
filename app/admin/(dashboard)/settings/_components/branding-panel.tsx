"use client"

import { useRef, useState } from "react"
import { Loader2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { deleteBrandingAssetAction, updateBrandingNameAction } from "@/modules/settings/actions"

interface BrandingPanelProps {
  siteName: string | null
  siteLogoUrl: string | null
  siteFaviconUrl: string | null
}

const MAX_SIZE = 1_048_576

function AssetCard({
  type,
  label,
  description,
  accept,
  currentUrl,
  uploadEndpoint,
  onUploaded,
  onRemoved,
}: {
  type: "logo" | "favicon"
  label: string
  description: string
  accept: string
  currentUrl: string | null
  uploadEndpoint: string
  onUploaded: (url: string) => void
  onRemoved: () => void
}) {
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!inputRef.current) return
    inputRef.current.value = ""

    if (!file) return

    if (file.size > MAX_SIZE) {
      toast({ title: "File too large", description: "Maximum size is 1 MB.", variant: "destructive" })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.set("file", file)

      const res = await fetch(uploadEndpoint, { method: "POST", body: formData })
      const json = await res.json()

      if (!res.ok) {
        toast({ title: "Upload failed", description: json.error ?? "Unknown error", variant: "destructive" })
        return
      }

      const cacheBusted = `${json.url}?v=${Date.now()}`
      setPreviewUrl(cacheBusted)
      onUploaded(json.url)
      toast({ title: `${label} updated` })
    } catch {
      toast({ title: "Upload failed", description: "Network error", variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  async function handleRemove() {
    setRemoving(true)
    try {
      const result = await deleteBrandingAssetAction(type)
      if ("error" in result) {
        toast({ title: "Remove failed", description: (result.error as { message: string }).message, variant: "destructive" })
        return
      }
      setPreviewUrl(null)
      onRemoved()
      toast({ title: `${label} removed` })
    } catch {
      toast({ title: "Remove failed", description: "Network error", variant: "destructive" })
    } finally {
      setRemoving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{label}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview */}
        <div className="flex h-20 w-20 items-center justify-center rounded-lg border bg-muted">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={label}
              className="h-full w-full rounded-lg object-contain p-1"
            />
          ) : (
            <span className="text-xs text-muted-foreground">None</span>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading || removing}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {uploading ? "Uploading…" : "Upload"}
          </Button>

          {previewUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={uploading || removing}
              onClick={handleRemove}
            >
              {removing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <X className="mr-2 h-4 w-4" />
              )}
              Remove
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">Accepts: {accept} · Max 1 MB</p>
      </CardContent>
    </Card>
  )
}

function SiteNameForm({ initialName }: { initialName: string | null }) {
  const { toast } = useToast()
  const [name, setName] = useState(initialName ?? "")
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const result = await updateBrandingNameAction({ siteName: name })
      if ("error" in result) {
        const msg = "message" in (result.error as object)
          ? (result.error as { message: string }).message
          : "Validation error"
        toast({ title: "Save failed", description: msg, variant: "destructive" })
        return
      }
      toast({ title: "Site name updated" })
    } catch {
      toast({ title: "Save failed", description: "Network error", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Label htmlFor="site-name">Site Name</Label>
      <div className="flex gap-2">
        <Input
          id="site-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My App"
          maxLength={100}
          className="max-w-sm"
        />
        <Button type="submit" size="sm" disabled={saving || name.trim() === ""}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Displayed in the sidebar and page title.</p>
    </form>
  )
}

export function BrandingPanel({ siteName, siteLogoUrl, siteFaviconUrl }: BrandingPanelProps) {
  const [logoUrl, setLogoUrl] = useState(siteLogoUrl)
  const [faviconUrl, setFaviconUrl] = useState(siteFaviconUrl)

  return (
    <div className="space-y-6">
      <SiteNameForm initialName={siteName} />

      <div className="grid gap-4 sm:grid-cols-2">
        <AssetCard
          type="logo"
          label="Site Logo"
          description="Shown in the sidebar. PNG, JPEG, or SVG recommended."
          accept=".png,.jpg,.jpeg,.svg"
          currentUrl={logoUrl}
          uploadEndpoint="/api/settings/upload-logo"
          onUploaded={setLogoUrl}
          onRemoved={() => setLogoUrl(null)}
        />

        <AssetCard
          type="favicon"
          label="Favicon"
          description="Browser tab icon. Must be a .ico file."
          accept=".ico"
          currentUrl={faviconUrl}
          uploadEndpoint="/api/settings/upload-favicon"
          onUploaded={setFaviconUrl}
          onRemoved={() => setFaviconUrl(null)}
        />
      </div>
    </div>
  )
}
