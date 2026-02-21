import type { BotContext } from '../types'
import { upsertSession } from '../session/UpsertSession'
import { welcomeMessage } from '../messages/WelcomeMessage'

class StartCommand {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const userId = String(ctx.from!.id)

    await upsertSession.execute(tenant.id, userId)
    await ctx.reply(welcomeMessage.execute(tenant.name), { parse_mode: 'HTML' })
  }
}

export const startCommand = new StartCommand()
