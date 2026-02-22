import type { BotContext } from '../../types'
import { findActiveCategories } from '../../category/FindActiveCategories'
import { he } from '../../utils/htmlEscape'

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

    const list = tenant.isMaster
      ? categories.map((cat, i) => {
          const badges = [
            cat.isGlobal ? '🌐' : '',
            cat.isDefault ? '📌 DEFAULT' : '',
          ].filter(Boolean).join(' ')
          return (
            `<b>${i + 1}. ${he(cat.name)}</b>${badges ? ` ${badges}` : ''}\n` +
            `🏷️ <code>${cat.slug}</code>\n` +
            `🔑 Kata kunci: ${cat.subjectKeywords.map(k => `<code>${he(k)}</code>`).join(' · ')}\n` +
            cat.extractionRegexList.map((r, j) =>
              `${j === 0 ? '🔍 Primary' : `⬇️ Fallback ${j}`}: <code>${he(r)}</code>`
            ).join('\n')
          )
        }).join('\n\n─────────────────────\n\n')
      : categories.map((cat, i) => {
          const isDefaultForTenant = cat.isDefault || cat.defaultForTenants.includes(tenant.id)
          const badges = [
            cat.isGlobal ? '🌐 Global' : '',
            isDefaultForTenant ? '📌 DEFAULT' : '',
          ].filter(Boolean).join(' · ')
          return (
            `<b>${i + 1}. ${he(cat.name)}</b>${badges ? `  <i>${badges}</i>` : ''}\n` +
            `🏷️ <code>${cat.slug}</code>`
          )
        }).join('\n\n')

    await ctx.reply(
      `📋 <b>Daftar Kategori (${categories.length})</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `${list}`,
      { parse_mode: 'HTML' },
    )
  }
}

export const handleListCategories = new HandleListCategories()
