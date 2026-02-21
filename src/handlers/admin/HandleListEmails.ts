import type { BotContext } from '../../types'
import { listRegisteredEmails } from '../../registered-email/ListRegisteredEmails'

class HandleListEmails {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const emails = await listRegisteredEmails.execute(tenant.id)

    if (emails.length === 0) {
      await ctx.reply(
        `📧 <b>Pool Email Global</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Belum ada email di pool.`,
        { parse_mode: 'HTML' },
      )
      return
    }

    const lines = emails.map((e, i) => `${i + 1}. <code>${e.emailAddress}</code>`).join('\n')

    await ctx.reply(
      `📧 <b>Pool Email Global (${emails.length})</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `${lines}`,
      { parse_mode: 'HTML' },
    )
  }
}

export const handleListEmails = new HandleListEmails()
