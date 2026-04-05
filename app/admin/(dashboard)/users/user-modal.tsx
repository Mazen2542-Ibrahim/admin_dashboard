"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PasswordInput } from "@/components/forms/password-input"
import { toast } from "@/components/ui/use-toast"
import { createUserAction, updateUserAction } from "@/modules/users/actions"
import { createUserSchema, updateUserSchema } from "@/modules/users/schema"
import { Loader2 } from "lucide-react"
import type { User } from "@/modules/users/types"
import { z } from "zod"

interface UserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null
  roles: { id: string; name: string }[]
}

type CreateFormValues = z.infer<typeof createUserSchema>

export function UserModal({ open, onOpenChange, user, roles }: UserModalProps) {
  const isEditing = !!user

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      password: "",
      role: user?.role ?? "user",
    },
  })

  React.useEffect(() => {
    if (user) {
      form.reset({ name: user.name, email: user.email, role: user.role, password: "" })
    } else {
      form.reset({ name: "", email: "", password: "", role: "user" })
    }
  }, [user, form])

  async function onSubmit(values: CreateFormValues) {
    let result
    if (isEditing && user) {
      result = await updateUserAction(user.id, values)
    } else {
      result = await createUserAction(values)
    }

    if ("error" in result && result.error) {
      const msg =
        typeof result.error === "object" && "message" in result.error
          ? result.error.message
          : "An error occurred"
      toast({ title: "Error", description: String(msg), variant: "destructive" })
      return
    }

    toast({
      title: isEditing ? "User updated" : "User created",
      description: isEditing
        ? "The user has been updated."
        : "The new user has been created.",
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit User" : "Create User"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update user information and role."
              : "Add a new user to the system."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Full Name" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={form.watch("role")}
              onValueChange={(v) => form.setValue("role", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.name}>
                    {role.name.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
