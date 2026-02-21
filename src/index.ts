import 'dotenv/config'
import type { FastifyInstance } from 'fastify'
import { config } from './config/env'
import { connectDatabase } from './database/connection'
import { createFastifyServer } from './server/CreateFastifyServer'
import { findAllTenants } from './tenant/FindAllTenants'
import { findMasterTenant } from './tenant/FindMasterTenant'
import { createTenant } from './tenant/CreateTenant'
import { botRegistry } from './bot/BotRegistry'
import { registerWebhookRoute } from './server/RegisterWebhookRoute'
import { logger } from './logger'

class Bootstrap {
  async execute(): Promise<void> {
    await connectDatabase.execute()
    logger.info('Database connected')

    const app = await createFastifyServer.execute()

    await this.ensureMasterTenant()
    await this.registerAllTenants(app)

    await app.listen({ port: config.port, host: '0.0.0.0' })
    logger.info({ port: config.port }, '🚀 KoalaVault server started')

    this.setupGracefulShutdown(app)
  }

  private setupGracefulShutdown(app: FastifyInstance): void {
    const shutdown = async (signal: string): Promise<void> => {
      logger.info({ signal }, 'Shutdown signal received, closing server...')
      try {
        await app.close()
        logger.info('Server closed gracefully')
      } catch (err) {
        logger.error({ err }, 'Error during graceful shutdown')
      } finally {
        process.exit(0)
      }
    }

    process.once('SIGTERM', () => shutdown('SIGTERM'))
    process.once('SIGINT', () => shutdown('SIGINT'))
  }

  private async ensureMasterTenant(): Promise<void> {
    const existing = await findMasterTenant.execute()
    if (existing) return

    logger.info('Creating master tenant...')
    await createTenant.execute({
      name: 'Master',
      botToken: config.masterBotToken,
      ownerTelegramId: config.masterOwnerTelegramId,
      isMaster: true,
    })
    logger.info('Master tenant created')
  }

  private async registerAllTenants(app: any): Promise<void> {
    registerWebhookRoute.execute(app)

    const tenants = await findAllTenants.execute()
    logger.info({ count: tenants.length }, 'Registering tenants...')

    await Promise.allSettled(
      tenants.map(tenant =>
        botRegistry.registerTenant(tenant).catch(err =>
          logger.error({ err, tenantId: tenant.id }, 'Failed to register tenant')
        )
      )
    )

    logger.info('All tenants registered')
  }
}

const bootstrap = new Bootstrap()
bootstrap.execute().catch((err) => {
  logger.error({ err }, 'Fatal startup error')
  process.exit(1)
})
