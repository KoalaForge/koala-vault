import { Telegraf } from 'telegraf'
import { logger } from '../logger'

interface BotInfo {
  id: number
  username: string
  firstName: string
}

class ValidateBotToken {
  async execute(botToken: string): Promise<BotInfo | null> {
    try {
      const bot = new Telegraf(botToken)
      const me = await bot.telegram.getMe()
      return {
        id: me.id,
        username: me.username ?? '',
        firstName: me.first_name,
      }
    } catch (err) {
      logger.warn({ err }, 'Bot token validation failed')
      return null
    }
  }
}

export const validateBotToken = new ValidateBotToken()
