import { db } from "@/lib/db"
import { emailTemplates } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function getAllTemplates() {
  return db
    .select({
      id: emailTemplates.id,
      name: emailTemplates.name,
      subject: emailTemplates.subject,
      variables: emailTemplates.variables,
      isActive: emailTemplates.isActive,
      createdAt: emailTemplates.createdAt,
      updatedAt: emailTemplates.updatedAt,
    })
    .from(emailTemplates)
}

export async function getTemplateById(id: string) {
  const [template] = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.id, id))
    .limit(1)
  return template ?? null
}

export async function getTemplateByName(name: string) {
  const [template] = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.name, name))
    .limit(1)
  return template ?? null
}

export async function getTemplateCount() {
  const { count } = await import("drizzle-orm")
  const [result] = await db.select({ count: count() }).from(emailTemplates)
  return result?.count ?? 0
}
