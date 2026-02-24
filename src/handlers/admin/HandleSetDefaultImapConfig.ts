import type { BotContext } from '../../types'
import { setDefaultImapConfig } from '../../imap/SetDefaultImapConfig'
import { he } from '../../utils/htmlEscape'

class HandleSetDefaultImapConfig {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const text = (ctx.message as any)?.text ?? ''
    const parts = text.trim().split(/\s+/)
    const name = parts.slice(1).join(' ').trim()

    if (!name) {
      await ctx.reply(
        '📡 <b>Set Default Named IMAP Config</b>\n\n' +
        'Usage: <code>/setdefaultimap NamaConfig</code>',
        { parse_mode: 'HTML' }
      )
      return
    }

    try {
      await setDefaultImapConfig.execute(tenant.id, name)
      await ctx.reply(
        `✅ <b>Default IMAP Config diset ke:</b> <code>${he(name)}</code>\n\n` +
        `Config ini akan digunakan untuk semua email yang tidak punya override spesifik.`,
        { parse_mode: 'HTML' }
      )
    } catch {
      await ctx.reply(`❌ Config <code>${he(name)}</code> tidak ditemukan.`, { parse_mode: 'HTML' })
    }
  }
}

export const handleSetDefaultImapConfig = new HandleSetDefaultImapConfig()
