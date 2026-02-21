import type { BotContext } from '../../types'
import type { ImapProvider } from '../../types'
import { upsertProviderDefault } from '../../imap/UpsertProviderDefault'
import { validateImapHost } from '../../security/ValidateImapHost'

const VALID_PROVIDERS: ImapProvider[] = ['gmail']

class HandleSetProviderImap {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const text = (ctx.message as any)?.text ?? ''
    const args = text.split('\n').slice(1)

    if (args.length < 5) {
      await ctx.reply(
        '🌐 <b>Set Provider Default IMAP</b>\n\n' +
        'Usage (one per line after command):\n' +
        '<code>/setprovider\n' +
        'gmail\n' +
        'imap.gmail.com\n' +
        '993\n' +
        'your@gmail.com\n' +
        'app_password</code>\n\n' +
        `Provider tersedia: ${VALID_PROVIDERS.map(p => `<code>${p}</code>`).join(', ')}`,
        { parse_mode: 'HTML' }
      )
      return
    }

    const [providerLine, hostLine, portLine, usernameLine, ...passwordParts] = args
    const provider = providerLine!.trim().toLowerCase() as ImapProvider
    const password = passwordParts.join('\n').trim()

    if (!VALID_PROVIDERS.includes(provider)) {
      await ctx.reply(`❌ Provider tidak valid. Tersedia: ${VALID_PROVIDERS.map(p => `<code>${p}</code>`).join(', ')}`, { parse_mode: 'HTML' })
      return
    }

    const host = hostLine!.trim()
    if (!validateImapHost.execute(host)) {
      await ctx.reply('❌ Invalid IMAP host. Private/loopback addresses are not allowed.', { parse_mode: 'HTML' })
      return
    }

    await upsertProviderDefault.execute({
      tenantId: tenant.id,
      provider,
      imapHost: host,
      imapPort: parseInt(portLine!.trim(), 10),
      useSsl: true,
      username: usernameLine!.trim(),
      password,
    })

    await ctx.reply(
      `✅ <b>Provider Default Saved</b>\n\n🌐 Provider: <code>${provider}</code>`,
      { parse_mode: 'HTML' }
    )
  }
}

export const handleSetProviderImap = new HandleSetProviderImap()
