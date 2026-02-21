import type { BotContext } from '../../types'
import { WhitelistModel } from '../../database/models/WhitelistModel'

class HandleRemoveFromWhitelist {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const text = (ctx.message as any)?.text ?? ''
    const targetUserId = text.split(' ')[1]?.trim()

    if (!targetUserId || !/^\d+$/.test(targetUserId)) {
      await ctx.reply(
        `⚠️ <b>Format Salah</b>\n\n` +
        `Penggunaan: <code>/unwhitelist &lt;telegram_user_id&gt;</code>\n\n` +
        `💡 <i>Contoh: /unwhitelist 123456789</i>`,
        { parse_mode: 'HTML' },
      )
      return
    }

    if (targetUserId === tenant.ownerTelegramId) {
      await ctx.reply(
        `❌ <b>Tidak Dapat Dihapus</b>\n\n` +
        `Pengguna ini adalah pemilik tenant dan tidak dapat dihapus dari whitelist.`,
        { parse_mode: 'HTML' },
      )
      return
    }

    await WhitelistModel.findOneAndUpdate(
      { tenantId: tenant.id, telegramUserId: targetUserId },
      { $set: { status: 'denied', resolvedAt: new Date() } }
    )

    await ctx.reply(
      `✅ <b>Pengguna Dihapus</b>\n\n` +
      `Pengguna <code>${targetUserId}</code> telah dihapus dari whitelist.`,
      { parse_mode: 'HTML' },
    )
  }
}

export const handleRemoveFromWhitelist = new HandleRemoveFromWhitelist()
