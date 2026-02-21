import type { BotContext } from '../../types'
import { listImapConfigs } from '../../imap/ListImapConfigs'

class HandleListImapConfigs {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const { providerDefaults, addressOverrides } = await listImapConfigs.execute(tenant.id)

    const defaultsText = providerDefaults.length === 0
      ? `  <i>Belum dikonfigurasi</i>`
      : providerDefaults.map(d =>
          `  • <b>${d.provider}</b>\n` +
          `    Host: <code>${d.imapHost}:${d.imapPort}</code>\n` +
          `    User: <code>${d.username}</code>`
        ).join('\n\n')

    const overridesText = addressOverrides.length === 0
      ? `  <i>Belum dikonfigurasi</i>`
      : addressOverrides.map(o =>
          `  • <code>${o.emailAddress}</code>\n` +
          `    Host: <code>${o.imapHost}:${o.imapPort}</code>`
        ).join('\n\n')

    await ctx.reply(
      `📡 <b>Konfigurasi IMAP</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `<b>Provider Default:</b>\n${defaultsText}\n\n` +
      `─────────────────────\n\n` +
      `<b>Override Per Alamat:</b>\n${overridesText}`,
      { parse_mode: 'HTML' }
    )
  }
}

export const handleListImapConfigs = new HandleListImapConfigs()
