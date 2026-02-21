import type { BotContext } from '../types'
import { findCategoryById } from '../category/FindCategoryById'
import { processEmailSearch } from '../imap/ProcessEmailSearch'
import { updateSessionResults } from '../session/UpdateSessionResults'
import { resultFoundMessage } from '../messages/ResultFoundMessage'
import { resultNotFoundMessage } from '../messages/ResultNotFoundMessage'

class HandleRetrySearch {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant, session } = ctx.tenantContext

    if (!session || !session.selectedCategoryId) {
      await ctx.answerCbQuery('Session expired. Please use /start.')
      return
    }

    const match = ctx.match as RegExpMatchArray
    const emailAddress = match[1]!
    const userId = String(ctx.from!.id)

    const category = await findCategoryById.execute(tenant.id, session.selectedCategoryId)
    if (!category) {
      await ctx.answerCbQuery('Category no longer available.')
      return
    }

    await ctx.answerCbQuery('🔄 Retrying...')

    const currentResult = session.results[emailAddress]
    const retryCount = (currentResult?.retryCount ?? 0) + 1

    const result = await processEmailSearch.execute(tenant.id, emailAddress, category)

    await updateSessionResults.execute({
      tenantId: tenant.id,
      telegramUserId: userId,
      emailAddress,
      result: {
        status: result.status,
        extractedContent: result.extractedContent,
        errorReason: null,
        searchedAt: new Date().toISOString(),
        retryCount,
      },
    })

    if (result.status === 'found' && result.extractedContent) {
      const { text } = resultFoundMessage.execute(
        category.name,
        emailAddress,
        result.extractedContent,
        result.emailTime,
        result.fetchDurationMs,
      )
      await ctx.editMessageText(text, { parse_mode: 'HTML' })
      return
    }

    const { text, keyboard } = resultNotFoundMessage.execute(category.name, emailAddress)
    await ctx.editMessageText(text, { reply_markup: keyboard, parse_mode: 'HTML' })
  }
}

export const handleRetrySearch = new HandleRetrySearch()
