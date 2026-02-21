import type { BotContext } from '../../types'
import { assignEmails } from '../../email-assignment/AssignEmails'
import { validateEmail } from '../../validators/ValidateEmail'

const USAGE_MESSAGE =
  '👤 <b>Assign Email ke Pengguna</b>\n\n' +
  'Penggunaan:\n' +
  '<code>/assignemail [user_id] [hari|0] [email1] [email2] ...</code>\n\n' +
  '• <code>hari</code> — durasi akses (angka positif)\n' +
  '• <code>0</code> — tidak ada batas waktu\n\n' +
  'Contoh (30 hari):\n' +
  '<code>/assignemail 123456789 30 user@gmail.com</code>\n\n' +
  'Contoh (selamanya):\n' +
  '<code>/assignemail 123456789 0 user@gmail.com work@gmail.com</code>'

class HandleAssignEmail {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const text: string = String((ctx.message as any)?.text ?? '')
    const parts = text.trim().split(/\s+/)
    const targetUserId = parts[1]
    const rawDays = parts[2]
    const rawEmails = parts.slice(3)

    if (!targetUserId || !/^\d+$/.test(targetUserId) || !rawDays || rawEmails.length === 0) {
      await ctx.reply(USAGE_MESSAGE, { parse_mode: 'HTML' })
      return
    }

    const days = parseInt(rawDays, 10)
    if (isNaN(days) || days < 0) {
      await ctx.reply(
        `❌ Durasi tidak valid: <code>${rawDays}</code>\n` +
        `Gunakan angka positif atau <code>0</code> untuk tanpa batas waktu.`,
        { parse_mode: 'HTML' },
      )
      return
    }

    const validEmails: string[] = []
    const invalidEmails: string[] = []

    for (const raw of rawEmails) {
      const email = validateEmail.execute(raw)
      if (email) {
        validEmails.push(email)
      } else {
        invalidEmails.push(raw)
      }
    }

    if (validEmails.length === 0) {
      await ctx.reply(
        `❌ Tidak ada email valid yang diberikan.`,
        { parse_mode: 'HTML' },
      )
      return
    }

    const daysUntilExpiry = days === 0 ? null : days
    const { assigned } = await assignEmails.execute({
      tenantId: tenant.id,
      telegramUserId: targetUserId,
      emailAddresses: validEmails,
      daysUntilExpiry,
      assignedByTelegramId: String(ctx.from!.id),
    })

    const expiryLabel = daysUntilExpiry
      ? assigned[0]?.expiresAt?.toLocaleDateString('id-ID', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          timeZone: 'Asia/Jakarta',
        }) + ' WIB'
      : 'Tidak ada batas waktu'

    const emailLines = assigned.map(a => `  • <code>${a.emailAddress}</code>`).join('\n')
    const invalidLines = invalidEmails.map(e => `  ❌ <code>${e}</code> <i>(tidak valid)</i>`).join('\n')

    await ctx.reply(
      `✅ <b>Email Berhasil Di-assign</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `👤 User ID: <code>${targetUserId}</code>\n` +
      `⏳ Berlaku: <b>${expiryLabel}</b>\n\n` +
      `${emailLines}` +
      (invalidLines ? `\n\n${invalidLines}` : '') + '\n\n' +
      `─────────────────────\n` +
      `Total assigned: <b>${assigned.length}</b> email`,
      { parse_mode: 'HTML' },
    )

    // Notify user
    try {
      const expiryLine = daysUntilExpiry
        ? `\n⏳ <b>Berlaku hingga:</b> ${expiryLabel}\n`
        : '\n'
      const notifLines = assigned.map(a => `  • <code>${a.emailAddress}</code>`).join('\n')

      await ctx.telegram.sendMessage(
        targetUserId,
        `📧 <b>Email Baru Ditugaskan</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Kamu telah mendapatkan akses ke <b>${assigned.length}</b> email:\n\n` +
        `${notifLines}\n` +
        `${expiryLine}\n` +
        `─────────────────────\n` +
        `💡 <i>Ketik /start untuk mulai menggunakan bot.</i>`,
        { parse_mode: 'HTML' },
      )
    } catch { /* user may have blocked bot */ }
  }
}

export const handleAssignEmail = new HandleAssignEmail()
