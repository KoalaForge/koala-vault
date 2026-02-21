import 'dotenv/config'
import { z } from 'zod'
import type { AppConfig } from '../types'

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  WEBHOOK_BASE_URL: z.string().url(),
  WEBHOOK_PATH_SECRET: z.string().min(16),
  DATABASE_URL: z.string().startsWith('mongodb'),
  IMAP_ENCRYPTION_KEY: z.string().length(64),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(16),
  MASTER_BOT_TOKEN: z.string().min(10),
  MASTER_OWNER_TELEGRAM_ID: z.string().regex(/^\d+$/),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
})

class ParseEnv {
  execute(): AppConfig {
    const parsed = EnvSchema.safeParse(process.env)
    if (!parsed.success) {
      console.error('❌ Invalid environment variables:', parsed.error.flatten())
      process.exit(1)
    }
    const env = parsed.data
    return {
      nodeEnv: env.NODE_ENV,
      port: env.PORT,
      webhookBaseUrl: env.WEBHOOK_BASE_URL,
      webhookPathSecret: env.WEBHOOK_PATH_SECRET,
      databaseUrl: env.DATABASE_URL,
      imapEncryptionKey: env.IMAP_ENCRYPTION_KEY,
      telegramWebhookSecret: env.TELEGRAM_WEBHOOK_SECRET,
      masterBotToken: env.MASTER_BOT_TOKEN,
      masterOwnerTelegramId: env.MASTER_OWNER_TELEGRAM_ID,
      logLevel: env.LOG_LEVEL,
    }
  }
}

export const config = new ParseEnv().execute()
