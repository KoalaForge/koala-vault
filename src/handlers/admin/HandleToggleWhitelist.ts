import type { BotContext } from '../../types'
import { updateTenant } from '../../tenant/UpdateTenant'

class HandleToggleWhitelist {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const newState = !tenant.whitelistEnabled

    await updateTenant.execute({ id: tenant.id, whitelistEnabled: newState })

    const statusLabel = newState
      ? `🔒 <b>Whitelist Diaktifkan</b>`
      : `🔓 <b>Whitelist Dinonaktifkan</b>`

    const description = newState
      ? `Semua pengguna baru harus disetujui admin sebelum bisa menggunakan bot.`
      : `Semua pengguna dapat menggunakan bot tanpa perlu persetujuan admin.`

    await ctx.reply(
      `✅ Pengaturan berhasil diperbarui\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `${statusLabel}\n\n` +
      `${description}`,
      { parse_mode: 'HTML' },
    )
  }
}

export const handleToggleWhitelist = new HandleToggleWhitelist()
