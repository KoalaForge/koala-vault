import type { FastifyInstance } from 'fastify'
import { timingSafeEqual } from 'crypto'
import { config } from '../config/env'
import { botRegistry } from '../bot/BotRegistry'
import { logger } from '../logger'

class RegisterWebhookRoute {
  execute(app: FastifyInstance): void {
    const path = `/webhook/${config.webhookPathSecret}/:botToken`

    app.post(path, {
      config: { rateLimit: { max: 200, timeWindow: '1 minute' } },
    }, async (req, reply) => {
      const isValid = this.validateWebhookSecret(req.headers['x-telegram-bot-api-secret-token'])
      if (!isValid) {
        logger.warn({ path }, 'Invalid webhook secret token')
        return reply.status(401).send({ error: 'Unauthorized' })
      }

      const { botToken } = req.params as { botToken: string }
      const bot = botRegistry.getBotByToken(botToken)

      if (!bot) {
        logger.warn({ botToken }, 'Received update for unknown bot token')
        return reply.status(404).send({ error: 'Not found' })
      }

      await bot.handleUpdate(req.body as any)
      return reply.status(200).send({ ok: true })
    })

    logger.info({ path }, 'Wildcard webhook route registered')
  }

  private validateWebhookSecret(headerValue: unknown): boolean {
    if (typeof headerValue !== 'string') return false
    const expected = Buffer.from(config.telegramWebhookSecret)
    const received = Buffer.from(headerValue)
    if (expected.length !== received.length) return false
    return timingSafeEqual(expected, received)
  }
}

export const registerWebhookRoute = new RegisterWebhookRoute()
