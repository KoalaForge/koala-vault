import type { BotContext } from '../../types'
import { findTenantById } from '../../tenant/FindTenantById'
import { updateTenant } from '../../tenant/UpdateTenant'

class HandleSetTenantLog {
  async execute(ctx: BotContext): Promise<void> {
    const text = (ctx.message as any)?.text ?? ''
    const args = text.trim().split(/\s+/)
    const tenantId = args[1]?.trim()
    const channelId = args[2]?.trim() ?? null

    if (!tenantId) {
      await ctx.reply(
        '📢 <b>Set Tenant Log Channel</b>\n\nUsage:\n' +
        '<code>/settenantlog [tenantId] [channelId]</code>\n\n' +
        'Kosongkan channelId untuk menonaktifkan:\n' +
        '<code>/settenantlog [tenantId]</code>',
        { parse_mode: 'HTML' }
      )
      return
    }

    const tenant = await findTenantById.execute(tenantId)
    if (!tenant) {
      await ctx.reply('❌ Tenant tidak ditemukan.', { parse_mode: 'HTML' })
      return
    }

    await updateTenant.execute({ id: tenantId, logChannelId: channelId })

    const status = channelId ? `<code>${channelId}</code>` : '<i>dinonaktifkan</i>'
    await ctx.reply(
      `✅ <b>Log channel tenant diperbarui</b>\n\n🏢 Tenant: ${tenant.name}\n📢 Channel: ${status}`,
      { parse_mode: 'HTML' }
    )
  }
}

export const handleSetTenantLog = new HandleSetTenantLog()
