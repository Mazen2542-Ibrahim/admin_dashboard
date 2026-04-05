import { mkdir, writeFile, unlink } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"

const BRANDING_DIR = join(process.cwd(), "public", "uploads", "branding")

export async function saveFile(buffer: Buffer, ext: string): Promise<string> {
  await mkdir(BRANDING_DIR, { recursive: true })
  const filename = `${randomUUID()}.${ext}`
  await writeFile(join(BRANDING_DIR, filename), buffer)
  return `/uploads/branding/${filename}`
}

export async function deleteFile(url: string): Promise<void> {
  if (!url) return
  // Only handle local /uploads/branding/ paths
  if (!url.startsWith("/uploads/branding/")) return
  const filename = url.replace("/uploads/branding/", "")
  // Prevent path traversal
  if (filename.includes("..") || filename.includes("/")) return
  try {
    await unlink(join(BRANDING_DIR, filename))
  } catch {
    // Silent on missing file
  }
}
