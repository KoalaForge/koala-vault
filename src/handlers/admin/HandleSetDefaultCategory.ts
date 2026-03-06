import type { BotContext } from '../../types'
import { setCategoryDefault } from '../../category-assignment/SetCategoryDefault'
import { findCategoryBySlug } from '../../category/FindCategoryBySlug'
import { he } from '../../utils/htmlEscape'

const USAGE_MESSAGE =
  '⚙️ <b>Set Kategori Default</b>\n\n' +
  'Penggunaan:\n' +
  '<code>/setdefaultcategory [slug]</code>\n\n' +
  'Toggle kategori menjadi default (semua user bisa akses tanpa assignment).\n\n' +
  'Contoh:\n' +
  '<code>/setdefaultcategory dana-transfer</code>'

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/

class HandleSetDefaultCategory {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const text: string = String((ctx.message as any)?.text ?? '')
    const slug = text.trim().split(/\s+/)[1]

    if (!slug || !SLUG_REGEX.test(slug)) {
      await ctx.reply(USAGE_MESSAGE, { parse_mode: 'HTML' })
      return
    }

    const category = await findCategoryBySlug.execute(tenant.id, slug)
    if (!category) {
      await ctx.reply(
        `❌ Kategori tidak ditemukan atau tidak aktif.\n` +
        `Slug: <code>${slug}</code>`,
        { parse_mode: 'HTML' },
      )
      return
    }

    const result = await setCategoryDefault.execute(tenant.id, category.id, tenant.isMaster)

    if (!result) {
      await ctx.reply(
        `❌ Kategori tidak ditemukan atau tidak aktif.\n` +
        `Slug: <code>${slug}</code>`,
        { parse_mode: 'HTML' },
      )
      return
    }

    const statusLabel = result.isDefault ? '✅ DEFAULT' : '❌ Bukan Default'
    const statusNote = result.isDefault
      ? `<i>Semua user kini dapat melihat kategori ini tanpa assignment.</i>`
      : `<i>Kategori ini hanya dapat diakses oleh user yang di-assign secara spesifik.</i>`
    await ctx.reply(
      `⚙️ <b>Status Default Diperbarui</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📁 Kategori: <b>${he(result.category.name)}</b>\n` +
      `🏷️ Slug: <code>${result.category.slug}</code>\n` +
      `📌 Status: <b>${statusLabel}</b>\n\n` +
      statusNote,
      { parse_mode: 'HTML' },
    )
  }
}

export const handleSetDefaultCategory = new HandleSetDefaultCategory()
