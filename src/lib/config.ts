/** Which required environment variables are still missing, if any. */
export function missingEnv(): string[] {
  const required = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "APP_PASSCODE",
    "AUTH_SECRET",
  ];
  return required.filter((key) => !process.env[key]);
}
