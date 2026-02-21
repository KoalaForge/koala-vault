import type { BotContext } from '../../types'
import { removeRegisteredEmail } from '../../registered-email/RemoveRegisteredEmail'
import { validateEmail } from '../../validators/ValidateEmail'

class HandleRemoveEmail {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const text: string = String((ctx.message as any)?.text ?? '')
    const rawEmail = text.trim().split(/\s+/)[1]

    if (!rawEmail) {
      await ctx.reply(
        '📧 <b>Hapus Email dari Pool</b>\n\n' +
        'Penggunaan:\n<code>/removemail [email]</code>\n\n' +
        'Contoh:\n<code>/removemail user@gmail.com</code>',
        { parse_mode: 'HTML' },
      )
      return
    }

    const emailAddress = validateEmail.execute(rawEmail)
    if (!emailAddress) {
      await ctx.reply(`❌ Alamat email tidak valid: <code>${rawEmail}</code>`, { parse_mode: 'HTML' })
      return
    }

    const removed = await removeRegisteredEmail.execute({ tenantId: tenant.id, emailAddress })

    if (!removed) {
      await ctx.reply(
        `⚠️ Email <code>${emailAddress}</code> tidak ditemukan di pool.`,
        { parse_mode: 'HTML' },
      )
      return
    }

    await ctx.reply(
      `✅ <b>Email Dihapus dari Pool</b>\n\n` +
      `📧 <code>${emailAddress}</code>`,
      { parse_mode: 'HTML' },
    )
  }
}

export const handleRemoveEmail = new HandleRemoveEmail()
