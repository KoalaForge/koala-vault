import type { BotContext } from '../../types'
import { panelHomeMessage } from '../../messages/PanelHomeMessage'

class HandlePanel {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const name = ctx.from?.first_name ?? 'Admin'
    const { text, keyboard } = panelHomeMessage.execute(name, tenant.isMaster, tenant.name)

    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard })
  }
}

export const handlePanel = new HandlePanel()
