import type { BotContext } from '../../types'
import { createTenant } from '../../tenant/CreateTenant'
import { botRegistry } from '../../bot/BotRegistry'
import { validateBotToken } from '../../security/ValidateBotToken'

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
        'OWNER_TELEGRAM_ID</code>',
        { parse_mode: 'HTML' }
      )
      return
    }

    const [nameLine, tokenLine, ownerLine] = args
    const name = nameLine!.trim()
    const botToken = tokenLine!.trim()
    const ownerTelegramId = ownerLine!.trim()

    const botInfo = await validateBotToken.execute(botToken)
    if (!botInfo) {
      await ctx.reply('❌ Invalid bot token. Please check the token from @BotFather and try again.')
      return
    }

    const tenant = await createTenant.execute({ name, botToken, ownerTelegramId })
    await botRegistry.registerTenant(tenant)

    await ctx.reply(
      `✅ <b>Tenant Created</b>\n\n` +
      `🏢 Name: ${tenant.name}\n` +
      `🆔 ID: <code>${tenant.id}</code>\n` +
      `👤 Owner: <code>${ownerTelegramId}</code>\n\n` +
      `Bot is now active and webhook is set!`,
      { parse_mode: 'HTML' }
    )
  }
}

export const handleAddTenant = new HandleAddTenant()
