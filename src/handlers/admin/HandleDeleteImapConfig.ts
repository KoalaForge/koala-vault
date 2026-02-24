import type { BotContext } from '../../types'
import { deleteImapConfig } from '../../imap/DeleteImapConfig'
import { he } from '../../utils/htmlEscape'

class HandleDeleteImapConfig {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const text = (ctx.message as any)?.text ?? ''
    const parts = text.trim().split(/\s+/)
    const name = parts.slice(1).join(' ').trim()

    if (!name) {
      await ctx.reply(
        '📡 <b>Hapus Named IMAP Config</b>\n\n' +
        'Usage: <code>/delimapconfig NamaConfig</code>',
        { parse_mode: 'HTML' }
      )
      return
    }

    const deleted = await deleteImapConfig.execute(tenant.id, name)

    if (!deleted) {
      await ctx.reply(`❌ Config <code>${he(name)}</code> tidak ditemukan.`, { parse_mode: 'HTML' })
      return
    }

    await ctx.reply(`✅ Config <code>${he(name)}</code> berhasil dihapus.`, { parse_mode: 'HTML' })
  }
}

export const handleDeleteImapConfig = new HandleDeleteImapConfig()
