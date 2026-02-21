import type { BotContext } from '../../types'
import { resolveAccessRequest } from '../../user/ResolveAccessRequest'
import { upsertWhitelistEntry } from '../../user/UpsertWhitelistEntry'

class HandleDenyUser {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const match = ctx.match as RegExpMatchArray
    const targetUserId = match[1]!
    const adminId = String(ctx.from!.id)

    const resolved = await resolveAccessRequest.execute({
      tenantId: tenant.id,
      telegramUserId: targetUserId,
      status: 'denied',
      resolvedByTelegramId: adminId,
    })

    if (!resolved) {
      await ctx.answerCbQuery('Permintaan sudah diproses sebelumnya.')
      return
    }

    await upsertWhitelistEntry.execute({
      tenantId: tenant.id,
      telegramUserId: targetUserId,
      telegramUsername: resolved.telegramUsername,
      status: 'denied',
      approvedByTelegramId: adminId,
    })

    const displayName = resolved.telegramUsername ? `@${resolved.telegramUsername}` : `User ${targetUserId}`

    await ctx.answerCbQuery('❌ Pengguna ditolak.')
    await ctx.editMessageText(
      `🔔 <b>Permintaan Akses Baru</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `👤 <b>Nama:</b> ${displayName}\n` +
      `🆔 <b>ID:</b> <code>${targetUserId}</code>\n\n` +
      `─────────────────────\n` +
      `❌ <b>Ditolak</b> oleh admin`,
      { parse_mode: 'HTML' }
    )

    try {
      await ctx.telegram.sendMessage(
        targetUserId,
        `❌ <b>Akses Ditolak</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Permintaan aksesmu telah ditolak oleh administrator.\n\n` +
        `💡 <i>Jika ini adalah kesalahan, hubungi administrator secara langsung.</i>`,
        { parse_mode: 'HTML' }
      )
    } catch { /* user may have blocked bot */ }
  }
}

export const handleDenyUser = new HandleDenyUser()
