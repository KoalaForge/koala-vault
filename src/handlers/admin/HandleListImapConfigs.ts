import type { BotContext } from '../../types'
import { listImapConfigs } from '../../imap/ListImapConfigs'
import { he } from '../../utils/htmlEscape'

class HandleListImapConfigs {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const { namedConfigs, providerDefaults, addressOverrides } = await listImapConfigs.execute(tenant.id)

    const namedText = namedConfigs.length === 0
      ? `  <i>Belum ada named config</i>`
      : namedConfigs.map(c =>
          `  • <b>${he(c.name)}</b>${c.isDefault ? ' ⭐' : ''}\n` +
          `    Host: <code>${he(c.imapHost)}:${c.imapPort}</code>\n` +
          `    User: <code>${he(c.username)}</code>`
        ).join('\n\n')

    const defaultsText = providerDefaults.length === 0
      ? `  <i>Belum dikonfigurasi</i>`
      : providerDefaults.map(d =>
          `  • <b>${he(d.provider)}</b>\n` +
          `    Host: <code>${he(d.imapHost)}:${d.imapPort}</code>\n` +
          `    User: <code>${he(d.username)}</code>`
        ).join('\n\n')

    const overridesText = addressOverrides.length === 0
      ? `  <i>Belum dikonfigurasi</i>`
      : addressOverrides.map(o =>
          o.imapConfigId
            ? `  • <code>${he(o.emailAddress)}</code> → 🔗 Config ID: <code>${he(o.imapConfigId)}</code>`
            : `  • <code>${he(o.emailAddress)}</code>\n` +
              `    Host: <code>${he(o.imapHost ?? '')}:${o.imapPort ?? ''}</code>`
        ).join('\n\n')

    await ctx.reply(
      `📡 <b>Konfigurasi IMAP</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `<b>Named Configs:</b>\n${namedText}\n\n` +
      `─────────────────────\n\n` +
      `<b>Provider Default (Legacy):</b>\n${defaultsText}\n\n` +
      `─────────────────────\n\n` +
      `<b>Override Per Alamat:</b>\n${overridesText}`,
      { parse_mode: 'HTML' }
    )
  }
}

export const handleListImapConfigs = new HandleListImapConfigs()
