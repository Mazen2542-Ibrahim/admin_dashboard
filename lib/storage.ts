import { randomUUID } from "crypto"

// ── Production: Vercel Blob ───────────────────────────────────────────────────

async function saveFileBlob(buffer: Buffer, ext: string): Promise<string> {
  const { put } = await import("@vercel/blob")
  const filename = `branding/${randomUUID()}.${ext}`
  const { url } = await put(filename, buffer, { access: "public" })
  return url
}

async function deleteFileBlob(url: string): Promise<void> {
  if (!url) return
  try {
    const { del } = await import("@vercel/blob")
    await del(url)
  } catch {
    // Silent on missing file
  }
}

// ── Development: local filesystem ────────────────────────────────────────────

async function saveFileLocal(buffer: Buffer, ext: string): Promise<string> {
  const { mkdir, writeFile } = await import("fs/promises")
  const { join } = await import("path")
  const dir = join(process.cwd(), "public", "uploads", "branding")
  await mkdir(dir, { recursive: true })
  const filename = `${randomUUID()}.${ext}`
  await writeFile(join(dir, filename), buffer)
  return `/uploads/branding/${filename}`
}

async function deleteFileLocal(url: string): Promise<void> {
  if (!url) return
  if (!url.startsWith("/uploads/branding/")) return
  const filename = url.replace("/uploads/branding/", "")
  if (filename.includes("..") || filename.includes("/")) return
  try {
    const { unlink } = await import("fs/promises")
    const { join } = await import("path")
    await unlink(join(process.cwd(), "public", "uploads", "branding", filename))
  } catch {
    // Silent on missing file
  }
}

// ── Exports ───────────────────────────────────────────────────────────────────

const isProd = process.env.NODE_ENV === "production"

export async function saveFile(buffer: Buffer, ext: string): Promise<string> {
  return isProd ? saveFileBlob(buffer, ext) : saveFileLocal(buffer, ext)
}

export async function deleteFile(url: string): Promise<void> {
  return isProd ? deleteFileBlob(url) : deleteFileLocal(url)
}
