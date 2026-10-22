export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { authConfig } = await import("./lib/accounts/auth-config");
    authConfig();
  }
}
