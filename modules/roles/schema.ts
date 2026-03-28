import { z } from "zod"

const permissionSchema = z.object({
  resource: z.string().min(1),
  action: z.enum(["access", "create", "read", "update", "delete"]),
})

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .regex(/^[a-z0-9_]+$/, "Name must be lowercase alphanumeric with underscores"),
  description: z.string().optional(),
  permissions: z.array(permissionSchema).default([]),
})

export const updateRoleSchema = z.object({
  name: z
    .string()
    .min(2)
    .regex(/^[a-z0-9_]+$/)
    .optional(),
  description: z.string().optional(),
  permissions: z.array(permissionSchema).optional(),
})

export const roleIdSchema = z.string().uuid("Invalid role ID")

export type CreateRoleInput = z.infer<typeof createRoleSchema>
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>
