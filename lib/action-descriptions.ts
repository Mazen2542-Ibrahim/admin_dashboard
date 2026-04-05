type Metadata = Record<string, unknown>

const ACTION_DESCRIPTIONS: Record<string, string | ((m: Metadata) => string)> = {
  "user.signed_in":                        "Signed in successfully",
  "user.registered":                       "Account registered",
  "user.created":                          "User account created",
  "user.updated":                          "User profile updated",
  "user.deleted":                          "User deactivated",
  "user.hard_deleted":                     "User permanently deleted",
  "user.deactivated":                      "User account deactivated",
  "user.password_changed":                 "Password changed",
  "user.password_reset_requested":         "Password reset requested",
  "user.password_reset_email_sent":        (m) => `Password reset email sent to ${m.email ?? "user"}`,
  "user.session_revoked":                  "Session revoked by admin",
  "user.sessions_revoked_all":             "All sessions revoked",
  "user.email_change_requested":           (m) => `Email change requested to ${m.newEmail ?? "new address"}`,
  "user.verification_email_sent":          "Verification email sent",
  "user.verification_email_sent_by_admin": "Verification email sent by admin",
  "user.account_locked":                   "Account locked due to failed login attempts",
  "user.account_unlocked":                 "Account unlocked",
  "user.login_failed": (m) => {
    const reasons: Record<string, string> = {
      invalid_password:    "Failed login attempt: incorrect password",
      account_deactivated: "Failed login attempt: account is deactivated",
      account_locked:      "Failed login attempt: account is locked",
      rate_limited:        "Failed login attempt: too many requests",
    }
    return reasons[m.reason as string] ?? "Failed login attempt"
  },
  "role.created":            "Role created",
  "role.updated":            "Role updated",
  "role.deleted":            "Role deleted",
  "smtp.updated":            "SMTP configuration updated",
  "email_template.created":  "Email template created",
  "email_template.updated":  "Email template updated",
  "email_template.deleted":  "Email template deleted",
  "settings.updated":        "Application settings updated",
  "audit_logs.purged":       (m) => `Audit logs purged (${m.deletedCount ?? 0} entries, ${m.retentionDays ?? "?"}-day retention)`,
}

export function describeAction(action: string, metadata?: Metadata): string {
  const entry = ACTION_DESCRIPTIONS[action]
  if (!entry) return action
  return typeof entry === "function" ? entry(metadata ?? {}) : entry
}
