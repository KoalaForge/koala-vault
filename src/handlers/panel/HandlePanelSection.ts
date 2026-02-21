import type { BotContext } from '../../types'
import { panelSectionMessage } from '../../messages/PanelSectionMessage'

const MASTER_SECTIONS = new Set(['cat', 'ten'])

class HandlePanelSection {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const section = (ctx.match as RegExpMatchArray)[1]!

    if (MASTER_SECTIONS.has(section) && !tenant.isMaster) {
      await ctx.answerCbQuery('⛔ Hanya master yang bisa mengakses menu ini.')
      return
    }

    await ctx.answerCbQuery()
    const { text, keyboard } = panelSectionMessage.execute(section)
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard })
  }
}

export const handlePanelSection = new HandlePanelSection()
