import type { Telegraf } from 'telegraf'
import type { BotContext, Tenant } from '../types'
import { createBot } from './CreateBot'
import { setBotWebhook } from './SetBotWebhook'
import { registerUserHandlers } from './RegisterUserHandlers'
import { registerAdminHandlers } from './RegisterAdminHandlers'
import { registerMasterHandlers } from './RegisterMasterHandlers'
import { logger } from '../logger'

interface BotEntry {
  bot: Telegraf<BotContext>
  tenant: Tenant
}

class BotRegistry {
  private readonly bots = new Map<string, BotEntry>()
  private readonly botsByToken = new Map<string, Telegraf<BotContext>>()

  async registerTenant(tenant: Tenant): Promise<void> {
    const bot = createBot.execute(tenant.botToken)

    registerUserHandlers.execute(bot, tenant)
    registerAdminHandlers.execute(bot, tenant)

    if (tenant.isMaster) {
      registerMasterHandlers.execute(bot)
    }

    const webhookUrl = await setBotWebhook.execute(bot, tenant.botToken)

    this.bots.set(tenant.id, { bot, tenant })
    this.botsByToken.set(tenant.botToken, bot)

    logger.info({ tenantId: tenant.id, tenantName: tenant.name, webhookUrl }, 'Bot registered')
  }

  getBot(tenantId: string): Telegraf<BotContext> | null {
    return this.bots.get(tenantId)?.bot ?? null
  }

  getBotByToken(token: string): Telegraf<BotContext> | null {
    return this.botsByToken.get(token) ?? null
  }

  updateTenantExpiry(tenantId: string, expiresAt: Date | null): void {
    const entry = this.bots.get(tenantId)
    if (!entry) return
    entry.tenant.expiresAt = expiresAt
    logger.info({ tenantId, expiresAt }, 'Tenant expiry updated in registry')
  }

  deregisterTenant(tenantId: string): void {
    const entry = this.bots.get(tenantId)
    if (!entry) return
    this.botsByToken.delete(entry.tenant.botToken)
    this.bots.delete(tenantId)
    logger.info({ tenantId }, 'Bot deregistered')
  }
}

export const botRegistry = new BotRegistry()
