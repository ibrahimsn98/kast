// Fixed, local-only test credentials — never used against a real deployment.
// Not on the login page's weak-credential list, so the weak-credential
// warning branch doesn't fire unless a test explicitly wants it to.
export const E2E_ADMIN = {
  username: "e2e-admin",
  password: "E2e-Test-Pass-2026!",
}
