import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16).optional(),
  AUTH_SECRET: z.string().min(16).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NODE_ENV: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema> & {
  jwtSigningSecret: string;
};

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }
  const jwtSigningSecret =
    parsed.data.JWT_SECRET ?? parsed.data.AUTH_SECRET ?? "";
  if (jwtSigningSecret.length < 16) {
    throw new Error("JWT_SECRET or AUTH_SECRET must be at least 16 characters");
  }
  cached = { ...parsed.data, jwtSigningSecret };
  return cached;
}
