type AssetType = "logo" | "favicon"

type ValidationResult =
  | { ok: true; mimeType: string; ext: string }
  | { ok: false; error: string }

const MAX_SIZE = 1_048_576 // 1 MB

// Magic byte signatures
const SIGNATURES = {
  png: [0x89, 0x50, 0x4e, 0x47],
  jpg: [0xff, 0xd8, 0xff],
  ico: [0x00, 0x00, 0x01, 0x00],
} as const

function matchesSignature(bytes: Uint8Array, sig: readonly number[]): boolean {
  return sig.every((b, i) => bytes[i] === b)
}

export function validateBrandingFile(buffer: Buffer, type: AssetType): ValidationResult {
  if (buffer.byteLength > MAX_SIZE) {
    return { ok: false, error: "File exceeds 1 MB limit" }
  }

  const bytes = new Uint8Array(buffer)

  if (type === "favicon") {
    if (matchesSignature(bytes, SIGNATURES.ico)) {
      return { ok: true, mimeType: "image/x-icon", ext: "ico" }
    }
    return { ok: false, error: "Favicon must be a valid .ico file" }
  }

  // type === "logo"
  if (matchesSignature(bytes, SIGNATURES.png)) {
    return { ok: true, mimeType: "image/png", ext: "png" }
  }

  if (matchesSignature(bytes, SIGNATURES.jpg)) {
    return { ok: true, mimeType: "image/jpeg", ext: "jpg" }
  }

  // Check for SVG (text-based, no fixed magic bytes — look for XML/SVG markers)
  const text = buffer.toString("utf8", 0, Math.min(buffer.byteLength, 512))
  if (text.trimStart().startsWith("<") && (text.includes("<svg") || text.includes("<?xml"))) {
    // SVG XSS checks on full content
    const full = buffer.toString("utf8")
    if (full.includes("<script") || full.includes("javascript:") || /on\w+\s*=/i.test(full)) {
      return { ok: false, error: "SVG contains potentially unsafe content" }
    }
    return { ok: true, mimeType: "image/svg+xml", ext: "svg" }
  }

  return { ok: false, error: "Logo must be a PNG, JPEG, or SVG file" }
}
