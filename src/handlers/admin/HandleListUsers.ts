import type { BotContext } from '../../types'
import { listWhitelistEntries } from '../../user/ListWhitelistEntries'
import { getPendingRequests } from '../../user/GetPendingRequests'

class HandleListUsers {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const [entries, pending] = await Promise.all([
      listWhitelistEntries.execute(tenant.id),
      getPendingRequests.execute(tenant.id),
    ])

    const approved = entries.filter(e => e.status === 'approved')
    const denied = entries.filter(e => e.status === 'denied')

    const fmt = (entries: Array<{ telegramUsername: string | null; telegramUserId: string }>) =>
      entries.length === 0
        ? `  <i>Tidak ada</i>`
        : entries.map(e =>
            `  • ${e.telegramUsername ? `@${e.telegramUsername}` : `<code>${e.telegramUserId}</code>`}`
          ).join('\n')

    const fmtPending = (entries: Array<{ telegramUsername: string | null; telegramUserId: string }>) =>
      entries.length === 0
        ? `  <i>Tidak ada</i>`
        : entries.map(p =>
            `  • ${p.telegramUsername ? `@${p.telegramUsername}` : 'Tanpa username'}  <code>${p.telegramUserId}</code>`
          ).join('\n')

    await ctx.reply(
      `👥 <b>Manajemen Pengguna</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `✅ <b>Disetujui (${approved.length})</b>\n` +
      `${fmt(approved)}\n\n` +
      `─────────────────────\n\n` +
      `⏳ <b>Menunggu (${pending.length})</b>\n` +
      `${fmtPending(pending)}\n\n` +
      `─────────────────────\n\n` +
      `❌ <b>Ditolak (${denied.length})</b>\n` +
      `${fmt(denied)}`,
      { parse_mode: 'HTML' }
    )
  }
}

export const handleListUsers = new HandleListUsers()
