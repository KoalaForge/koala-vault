import type { BotContext } from '../../types'
import { upsertAddressOverride } from '../../imap/UpsertAddressOverride'
import { findImapConfigByName } from '../../imap/FindImapConfigByName'
import { validateImapHost } from '../../security/ValidateImapHost'
import { he } from '../../utils/htmlEscape'

class HandleSetAddressImap {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const text = (ctx.message as any)?.text ?? ''
    const args = text.split('\n').slice(1)

    if (args.length === 2) {
      return this.handleRefMode(ctx, tenant.id, args)
    }

    if (args.length >= 5) {
      return this.handleInlineMode(ctx, tenant.id, args)
    }

    await ctx.reply(
      '📧 <b>Set Per-Address IMAP</b>\n\n' +
      '<b>Mode 1: Named Config (Direkomendasikan)</b>\n' +
      '<code>/setimap\n' +
      'email@example.com\n' +
      'NamaConfig</code>\n\n' +
      '<b>Mode 2: Inline (Legacy)</b>\n' +
      '<code>/setimap\n' +
      'email@example.com\n' +
      'imap.host.com\n' +
      '993\n' +
      'imap_username\n' +
      'imap_password</code>',
      { parse_mode: 'HTML' }
    )
  }

  private async handleRefMode(ctx: BotContext, tenantId: string, args: string[]): Promise<void> {
    const [emailLine, configNameLine] = args
    const emailAddress = emailLine!.trim()
    const configName = configNameLine!.trim()

    const config = await findImapConfigByName.execute(tenantId, configName)
    if (!config) {
      await ctx.reply(
        `❌ Named config <code>${he(configName)}</code> tidak ditemukan.\n\n` +
        `Buat dulu dengan <code>/addimapconfig</code>`,
        { parse_mode: 'HTML' }
      )
      return
    }

    await upsertAddressOverride.execute({
      mode: 'ref',
      tenantId,
      emailAddress,
      imapConfigId: config.id,
    })

    await ctx.reply(
      `✅ <b>IMAP Override Saved</b>\n\n` +
      `📧 Email: <code>${he(emailAddress)}</code>\n` +
      `🔗 Config: <code>${he(configName)}</code> (<code>${he(config.imapHost)}:${config.imapPort}</code>)`,
      { parse_mode: 'HTML' }
    )
  }

  private async handleInlineMode(ctx: BotContext, tenantId: string, args: string[]): Promise<void> {
    const [emailLine, hostLine, portLine, usernameLine, ...passwordParts] = args
    const host = hostLine!.trim()
    const password = passwordParts.join('\n').trim()

    if (!validateImapHost.execute(host)) {
      await ctx.reply('❌ Invalid IMAP host. Private/loopback addresses are not allowed.', { parse_mode: 'HTML' })
      return
    }

    await upsertAddressOverride.execute({
      mode: 'inline',
      tenantId,
      emailAddress: emailLine!.trim(),
      imapHost: host,
      imapPort: parseInt(portLine!.trim(), 10),
      useSsl: true,
      username: usernameLine!.trim(),
      password,
    })

    await ctx.reply(
      `✅ <b>IMAP Config Saved</b>\n\n📧 Email: <code>${he(emailLine!.trim())}</code>`,
      { parse_mode: 'HTML' }
    )
  }
}

export const handleSetAddressImap = new HandleSetAddressImap()
