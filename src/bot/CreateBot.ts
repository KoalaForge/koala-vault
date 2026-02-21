import { Telegraf } from 'telegraf'
import type { BotContext } from '../types'
import { config } from '../config/env'

class CreateBot {
  execute(botToken: string): Telegraf<BotContext> {
    return new Telegraf<BotContext>(botToken, {
      telegram: {
        webhookReply: true,
        apiRoot: 'https://api.telegram.org',
      },
      handlerTimeout: 90_000,
    })
  }
}

export const createBot = new CreateBot()
