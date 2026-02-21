import type { BotContext } from '../../types'
import { addRegisteredEmail } from '../../registered-email/AddRegisteredEmail'
import { validateEmail } from '../../validators/ValidateEmail'

const USAGE_MESSAGE =
  '📧 <b>Tambah Email ke Pool Global</b>\n\n' +
  'Penggunaan:\n' +
  '<code>/addemail [email1] [email2] ...</code>\n\n' +
  '💡 <i>Email yang ditambahkan ke pool global dapat digunakan oleh semua pengguna ' +
  'yang belum memiliki assignment spesifik.</i>\n\n' +
  'Contoh:\n' +
  '<code>/addemail user@gmail.com work@gmail.com</code>'

class HandleAddEmail {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const text: string = String((ctx.message as any)?.text ?? '')
    const rawEmails = text.trim().split(/\s+/).slice(1)

    if (rawEmails.length === 0) {
      await ctx.reply(USAGE_MESSAGE, { parse_mode: 'HTML' })
      return
    }

    const addedByTelegramId = String(ctx.from!.id)
    const results: Array<{ raw: string; email: string | null; ok: boolean }> = []

    for (const raw of rawEmails) {
      const email = validateEmail.execute(raw)
      if (!email) {
        results.push({ raw, email: null, ok: false })
        continue
      }

      await addRegisteredEmail.execute({
        tenantId: tenant.id,
        emailAddress: email,
        provider: 'gmail',
        addedByTelegramId,
      })

      results.push({ raw, email, ok: true })
    }

    const successCount = results.filter(r => r.ok).length
    const failCount = results.filter(r => !r.ok).length

    const lines = results.map(r =>
      r.ok
        ? `  ✅ <code>${r.email}</code>`
        : `  ❌ <code>${r.raw}</code> <i>(email tidak valid)</i>`
    ).join('\n')

    const summary = failCount === 0
      ? `✅ Semua <b>${successCount}</b> email ditambahkan ke pool`
      : `✅ <b>${successCount}</b> ditambahkan  ·  ❌ <b>${failCount}</b> tidak valid`

    await ctx.reply(
      `📧 <b>Hasil Penambahan Email</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `${lines}\n\n` +
      `─────────────────────\n` +
      `${summary}`,
      { parse_mode: 'HTML' },
    )
  }
}

export const handleAddEmail = new HandleAddEmail()
