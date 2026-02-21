import { AccessRequestModel } from '../database/models/AccessRequestModel'
import type { BotContext, Tenant } from '../types'
import { adminAccessRequestMessage } from '../messages/AdminAccessRequestMessage'
import { logger } from '../logger'

class NotifyAdminOfRequest {
  async execute(
    ctx: BotContext,
    tenant: Tenant,
    userId: string,
    username: string | null,
    firstName: string | null,
  ): Promise<void> {
    const { text, keyboard } = adminAccessRequestMessage.execute(userId, username, firstName)

    try {
      const sent = await ctx.telegram.sendMessage(
        tenant.ownerTelegramId,
        text,
        { reply_markup: keyboard, parse_mode: 'HTML' }
      )

      await AccessRequestModel.findOneAndUpdate(
        { tenantId: tenant.id, telegramUserId: userId, status: 'pending' },
        { $set: { adminMessageId: sent.message_id } }
      )
    } catch (error) {
      logger.error({ err: error, tenantId: tenant.id, userId }, 'Failed to notify admin')
    }
  }
}

export const notifyAdminOfRequest = new NotifyAdminOfRequest()
