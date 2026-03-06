import type { BotContext } from '../../types'
import { createImapConfig } from '../../imap/CreateImapConfig'
import { testImapConnection } from '../../imap/TestImapConnection'
import { validateImapHost } from '../../security/ValidateImapHost'
import { he } from '../../utils/htmlEscape'

class HandleAddImapConfig {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const text = (ctx.message as any)?.text ?? ''
    const args = text.split('\n').slice(1)

    if (args.length < 5) {
      await ctx.reply(
        '📡 <b>Tambah Named IMAP Config</b>\n\n' +
        'Format (satu per baris setelah command):\n' +
        '<code>/addimapconfig\n' +
        'NamaConfig\n' +
        'imap.gmail.com\n' +
        '993\n' +
        'username@gmail.com\n' +
        'app_password</code>',
        { parse_mode: 'HTML' }
      )
      return
    }

    const [nameLine, hostLine, portLine, usernameLine, ...passwordParts] = args
    const name = nameLine!.trim()
    const host = hostLine!.trim()
    const password = passwordParts.join('\n').trim()

    if (!validateImapHost.execute(host)) {
      await ctx.reply('❌ Invalid IMAP host. Private/loopback addresses are not allowed.', { parse_mode: 'HTML' })
      return
    }

    const port = parseInt(portLine!.trim(), 10)
    const username = usernameLine!.trim()

    await ctx.reply('🔄 Menguji koneksi IMAP, harap tunggu...', { parse_mode: 'HTML' })

    const testResult = await testImapConnection.execute({
      host,
      port,
      secure: true,
      auth: { user: username, pass: password },
    })

    if (!testResult.ok) {
      await ctx.reply(
        `❌ <b>Koneksi IMAP gagal</b>\n\n` +
        `<code>${he(testResult.error ?? 'Unknown error')}</code>\n\n` +
        `Config tidak disimpan. Periksa host, port, username, dan password.`,
        { parse_mode: 'HTML' }
      )
      return
    }

    await createImapConfig.execute({
      tenantId: tenant.id,
      name,
      imapHost: host,
      imapPort: port,
      useSsl: true,
      username,
      password,
    })

    await ctx.reply(
      `✅ <b>Named IMAP Config Saved</b>\n\n` +
      `📛 Name: <code>${he(name)}</code>\n` +
      `🌐 Host: <code>${he(host)}</code>`,
      { parse_mode: 'HTML' }
    )
  }
}

export const handleAddImapConfig = new HandleAddImapConfig()
