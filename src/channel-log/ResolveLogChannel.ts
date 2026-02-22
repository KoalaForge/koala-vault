import type { Telegram } from 'telegraf'
import type { Tenant } from '../types'
import { findMasterTenant } from '../tenant/FindMasterTenant'
import { botRegistry } from '../bot/BotRegistry'

export interface LogChannelTarget {
  channelId: string
  telegram: Telegram
}

class ResolveLogChannel {
  async execute(tenant: Tenant, ctxTelegram: Telegram): Promise<LogChannelTarget | null> {
    if (tenant.logChannelId) {
      return { channelId: tenant.logChannelId, telegram: ctxTelegram }
    }

    const masterTenant = await findMasterTenant.execute()
    if (!masterTenant?.logChannelId) return null

    const masterBot = botRegistry.getBot(masterTenant.id)
    if (!masterBot) return null

    return { channelId: masterTenant.logChannelId, telegram: masterBot.telegram }
  }
}

export const resolveLogChannel = new ResolveLogChannel()
