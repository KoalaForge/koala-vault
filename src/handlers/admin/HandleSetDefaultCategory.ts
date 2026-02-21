import type { BotContext } from '../../types'
import { setCategoryDefault } from '../../category-assignment/SetCategoryDefault'
import { he } from '../../utils/htmlEscape'

const USAGE_MESSAGE =
  '⚙️ <b>Set Kategori Default</b>\n\n' +
  'Penggunaan:\n' +
  '<code>/setdefaultcategory [categoryId]</code>\n\n' +
  'Toggle kategori menjadi default (semua user bisa akses tanpa assignment).\n\n' +
  'Contoh:\n' +
  '<code>/setdefaultcategory 65f1a2b3c4d5e6f7a8b9c0d1</code>'

const OBJECT_ID_REGEX = /^[0-9a-f]{24}$/i

class HandleSetDefaultCategory {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const text: string = String((ctx.message as any)?.text ?? '')
    const categoryId = text.trim().split(/\s+/)[1]

    if (!categoryId || !OBJECT_ID_REGEX.test(categoryId)) {
      await ctx.reply(USAGE_MESSAGE, { parse_mode: 'HTML' })
      return
    }

    const result = await setCategoryDefault.execute(tenant.id, categoryId)

    if (!result) {
      await ctx.reply(
        `❌ Kategori tidak ditemukan atau tidak aktif.\n` +
        `ID: <code>${categoryId}</code>`,
        { parse_mode: 'HTML' },
      )
      return
    }

    const statusLabel = result.isDefault ? '✅ DEFAULT' : '❌ Bukan Default'
    await ctx.reply(
      `⚙️ <b>Status Default Diperbarui</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📁 Kategori: <b>${he(result.category.name)}</b>\n` +
      `🆔 ID: <code>${result.category.id}</code>\n` +
      `📌 Status: <b>${statusLabel}</b>\n\n` +
      (result.isDefault
        ? `<i>Semua user kini dapat melihat kategori ini tanpa assignment.</i>`
        : `<i>Kategori ini hanya dapat diakses oleh user yang di-assign secara spesifik.</i>`),
      { parse_mode: 'HTML' },
    )
  }
}

export const handleSetDefaultCategory = new HandleSetDefaultCategory()
