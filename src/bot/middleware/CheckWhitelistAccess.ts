import type { MiddlewareFn } from 'telegraf'
import type { BotContext } from '../../types'
import { config } from '../../config/env'
import { findWhitelistEntry } from '../../user/FindWhitelistEntry'
import { createAccessRequest } from '../../user/CreateAccessRequest'
import { accessRequestSentMessage } from '../../messages/AccessRequestSentMessage'
import { accessDeniedMessage } from '../../messages/AccessDeniedMessage'
import { notifyAdminOfRequest } from '../../user/NotifyAdminOfRequest'

class CheckWhitelistAccess {
  execute(): MiddlewareFn<BotContext> {
    return async (ctx, next) => {
      const { tenant } = ctx.tenantContext
      const userId = String(ctx.from?.id ?? '')

      if (!tenant.whitelistEnabled) return next()
      if (userId === String(tenant.ownerTelegramId)) return next()
      if (userId === config.masterOwnerTelegramId) return next()

      const entry = await findWhitelistEntry.execute(tenant.id, userId)

      if (entry?.status === 'approved') return next()

      if (entry?.status === 'denied') {
        await ctx.reply(accessDeniedMessage.execute(), { parse_mode: 'HTML' })
        return
      }

      await createAccessRequest.execute({
        tenantId: tenant.id,
        telegramUserId: userId,
        telegramUsername: ctx.from?.username ?? null,
        telegramFirstName: ctx.from?.first_name ?? null,
      })

      await ctx.reply(accessRequestSentMessage.execute(), { parse_mode: 'HTML' })
      await notifyAdminOfRequest.execute(ctx, tenant, userId, ctx.from?.username ?? null, ctx.from?.first_name ?? null)
    }
  }
}

export const checkWhitelistAccess = new CheckWhitelistAccess()
