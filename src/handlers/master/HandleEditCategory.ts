import type { BotContext } from '../../types'
import { updateCategory } from '../../category/UpdateCategory'
import { findCategoryBySlug } from '../../category/FindCategoryBySlug'
import { validateRegexPattern } from '../../security/ValidateRegexPattern'
import { he } from '../../utils/htmlEscape'

const USAGE_MESSAGE =
  '✏️ <b>Edit Regex Kategori</b>\n\n' +
  'Penggunaan (baris pertama = slug, baris berikutnya = regex):\n' +
  '<code>/editcategory\n' +
  'CATEGORY_SLUG\n' +
  'primary_regex\n' +
  'fallback_regex (opsional)</code>\n\n' +
  '💡 Gunakan <code>/listcategories</code> untuk mendapatkan slug.\n\n' +
  'Contoh:\n' +
  '<code>/editcategory\n' +
  'dana-transfer\n' +
  `https?:\\/\\/[^\\s"'&lt;&gt;\\]]+\n` +
  `href="([^"]+)"</code>`

class HandleEditCategory {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const text: string = String((ctx.message as any)?.text ?? '')
    const lines = text.split('\n').slice(1)

    if (lines.length < 2) {
      await ctx.reply(USAGE_MESSAGE, { parse_mode: 'HTML' })
      return
    }

    const slug = lines[0]!.trim()
    const newRegexList = lines.slice(1).map(l => l.trim()).filter(Boolean)

    if (!slug || newRegexList.length === 0) {
      await ctx.reply(USAGE_MESSAGE, { parse_mode: 'HTML' })
      return
    }

    const category = await findCategoryBySlug.execute(tenant.id, slug)
    if (!category) {
      await ctx.reply(
        `❌ Kategori tidak ditemukan.\n` +
        `Slug: <code>${slug}</code>\n\n` +
        `💡 Gunakan <code>/listcategories</code> untuk melihat slug yang valid.`,
        { parse_mode: 'HTML' },
      )
      return
    }

    const invalidRegex = newRegexList.find(r => !validateRegexPattern.execute(r))
    if (invalidRegex) {
      await ctx.reply(
        `❌ <b>Regex tidak valid</b>\n\n` +
        `Pattern: <code>${he(invalidRegex)}</code>\n\n` +
        `Periksa ekspresi dan coba lagi.`,
        { parse_mode: 'HTML' },
      )
      return
    }

    const updated = await updateCategory.execute({
      tenantId: tenant.id,
      categoryId: category.id,
      extractionRegexList: newRegexList,
    })

    if (!updated) {
      await ctx.reply(
        `❌ Kategori tidak ditemukan.\n` +
        `Slug: <code>${slug}</code>\n\n` +
        `💡 Gunakan <code>/listcategories</code> untuk melihat slug yang valid.`,
        { parse_mode: 'HTML' },
      )
      return
    }

    const regexDisplay = updated.extractionRegexList
      .map((r, i) => `  ${i === 0 ? '🔍 Primary' : `⬇️ Fallback ${i}`}: <code>${he(r)}</code>`)
      .join('\n')

    await ctx.reply(
      `✅ <b>Regex Diperbarui</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📁 Kategori: <b>${he(updated.name)}</b>\n` +
      `🏷️ Slug: <code>${updated.slug}</code>\n\n` +
      `${regexDisplay}`,
      { parse_mode: 'HTML' },
    )
  }
}

export const handleEditCategory = new HandleEditCategory()
