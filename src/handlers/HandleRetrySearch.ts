import type { BotContext } from '../types'
import { findCategoryById } from '../category/FindCategoryById'
import { processEmailSearch } from '../imap/ProcessEmailSearch'
import { updateSessionResults } from '../session/UpdateSessionResults'
import { resultFoundMessage } from '../messages/ResultFoundMessage'
import { resultNotFoundMessage } from '../messages/ResultNotFoundMessage'

class HandleRetrySearch {
  async execute(ctx: BotContext): Promise<void> {
    // Must answer callback query immediately — Telegram expires it after ~10s
    try { await ctx.answerCbQuery() } catch { /* already expired, continue */ }

    const { tenant, session } = ctx.tenantContext

    if (!session || !session.selectedCategoryId) {
      await ctx.editMessageText('⚠️ Session telah berakhir. Gunakan /start untuk memulai ulang.', { parse_mode: 'HTML' })
      return
    }

    const match = ctx.match as RegExpMatchArray
    const emailAddress = match[1]!
    const userId = String(ctx.from!.id)

    const category = await findCategoryById.execute(tenant.id, session.selectedCategoryId)
    if (!category) {
      await ctx.editMessageText('⚠️ Kategori tidak lagi tersedia.', { parse_mode: 'HTML' })
      return
    }

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
