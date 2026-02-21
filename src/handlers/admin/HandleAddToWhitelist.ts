import type { BotContext } from '../../types'
import { upsertWhitelistEntry } from '../../user/UpsertWhitelistEntry'

class HandleAddToWhitelist {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const text = (ctx.message as any)?.text ?? ''
    const targetUserId = text.split(' ')[1]?.trim()

    if (!targetUserId || !/^\d+$/.test(targetUserId)) {
      await ctx.reply(
        `⚠️ <b>Format Salah</b>\n\n` +
        `Penggunaan: <code>/whitelist &lt;telegram_user_id&gt;</code>\n\n` +
        `💡 <i>Contoh: /whitelist 123456789</i>`,
        { parse_mode: 'HTML' },
      )
      return
    }

    await upsertWhitelistEntry.execute({
      tenantId: tenant.id,
      telegramUserId: targetUserId,
      telegramUsername: null,
      status: 'approved',
      approvedByTelegramId: String(ctx.from!.id),
    })

    await ctx.reply(
      `✅ <b>Pengguna Ditambahkan</b>\n\n` +
      `Pengguna <code>${targetUserId}</code> telah ditambahkan ke whitelist.`,
      { parse_mode: 'HTML' },
    )
  }
}

export const handleAddToWhitelist = new HandleAddToWhitelist()
