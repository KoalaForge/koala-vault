import type { BotContext } from '../../types'
import { upsertAddressOverride } from '../../imap/UpsertAddressOverride'
import { he } from '../../utils/htmlEscape'

const GMAIL_IMAP_HOST = 'imap.gmail.com'
const GMAIL_IMAP_PORT = 993

class HandleSetAddressImapGmail {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const text = (ctx.message as any)?.text ?? ''
    const args = text.split('\n').slice(1)

    if (args.length < 3) {
      await ctx.reply(
        '📧 <b>Set Gmail IMAP (Shortcut)</b>\n\n' +
        'Format (satu per baris setelah command):\n' +
        '<code>/setimapgmail\n' +
        'email@example.com\n' +
        'username@gmail.com\n' +
        'app_password_here</code>\n\n' +
        'Host otomatis: <code>imap.gmail.com:993</code>',
        { parse_mode: 'HTML' }
      )
      return
    }

    const [emailLine, usernameLine, ...passwordParts] = args
    const emailAddress = emailLine!.trim()
    const username = usernameLine!.trim()
    const password = passwordParts.join('\n').trim()

    await upsertAddressOverride.execute({
      mode: 'inline',
      tenantId: tenant.id,
      emailAddress,
      imapHost: GMAIL_IMAP_HOST,
      imapPort: GMAIL_IMAP_PORT,
      useSsl: true,
      username,
      password,
    })

    await ctx.reply(
      `✅ <b>Gmail IMAP Config Saved</b>\n\n` +
      `📧 Email: <code>${he(emailAddress)}</code>\n` +
      `🌐 Host: <code>${GMAIL_IMAP_HOST}:${GMAIL_IMAP_PORT}</code>\n` +
      `👤 User: <code>${he(username)}</code>`,
      { parse_mode: 'HTML' }
    )
  }
}

export const handleSetAddressImapGmail = new HandleSetAddressImapGmail()
