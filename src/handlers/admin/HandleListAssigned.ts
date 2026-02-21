import type { BotContext } from '../../types'
import { listUserAssignments } from '../../email-assignment/ListUserAssignments'

class HandleListAssigned {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const text: string = String((ctx.message as any)?.text ?? '')
    const targetUserId = text.trim().split(/\s+/)[1]

    if (!targetUserId || !/^\d+$/.test(targetUserId)) {
      await ctx.reply(
        '📋 <b>Lihat Assignment Email Pengguna</b>\n\n' +
        'Penggunaan:\n<code>/listassigned [telegram_user_id]</code>\n\n' +
        'Contoh:\n<code>/listassigned 123456789</code>',
        { parse_mode: 'HTML' },
      )
      return
    }

    const assignments = await listUserAssignments.execute(tenant.id, targetUserId)

    if (assignments.length === 0) {
      await ctx.reply(
        `📋 <b>Assignment Email</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `👤 User ID: <code>${targetUserId}</code>\n\n` +
        `Tidak ada assignment. Pengguna ini menggunakan pool global.`,
        { parse_mode: 'HTML' },
      )
      return
    }

    const lines = assignments.map((a, i) => {
      const expiryLine = a.expiresAt
        ? `   ⏳ ${a.expiresAt.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Jakarta' })} WIB`
        : `   ♾️ Tidak ada batas waktu`
      return `${i + 1}. <code>${a.emailAddress}</code>\n${expiryLine}`
    }).join('\n\n')

    await ctx.reply(
      `📋 <b>Assignment Email (${assignments.length})</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `👤 User ID: <code>${targetUserId}</code>\n\n` +
      `${lines}`,
      { parse_mode: 'HTML' },
    )
  }
}

export const handleListAssigned = new HandleListAssigned()
