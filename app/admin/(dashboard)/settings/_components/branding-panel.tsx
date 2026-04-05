"use client"

import { useRef, useState } from "react"
import { Loader2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { deleteBrandingAssetAction } from "@/modules/settings/actions"

interface BrandingPanelProps {
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

export function BrandingPanel({ siteLogoUrl, siteFaviconUrl }: BrandingPanelProps) {
  const [logoUrl, setLogoUrl] = useState(siteLogoUrl)
  const [faviconUrl, setFaviconUrl] = useState(siteFaviconUrl)

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Branding</h3>
        <p className="text-sm text-muted-foreground">
          Upload a logo and favicon to customise how your site looks to users.
        </p>
      </div>

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
