import type { BotContext } from '../../types'
import { updateTenant } from '../../tenant/UpdateTenant'
import { botRegistry } from '../../bot/BotRegistry'

class HandleDeactivateTenant {
  async execute(ctx: BotContext): Promise<void> {
    const text = (ctx.message as any)?.text ?? ''
    const tenantId = text.split(' ')[1]?.trim()

    if (!tenantId) {
      await ctx.reply('Usage: /deactivatetenant <tenant_id>')
      return
    }

    await updateTenant.execute({ id: tenantId, isActive: false })
    botRegistry.deregisterTenant(tenantId)

    await ctx.reply(`✅ Tenant <code>${tenantId}</code> deactivated.`, { parse_mode: 'HTML' })
  }
}

export const handleDeactivateTenant = new HandleDeactivateTenant()
