import type { Telegraf } from 'telegraf'
import type { BotContext } from '../types'
import { config } from '../config/env'
import { logger } from '../logger'

class SetBotWebhook {
  async execute(bot: Telegraf<BotContext>, botToken: string): Promise<string> {
    const webhookUrl = `${config.webhookBaseUrl}/webhook/${config.webhookPathSecret}/${botToken}`

    await bot.telegram.setWebhook(webhookUrl, {
      secret_token: config.telegramWebhookSecret,
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: true,
    })

    logger.info({ webhookUrl }, 'Webhook set successfully')
    return webhookUrl
  }
}

export const setBotWebhook = new SetBotWebhook()
