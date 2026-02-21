import Fastify from 'fastify'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import type { FastifyInstance } from 'fastify'
import { config } from '../config/env'
import { logger } from '../logger'

class CreateFastifyServer {
  async execute(): Promise<FastifyInstance> {
    const app = Fastify({
      logger: false,
      trustProxy: true,
      forceCloseConnections: true,
    })

    await app.register(helmet, { global: true })
    await app.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
      keyGenerator: (req) => {
        const userId = req.headers['x-telegram-user-id'] as string
        return userId ?? req.ip
      },
    })

    app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

    app.addHook('onError', async (_req, _reply, error) => {
      logger.error({ err: error }, 'Unhandled server error')
    })

    return app
  }
}

export const createFastifyServer = new CreateFastifyServer()
