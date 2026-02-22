import type { BotContext } from '../../types'
import { updateTenant } from '../../tenant/UpdateTenant'

class HandleSetLogChannel {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const text = (ctx.message as any)?.text ?? ''
    const args = text.trim().split(/\s+/)
    const channelId = args[1]?.trim() ?? null

    if (!channelId) {
      await updateTenant.execute({ id: tenant.id, logChannelId: null })
      await ctx.reply('✅ Log channel dinonaktifkan.', { parse_mode: 'HTML' })
      return
    }

    if (!channelId.startsWith('-') && !channelId.startsWith('@')) {
      await ctx.reply(
        '❌ Channel ID tidak valid.\n\nGunakan:\n' +
        '• ID numerik (contoh: <code>-1001234567890</code>)\n' +
        '• Username (contoh: <code>@mychannel</code>)',
        { parse_mode: 'HTML' }
      )
      return
    }

    await updateTenant.execute({ id: tenant.id, logChannelId: channelId })
    await ctx.reply(
      `✅ <b>Log channel berhasil disimpan</b>\n\n📢 Channel: <code>${channelId}</code>`,
      { parse_mode: 'HTML' }
    )
  }
}

export const handleSetLogChannel = new HandleSetLogChannel()
