import type { BotContext } from '../../types'
import { createTenant } from '../../tenant/CreateTenant'
import { botRegistry } from '../../bot/BotRegistry'
import { validateBotToken } from '../../security/ValidateBotToken'

function formatWIB(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
}

class HandleAddTenant {
  async execute(ctx: BotContext): Promise<void> {
    const text = (ctx.message as any)?.text ?? ''
    const args = text.split('\n').slice(1)

    if (args.length < 3) {
      await ctx.reply(
        '🏢 <b>Add Tenant</b>\n\n' +
        'Usage (one per line after command):\n' +
        '<code>/addtenant\n' +
        'Tenant Name\n' +
        'BOT_TOKEN\n' +
        'OWNER_TELEGRAM_ID\n' +
        'DURASI_HARI (opsional)</code>\n\n' +
        'Contoh (30 hari):\n' +
        '<code>/addtenant\n' +
        'Netflix Store\n' +
        '123456789:AAF_token\n' +
        '987654321\n' +
        '30</code>\n\n' +
        '💡 <i>Tanpa durasi → tenant aktif tanpa batas waktu.</i>',
        { parse_mode: 'HTML' }
      )
      return
    }

    const [nameLine, tokenLine, ownerLine, daysLine] = args
    const name = nameLine!.trim()
    const botToken = tokenLine!.trim()
    const ownerTelegramId = ownerLine!.trim()
    const durationDays = daysLine ? parseInt(daysLine.trim(), 10) : undefined

    if (daysLine && (isNaN(durationDays!) || durationDays! <= 0)) {
      await ctx.reply('❌ Durasi tidak valid. Harus berupa bilangan bulat positif (contoh: 30).', { parse_mode: 'HTML' })
      return
    }

    const botInfo = await validateBotToken.execute(botToken)
    if (!botInfo) {
      await ctx.reply('❌ Invalid bot token. Please check the token from @BotFather and try again.')
      return
    }

    const tenant = await createTenant.execute({ name, botToken, ownerTelegramId, durationDays })
    await botRegistry.registerTenant(tenant)

    const expiryLine = tenant.expiresAt
      ? `📅 Berlaku hingga: <b>${formatWIB(tenant.expiresAt)}</b>\n`
      : `📅 Durasi: <i>Tanpa batas waktu</i>\n`

    await ctx.reply(
      `✅ <b>Tenant Created</b>\n\n` +
      `🏢 Name: ${tenant.name}\n` +
      `🆔 ID: <code>${tenant.id}</code>\n` +
      `👤 Owner: <code>${ownerTelegramId}</code>\n` +
      `${expiryLine}\n` +
      `Bot is now active and webhook is set!`,
      { parse_mode: 'HTML' }
    )
  }
}

export const handleAddTenant = new HandleAddTenant()
