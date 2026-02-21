import pino from 'pino'
import { config } from './config/env'

class CreateLogger {
  execute(): pino.Logger {
    return pino({
      level: config.logLevel,
      redact: {
        paths: [
          'password', 'passwordEncrypted', 'password_encrypted',
          'botToken', 'bot_token', 'imapEncryptionKey',
          'auth.pass', 'auth.user',
          'telegramWebhookSecret',
        ],
        censor: '[REDACTED]',
      },
      transport: config.nodeEnv === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    })
  }
}

export const logger = new CreateLogger().execute()
