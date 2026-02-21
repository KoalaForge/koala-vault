import type { MiddlewareFn } from 'telegraf'
import type { BotContext } from '../../types'
import { config } from '../../config/env'

const EXPIRED_MESSAGE =
  '⏰ <b>Layanan Tidak Tersedia</b>\n' +
  '━━━━━━━━━━━━━━━━━━━━━\n\n' +
  'Bot ini tidak dapat memproses permintaan karena masa berlangganan telah berakhir.\n\n' +
  '─────────────────────\n' +
  '💡 <i>Silahkan hubungi admin untuk memperpanjang akses.</i>'

class CheckTenantExpiry {
  execute(): MiddlewareFn<BotContext> {
    return async (ctx, next) => {
      const { tenant } = ctx.tenantContext
      const userId = String(ctx.from?.id ?? '')

      if (tenant.expiresAt === null || tenant.expiresAt >= new Date()) return next()
      if (userId === String(tenant.ownerTelegramId)) return next()
      if (userId === config.masterOwnerTelegramId) return next()

      if (ctx.callbackQuery) {
        await ctx.answerCbQuery('⏰ Masa berlangganan habis. Hubungi admin.', { show_alert: true })
        return
      }

      await ctx.reply(EXPIRED_MESSAGE, { parse_mode: 'HTML' })
    }
  }
}

export const checkTenantExpiry = new CheckTenantExpiry()
