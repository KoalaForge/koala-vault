import type { BotContext, ImapErrorReason } from '../types'
import { findCategoryById } from '../category/FindCategoryById'
import { processEmailSearch } from '../imap/ProcessEmailSearch'
import { updateSessionResults } from '../session/UpdateSessionResults'
import { searchRetryingMessage } from '../messages/SearchRetryingMessage'
import { resultFoundMessage } from '../messages/ResultFoundMessage'
import { resultNotFoundMessage } from '../messages/ResultNotFoundMessage'
import { resultErrorMessage } from '../messages/ResultErrorMessage'
import { buildEmailResultLog } from '../channel-log/BuildEmailResultLog'
import { resolveLogChannel } from '../channel-log/ResolveLogChannel'
import { sendChannelLog } from '../channel-log/SendChannelLog'
import { logger } from '../logger'

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
    const username = ctx.from?.username ?? null

    const category = await findCategoryById.execute(tenant.id, session.selectedCategoryId)
    if (!category) {
      await ctx.editMessageText('⚠️ Kategori tidak lagi tersedia.', { parse_mode: 'HTML' })
      return
    }

    const currentResult = session.results[emailAddress]
    const retryCount = (currentResult?.retryCount ?? 0) + 1

    await ctx.editMessageText(
      searchRetryingMessage.execute(category.name, emailAddress),
      { parse_mode: 'HTML' },
    )

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
      this.dispatchChannelLog(ctx, { categoryName: category.name, emailAddress, username, userId, status: 'found', extractedContent: result.extractedContent, emailTime: result.emailTime })
      return
    }

    if (result.status === 'error') {
      const { text, keyboard } = resultErrorMessage.execute(category.name, emailAddress, retryCount, result.errorReason)
      await ctx.editMessageText(text, { reply_markup: keyboard, parse_mode: 'HTML' })
      this.dispatchChannelLog(ctx, { categoryName: category.name, emailAddress, username, userId, status: 'error', errorReason: result.errorReason })
      return
    }

    const { text, keyboard } = resultNotFoundMessage.execute(category.name, emailAddress, retryCount)
    try {
      await ctx.editMessageText(text, { reply_markup: keyboard, parse_mode: 'HTML' })
    } catch (err: any) {
      if (!err?.message?.includes('message is not modified')) throw err
    }
    this.dispatchChannelLog(ctx, { categoryName: category.name, emailAddress, username, userId, status: 'not_found' })
  }

  private dispatchChannelLog(
    ctx: BotContext,
    params: {
      categoryName: string
      emailAddress: string
      username: string | null
      userId: string
      status: 'found' | 'not_found' | 'error'
      extractedContent?: string | null
      emailTime?: Date | null
      errorReason?: ImapErrorReason | null
    },
  ): void {
    const { tenant } = ctx.tenantContext
    resolveLogChannel.execute(tenant, ctx.telegram).then(target => {
      if (!target) return
      const message = buildEmailResultLog.execute(params)
      return sendChannelLog.execute({ telegram: target.telegram, channelId: target.channelId, message })
    }).catch(err => {
      logger.warn({ err }, 'Channel log dispatch failed')
    })
  }
}

export const handleRetrySearch = new HandleRetrySearch()
