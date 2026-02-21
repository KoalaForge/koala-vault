import type { BotContext } from '../types'
import { config } from '../config/env'
import { extractEmails } from '../validators/ExtractEmails'
import { findActiveCategories } from '../category/FindActiveCategories'
import { findCategoriesForUser } from '../category/FindCategoriesForUser'
import { updateSessionState } from '../session/UpdateSessionState'
import { upsertSession } from '../session/UpsertSession'
import { categorySelectionMessage } from '../messages/CategorySelectionMessage'
import { filterRegisteredEmails } from '../registered-email/FilterRegisteredEmails'

class HandleEmailInput {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant, session } = ctx.tenantContext
    const userId = String(ctx.from!.id)
    const text: string = String((ctx.message as any)?.text ?? '')

    if (text.startsWith('/')) return

    const allowedStates = ['AWAITING_EMAILS', 'RESULTS_SHOWN', 'COMPLETED']
    const currentState = session?.state ?? 'AWAITING_EMAILS'

    if (!allowedStates.includes(currentState)) return

    const emails = extractEmails.execute(text)
    if (emails.length === 0) return

    const { allowed, rejected } = await filterRegisteredEmails.execute(tenant.id, userId, emails)

    if (rejected.length > 0) {
      const rejectedList = rejected.map(e => `• <code>${e}</code>`).join('\n')
      await ctx.reply(
        `❌ <b>Email Tidak Terdaftar</b>\n\n` +
        `${rejectedList}\n\n` +
        `<i>Hanya email yang telah didaftarkan admin yang dapat dicari. Hubungi admin untuk mendaftarkan email kamu.</i>`,
        { parse_mode: 'HTML' },
      )
    }

    if (allowed.length === 0) return

    const activeSession = session ?? await upsertSession.execute(tenant.id, userId)
    const existingEmails = activeSession.emailAddresses
    const newEntries = allowed.filter(a => !existingEmails.some(e => e.emailAddress === a.emailAddress))
    const allEmails = [...existingEmails, ...newEntries]

    const isPrivileged = userId === String(tenant.ownerTelegramId) || userId === config.masterOwnerTelegramId
    const categories = isPrivileged
      ? await findActiveCategories.execute(tenant.id)
      : await findCategoriesForUser.execute(tenant.id, userId)
    if (categories.length === 0) {
      await ctx.reply(
        `⚠️ <b>Kategori Belum Dikonfigurasi</b>\n\n` +
        `Administrator belum menambahkan kategori pencarian.\n` +
        `Hubungi administrator untuk melanjutkan.`,
        { parse_mode: 'HTML' },
      )
      return
    }

    await updateSessionState.execute({
      tenantId: tenant.id,
      telegramUserId: userId,
      state: 'AWAITING_CATEGORY',
      emailAddresses: allEmails,
    })

    const { text: msgText, keyboard } = categorySelectionMessage.execute(
      allEmails.map(e => e.emailAddress),
      categories,
    )
    await ctx.reply(msgText, { reply_markup: keyboard, parse_mode: 'HTML' })
  }
}

export const handleEmailInput = new HandleEmailInput()
