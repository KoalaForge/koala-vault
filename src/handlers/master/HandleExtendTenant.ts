import type { BotContext } from '../../types'
import { extendTenantExpiry } from '../../tenant/ExtendTenantExpiry'
import { botRegistry } from '../../bot/BotRegistry'

function formatWIB(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
}

class HandleExtendTenant {
  async execute(ctx: BotContext): Promise<void> {
    const text = (ctx.message as any)?.text ?? ''
    const lines = text.split('\n').slice(1)

    if (lines.length < 2) {
      await ctx.reply(
        '⏳ <b>Extend Tenant</b>\n\n' +
        'Usage (one per line after command):\n' +
        '<code>/extenttenant\n' +
        'TENANT_ID\n' +
        'DAYS</code>\n\n' +
        '💡 <i>Gunakan /listtenant untuk mendapatkan TENANT_ID</i>',
        { parse_mode: 'HTML' }
      )
      return
    }

    const tenantId = lines[0]!.trim()
    const daysRaw = lines[1]!.trim()
    const days = parseInt(daysRaw, 10)

    if (!tenantId || isNaN(days) || days <= 0) {
      await ctx.reply(
        '❌ Argumen tidak valid.\n\n' +
        'TENANT_ID harus berupa ID valid dan DAYS harus bilangan bulat positif.',
        { parse_mode: 'HTML' }
      )
      return
    }

    try {
      const { newExpiresAt } = await extendTenantExpiry.execute({ tenantId, days })
      botRegistry.updateTenantExpiry(tenantId, newExpiresAt)

      await ctx.reply(
        `✅ <b>Masa Berlangganan Diperpanjang</b>\n\n` +
        `🆔 Tenant: <code>${tenantId}</code>\n` +
        `➕ Ditambah: ${days} hari\n` +
        `📅 Berlaku hingga: <b>${formatWIB(newExpiresAt)} WIB</b>`,
        { parse_mode: 'HTML' }
      )
    } catch {
      await ctx.reply(
        `❌ Tenant tidak ditemukan atau tidak aktif.\n\n` +
        `Pastikan ID tenant benar dengan /listtenant`,
        { parse_mode: 'HTML' }
      )
    }
  }
}

export const handleExtendTenant = new HandleExtendTenant()
