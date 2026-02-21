import type { BotContext } from '../types'
import { listUserAssignments } from '../email-assignment/ListUserAssignments'

class HandleMyEmails {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const userId = String(ctx.from!.id)
    const assignments = await listUserAssignments.execute(tenant.id, userId)

    if (assignments.length === 0) {
      await ctx.reply(
        `📋 <b>Email Kamu</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `✅ Kamu punya akses ke semua email yang tersedia.\n\n` +
        `─────────────────────\n` +
        `💡 <i>Masukkan alamat email untuk mulai mencari.</i>`,
        { parse_mode: 'HTML' },
      )
      return
    }

    const lines = assignments.map((a, i) => {
      const expiryLine = a.expiresAt
        ? `   ⏳ Berlaku hingga: ${a.expiresAt.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Jakarta' })} WIB`
        : `   ♾️ Tidak ada batas waktu`
      return `${i + 1}. <code>${a.emailAddress}</code>\n${expiryLine}`
    }).join('\n\n')

    await ctx.reply(
      `📋 <b>Email Kamu (${assignments.length})</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `${lines}\n\n` +
      `─────────────────────\n` +
      `💡 <i>Ketik /start untuk mulai mencari.</i>`,
      { parse_mode: 'HTML' },
    )
  }
}

export const handleMyEmails = new HandleMyEmails()
