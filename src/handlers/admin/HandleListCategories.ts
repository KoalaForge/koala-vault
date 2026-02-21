import type { BotContext } from '../../types'
import { findActiveCategories } from '../../category/FindActiveCategories'

class HandleListCategories {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const categories = await findActiveCategories.execute(tenant.id)

    if (categories.length === 0) {
      await ctx.reply(
        `📋 <b>Daftar Kategori</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Belum ada kategori yang dikonfigurasi.`,
        { parse_mode: 'HTML' },
      )
      return
    }

    const list = categories.map((cat, i) => {
      const badges = [
        cat.isGlobal ? '🌐' : '',
        cat.isDefault ? '📌 DEFAULT' : '',
      ].filter(Boolean).join(' ')
      return (
        `<b>${i + 1}. ${cat.name}</b>${badges ? ` ${badges}` : ''}\n` +
        `🆔 <code>${cat.id}</code>\n` +
        `🔑 Kata kunci: ${cat.subjectKeywords.map(k => `<code>${k}</code>`).join(' · ')}\n` +
        `🔍 Regex: <code>${cat.extractionRegex}</code>`
      )
    }).join('\n\n─────────────────────\n\n')

    await ctx.reply(
      `📋 <b>Daftar Kategori (${categories.length})</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `${list}`,
      { parse_mode: 'HTML' },
    )
  }
}

export const handleListCategories = new HandleListCategories()
