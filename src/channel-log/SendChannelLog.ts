import type { Telegram } from 'telegraf'
import { logger } from '../logger'

interface SendChannelLogInput {
  telegram: Telegram
  channelId: string
  message: string
}

class SendChannelLog {
  async execute(input: SendChannelLogInput): Promise<void> {
    try {
      await input.telegram.sendMessage(input.channelId, input.message)
    } catch (err) {
      logger.warn({ err, channelId: input.channelId }, 'Failed to send log to channel')
    }
  }
}

export const sendChannelLog = new SendChannelLog()
