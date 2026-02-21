import type { BotContext } from '../../types'
import { upsertAddressOverride } from '../../imap/UpsertAddressOverride'
import { validateImapHost } from '../../security/ValidateImapHost'

class HandleSetAddressImap {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const text = (ctx.message as any)?.text ?? ''
    const args = text.split('\n').slice(1)

    if (args.length < 5) {
      await ctx.reply(
        '📧 <b>Set Per-Address IMAP</b>\n\n' +
        'Usage (one per line after command):\n' +
        '<code>/setimap\n' +
        'email@example.com\n' +
        'imap.host.com\n' +
        '993\n' +
        'imap_username\n' +
        'imap_password</code>',
        { parse_mode: 'HTML' }
      )
      return
    }

    const [emailLine, hostLine, portLine, usernameLine, ...passwordParts] = args
    const password = passwordParts.join('\n').trim()
    const host = hostLine!.trim()

    if (!validateImapHost.execute(host)) {
      await ctx.reply('❌ Invalid IMAP host. Private/loopback addresses are not allowed.', { parse_mode: 'HTML' })
      return
    }

    await upsertAddressOverride.execute({
      tenantId: tenant.id,
      emailAddress: emailLine!.trim(),
      imapHost: hostLine!.trim(),
      imapPort: parseInt(portLine!.trim(), 10),
      useSsl: true,
      username: usernameLine!.trim(),
      password,
    })

    await ctx.reply(
      `✅ <b>IMAP Config Saved</b>\n\n📧 Email: <code>${emailLine!.trim()}</code>`,
      { parse_mode: 'HTML' }
    )
  }
}

export const handleSetAddressImap = new HandleSetAddressImap()
