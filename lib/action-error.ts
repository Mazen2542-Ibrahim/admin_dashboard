/**
 * Extracts a safe error message for client display.
 *
 * Service layer errors intended for the user should be thrown with the
 * "ActionError:" prefix (e.g. `throw new Error("ActionError: Email already in use")`).
 * All other errors are logged server-side and replaced with a generic message.
 *
 * Usage in action catch blocks:
 *   return { error: { message: getActionErrorMessage(err) } }
 */
export function getActionErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.startsWith("ActionError:")) {
    return err.message.replace("ActionError:", "").trim()
  }
  console.error("[action]", err)
  return "An unexpected error occurred. Please try again."
}
