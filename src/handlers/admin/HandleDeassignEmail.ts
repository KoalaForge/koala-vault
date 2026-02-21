import type { BotContext } from '../../types'
import { deassignEmail } from '../../email-assignment/DeassignEmail'
import { validateEmail } from '../../validators/ValidateEmail'

class HandleDeassignEmail {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const text: string = String((ctx.message as any)?.text ?? '')
    const parts = text.trim().split(/\s+/)
    const targetUserId = parts[1]
    const rawEmails = parts.slice(2)

    if (!targetUserId || !/^\d+$/.test(targetUserId) || rawEmails.length === 0) {
      await ctx.reply(
        '👤 <b>Cabut Akses Email Pengguna</b>\n\n' +
        'Penggunaan:\n' +
        '<code>/deassignmail [user_id] [email1] [email2] ...</code>\n\n' +
        'Contoh:\n' +
        '<code>/deassignmail 123456789 user@gmail.com</code>',
        { parse_mode: 'HTML' },
      )
      return
    }

    const validEmails: string[] = []
    for (const raw of rawEmails) {
      const email = validateEmail.execute(raw)
      if (email) validEmails.push(email)
    }

    if (validEmails.length === 0) {
      await ctx.reply(`❌ Tidak ada email valid yang diberikan.`, { parse_mode: 'HTML' })
      return
    }

    const { removed, notFound } = await deassignEmail.execute({
      tenantId: tenant.id,
      telegramUserId: targetUserId,
      emailAddresses: validEmails,
    })

    const removedLines = removed.map(e => `  ✅ <code>${e}</code>`).join('\n')
    const notFoundLines = notFound.map(e => `  ⚠️ <code>${e}</code> <i>(tidak ditemukan)</i>`).join('\n')
    const lines = [removedLines, notFoundLines].filter(Boolean).join('\n')

    await ctx.reply(
      `🔓 <b>Hasil Pencabutan Akses</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `👤 User ID: <code>${targetUserId}</code>\n\n` +
      `${lines}`,
      { parse_mode: 'HTML' },
    )

    if (removed.length === 0) return

    // Notify user
    try {
      const notifLines = removed.map(e => `  • <code>${e}</code>`).join('\n')

      await ctx.telegram.sendMessage(
        targetUserId,
        `📧 <b>Akses Email Dicabut</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Aksesmu ke email berikut telah dicabut oleh administrator:\n\n` +
        `${notifLines}\n\n` +
        `─────────────────────\n` +
        `💡 <i>Gunakan /myemails untuk melihat email yang masih aktif.</i>`,
        { parse_mode: 'HTML' },
      )
    } catch { /* user may have blocked bot */ }
  }
}

export const handleDeassignEmail = new HandleDeassignEmail()
