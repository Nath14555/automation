import { z } from 'zod';

const required = (key: string) => z.string().min(1, `${key} is required`);
const optional = z.string().optional();
const url = (key: string) => z.string().url(`${key} must be a valid URL`);

const envSchema = z.object({
  // Runtime
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  TZ: z.string().default('America/Toronto'),

  // Anthropic
  ANTHROPIC_API_KEY: required('ANTHROPIC_API_KEY'),
  ANTHROPIC_MODEL_PRIMARY: z.string().default('claude-opus-4-7'),
  ANTHROPIC_MODEL_FAST: z.string().default('claude-haiku-4-5-20251001'),

  // OpenAI (embeddings)
  OPENAI_API_KEY: required('OPENAI_API_KEY'),
  OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),

  // n8n
  N8N_HOST: required('N8N_HOST'),
  N8N_PROTOCOL: z.enum(['http', 'https']).default('https'),
  N8N_PORT: z.coerce.number().int().positive().default(5678),
  N8N_ENCRYPTION_KEY: required('N8N_ENCRYPTION_KEY'),
  N8N_BASIC_AUTH_USER: required('N8N_BASIC_AUTH_USER'),
  N8N_BASIC_AUTH_PASSWORD: required('N8N_BASIC_AUTH_PASSWORD'),

  // Postgres
  POSTGRES_HOST: z.string().default('postgres'),
  POSTGRES_PORT: z.coerce.number().int().positive().default(5432),
  POSTGRES_DB: required('POSTGRES_DB'),
  POSTGRES_USER: required('POSTGRES_USER'),
  POSTGRES_PASSWORD: required('POSTGRES_PASSWORD'),

  // Redis
  REDIS_HOST: z.string().default('redis'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: required('REDIS_PASSWORD'),

  // Qdrant
  QDRANT_HOST: z.string().default('qdrant'),
  QDRANT_PORT: z.coerce.number().int().positive().default(6333),
  QDRANT_API_KEY: optional,
  QDRANT_COLLECTION: z.string().default('louna_knowledge'),

  // Brevo
  BREVO_API_KEY: optional,
  BREVO_SENDER_EMAIL: z.string().email().optional(),
  BREVO_SENDER_NAME: z.string().default('Louna&Co'),

  // HubSpot
  HUBSPOT_PRIVATE_APP_TOKEN: optional,
  HUBSPOT_PORTAL_ID: optional,

  // ManyChat
  MANYCHAT_API_TOKEN: optional,
  MANYCHAT_PAGE_ID: optional,

  // Blotato
  BLOTATO_API_TOKEN: optional,
  BLOTATO_WORKSPACE_ID: optional,

  // Meta
  META_APP_ID: optional,
  META_APP_SECRET: optional,
  META_PAGE_ACCESS_TOKEN: optional,
  META_INSTAGRAM_BUSINESS_ID: optional,
  META_WEBHOOK_VERIFY_TOKEN: optional,

  // Google
  GOOGLE_SERVICE_ACCOUNT_JSON: optional,
  GA4_PROPERTY_ID: optional,
  GOOGLE_CALENDAR_ID: optional,

  // WordPress
  WORDPRESS_BASE_URL: url('WORDPRESS_BASE_URL').optional(),
  WORDPRESS_API_USER: optional,
  WORDPRESS_API_APP_PASSWORD: optional,

  // Image gen
  IMAGE_GEN_PROVIDER: z.enum(['dalle', 'flux']).default('dalle'),
  IMAGE_GEN_API_KEY: optional,

  // Webhook security
  WEBHOOK_HMAC_SECRET: optional,

  // Notifications
  NTFY_TOPIC: optional,
  NTFY_SERVER_URL: url('NTFY_SERVER_URL').default('https://ntfy.sh'),

  // Backups
  BACKUP_S3_ENDPOINT: optional,
  BACKUP_S3_BUCKET: optional,
  BACKUP_S3_ACCESS_KEY: optional,
  BACKUP_S3_SECRET_KEY: optional,
  BACKUP_ENCRYPTION_KEY: optional,
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/**
 * Validates and returns the typed environment configuration.
 * Throws a formatted error listing every missing/invalid variable.
 * Memoized — call as many times as you like; parsing happens once.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  if (cached) return cached;

  const result = envSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = result.data;
  return cached;
}

/** Test-only helper to reset the memoized env. */
export function resetEnvCache(): void {
  cached = undefined;
}
