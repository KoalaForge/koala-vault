import type { MiddlewareFn } from 'telegraf'
import type { BotContext } from '../../types'
import { config } from '../../config/env'

class CheckAdminPermission {
  execute(): MiddlewareFn<BotContext> {
    return async (ctx, next) => {
      const { tenant } = ctx.tenantContext
      const userId = String(ctx.from?.id ?? '')
      const isOwner = userId === String(tenant.ownerTelegramId) || userId === config.masterOwnerTelegramId

      if (!isOwner) {
        await ctx.reply('⛔ You do not have permission to use this command.')
        return
      }

      return next()
    }
  }
}

export const checkAdminPermission = new CheckAdminPermission()
