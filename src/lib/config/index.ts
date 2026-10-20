// App configuration
export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "Self Aura Management",
  version: process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0",
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "https://self-aura-backend.onrender.com/api",
} as const;

export type AppConfig = typeof appConfig;