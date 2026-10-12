// App configuration
export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "Self Aura Management",
  version: process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0",
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api",
} as const;

export type AppConfig = typeof appConfig;