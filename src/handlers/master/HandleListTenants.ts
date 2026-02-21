import type { BotContext, Tenant } from '../../types'
import { findAllTenants } from '../../tenant/FindAllTenants'

function formatExpiryLine(tenant: Tenant): string {
  if (!tenant.expiresAt) return '♾️ Tidak ada batas waktu'

  const label = tenant.expiresAt.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })

  if (tenant.expiresAt < new Date()) return `⚠️ EXPIRED ${label} WIB`
  return `⏳ Berlaku hingga: ${label} WIB`
}

class HandleListTenants {
  async execute(ctx: BotContext): Promise<void> {
    const tenants = await findAllTenants.execute()

    if (tenants.length === 0) {
      await ctx.reply('📭 No tenants found.')
      return
    }

    const list = tenants.map((t, i) =>
      `${i + 1}. <b>${t.name}</b> ${t.isMaster ? '👑' : ''}\n` +
      `   ID: <code>${t.id}</code>\n` +
      `   Owner: <code>${t.ownerTelegramId}</code>\n` +
      `   Whitelist: ${t.whitelistEnabled ? '🔒 On' : '🔓 Off'}\n` +
      `   Status: ${t.isActive ? '✅ Active' : '❌ Inactive'}\n` +
      `   ${formatExpiryLine(t)}`
    ).join('\n\n')

    await ctx.reply(`🏢 <b>Tenants (${tenants.length})</b>\n\n${list}`, { parse_mode: 'HTML' })
  }
}

export const handleListTenants = new HandleListTenants()
