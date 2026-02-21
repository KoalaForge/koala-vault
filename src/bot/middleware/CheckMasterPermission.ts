import type { MiddlewareFn } from 'telegraf'
import type { BotContext } from '../../types'
import { config } from '../../config/env'

class CheckMasterPermission {
  execute(): MiddlewareFn<BotContext> {
    return async (ctx, next) => {
      const userId = String(ctx.from?.id ?? '')
      const isMasterOwner = userId === config.masterOwnerTelegramId

      if (!isMasterOwner) {
        await ctx.reply('⛔ Master-level permission required.')
        return
      }

      return next()
    }
  }
}

export const checkMasterPermission = new CheckMasterPermission()
