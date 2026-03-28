export interface Role {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Permission {
  id: string
  roleId: string
  resource: string
  action: string
  createdAt: Date
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[]
}

export interface CreateRoleInput {
  name: string
  description?: string
  permissions: Array<{ resource: string; action: string }>
}

export interface UpdateRoleInput {
  name?: string
  description?: string
  permissions?: Array<{ resource: string; action: string }>
}
