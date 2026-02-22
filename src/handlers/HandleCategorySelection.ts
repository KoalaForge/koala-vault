import type { BotContext, ImapErrorReason } from '../types'
import { findCategoryById } from '../category/FindCategoryById'
import { updateSessionState } from '../session/UpdateSessionState'
import { updateSessionResults } from '../session/UpdateSessionResults'
import { upsertSession } from '../session/UpsertSession'
import { processBatchEmailSearch } from '../imap/ProcessBatchEmailSearch'
import { searchInitiatedMessage } from '../messages/SearchInitiatedMessage'
import { resultFoundMessage } from '../messages/ResultFoundMessage'
import { resultNotFoundMessage } from '../messages/ResultNotFoundMessage'
import { resultErrorMessage } from '../messages/ResultErrorMessage'
import { processingCompleteMessage } from '../messages/ProcessingCompleteMessage'
import { buildEmailResultLog } from '../channel-log/BuildEmailResultLog'
import { resolveLogChannel } from '../channel-log/ResolveLogChannel'
import { sendChannelLog } from '../channel-log/SendChannelLog'
import { logger } from '../logger'

class HandleCategorySelection {
  async execute(ctx: BotContext): Promise<void> {
    // Answer immediately — Telegram expires callback query IDs after ~10s
    try { await ctx.answerCbQuery() } catch { /* already expired, continue */ }

    const { tenant, session } = ctx.tenantContext
    if (!session || session.state !== 'AWAITING_CATEGORY') {
      await ctx.editMessageText('⚠️ Sesi berakhir. Ketik /start untuk memulai kembali.', { parse_mode: 'HTML' })
      return
    }

    const match = (ctx.match as RegExpMatchArray)
    const categoryId = match[1]!
    const userId = String(ctx.from!.id)
    const username = ctx.from?.username ?? null

    const category = await findCategoryById.execute(tenant.id, categoryId)
    if (!category) {
      await ctx.editMessageText('⚠️ Kategori tidak ditemukan.', { parse_mode: 'HTML' })
      return
    }

    const emailStrings = session.emailAddresses.map(e => e.emailAddress)

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

    try {
      const results = await processBatchEmailSearch.execute(tenant.id, session.emailAddresses, category)

      await Promise.all(
        results.map(result => this.sendResult(ctx, category.name, result, tenant.id, userId, username))
      )

      const successCount = results.filter(r => r.status === 'found').length
      await ctx.reply(
        processingCompleteMessage.execute(successCount, results.length),
        { parse_mode: 'HTML' }
      )

      await upsertSession.execute(tenant.id, userId)
    } catch (err) {
      logger.error({ err, tenantId: tenant.id, userId }, 'Search flow failed unexpectedly')
      await ctx.reply(
        `⚠️ <b>Pencarian gagal</b>\n\nTerjadi kesalahan tak terduga. Ketik /start untuk mencoba kembali.`,
        { parse_mode: 'HTML' },
      )
    }
  }

  private async sendResult(
    ctx: BotContext,
    categoryName: string,
    result: { emailAddress: string; status: string; extractedContent: string | null; emailSubject: string | null; emailTime: Date | null; fetchDurationMs: number; errorReason?: ImapErrorReason },
    tenantId: string,
    userId: string,
    username: string | null,
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
      this.dispatchChannelLog(ctx, { categoryName, emailAddress: result.emailAddress, username, userId, status: 'found', emailSubject: result.emailSubject, emailTime: result.emailTime })
      return
    }

    if (result.status === 'error') {
      const { text, keyboard } = resultErrorMessage.execute(categoryName, result.emailAddress, 0, result.errorReason)
      await ctx.reply(text, { reply_markup: keyboard, parse_mode: 'HTML' })
      this.dispatchChannelLog(ctx, { categoryName, emailAddress: result.emailAddress, username, userId, status: 'error', emailSubject: null, errorReason: result.errorReason })
      return
    }

    const { text, keyboard } = resultNotFoundMessage.execute(categoryName, result.emailAddress)
    await ctx.reply(text, { reply_markup: keyboard, parse_mode: 'HTML' })
    this.dispatchChannelLog(ctx, { categoryName, emailAddress: result.emailAddress, username, userId, status: 'not_found', emailSubject: null })
  }

  private dispatchChannelLog(
    ctx: BotContext,
    params: {
      categoryName: string
      emailAddress: string
      username: string | null
      userId: string
      status: 'found' | 'not_found' | 'error'
      emailSubject: string | null
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

export const handleCategorySelection = new HandleCategorySelection()
