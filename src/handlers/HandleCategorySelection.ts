import type { BotContext } from '../types'
import { findCategoryById } from '../category/FindCategoryById'
import { updateSessionState } from '../session/UpdateSessionState'
import { updateSessionResults } from '../session/UpdateSessionResults'
import { processEmailSearch } from '../imap/ProcessEmailSearch'
import { searchInitiatedMessage } from '../messages/SearchInitiatedMessage'
import { resultFoundMessage } from '../messages/ResultFoundMessage'
import { resultNotFoundMessage } from '../messages/ResultNotFoundMessage'
import { processingCompleteMessage } from '../messages/ProcessingCompleteMessage'

class HandleCategorySelection {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant, session } = ctx.tenantContext
    if (!session || session.state !== 'AWAITING_CATEGORY') {
      await ctx.answerCbQuery('Sesi berakhir. Ketik /start untuk memulai kembali.')
      return
    }

    const match = (ctx.match as RegExpMatchArray)
    const categoryId = match[1]!
    const userId = String(ctx.from!.id)

    const category = await findCategoryById.execute(tenant.id, categoryId)
    if (!category) {
      await ctx.answerCbQuery('Kategori tidak ditemukan.')
      return
    }

    const emailStrings = session.emailAddresses.map(e => e.emailAddress)

    await ctx.answerCbQuery()
    await ctx.editMessageText(
      searchInitiatedMessage.execute(category.name, emailStrings),
      { parse_mode: 'HTML' }
    )

    await updateSessionState.execute({
      tenantId: tenant.id,
      telegramUserId: userId,
      state: 'SEARCHING',
      selectedCategoryId: categoryId,
    })

    const results = await Promise.all(
      session.emailAddresses.map(entry =>
        processEmailSearch.execute(tenant.id, entry.emailAddress, category, entry.provider)
      )
    )

    await Promise.all(
      results.map(result => this.sendResult(ctx, category.name, result, tenant.id, userId))
    )

    const successCount = results.filter(r => r.status === 'found').length
    await ctx.reply(
      processingCompleteMessage.execute(successCount, results.length),
      { parse_mode: 'HTML' }
    )

    await updateSessionState.execute({
      tenantId: tenant.id,
      telegramUserId: userId,
      state: 'COMPLETED',
    })
  }

  private async sendResult(
    ctx: BotContext,
    categoryName: string,
    result: { emailAddress: string; status: string; extractedContent: string | null; emailTime: Date | null; fetchDurationMs: number },
    tenantId: string,
    userId: string,
  ): Promise<void> {
    await updateSessionResults.execute({
      tenantId,
      telegramUserId: userId,
      emailAddress: result.emailAddress,
      result: {
        status: result.status as any,
        extractedContent: result.extractedContent,
        errorReason: null,
        searchedAt: new Date().toISOString(),
        retryCount: 0,
      },
    })

    if (result.status === 'found' && result.extractedContent) {
      const { text } = resultFoundMessage.execute(
        categoryName,
        result.emailAddress,
        result.extractedContent,
        result.emailTime,
        result.fetchDurationMs,
      )
      await ctx.reply(text, { parse_mode: 'HTML' })
      return
    }

    const { text, keyboard } = resultNotFoundMessage.execute(categoryName, result.emailAddress)
    await ctx.reply(text, { reply_markup: keyboard, parse_mode: 'HTML' })
  }
}

export const handleCategorySelection = new HandleCategorySelection()
