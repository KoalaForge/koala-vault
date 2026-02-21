import type { BotContext } from '../../types'
import { updateCategory } from '../../category/UpdateCategory'
import { validateRegexPattern } from '../../security/ValidateRegexPattern'
import { he } from '../../utils/htmlEscape'

const USAGE_MESSAGE =
  '✏️ <b>Edit Regex Kategori</b>\n\n' +
  'Penggunaan (baris pertama = ID, baris berikutnya = regex):\n' +
  '<code>/editcategory\n' +
  'CATEGORY_ID\n' +
  'primary_regex\n' +
  'fallback_regex (opsional)</code>\n\n' +
  '💡 Gunakan <code>/listcategories</code> untuk mendapatkan ID.\n\n' +
  'Contoh:\n' +
  '<code>/editcategory\n' +
  '65f1a2b3c4d5e6f7a8b9c0d1\n' +
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

    const categoryId = lines[0]!.trim()
    const newRegexList = lines.slice(1).map(l => l.trim()).filter(Boolean)

    if (!categoryId || newRegexList.length === 0) {
      await ctx.reply(USAGE_MESSAGE, { parse_mode: 'HTML' })
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
      categoryId,
      extractionRegexList: newRegexList,
    })

    if (!updated) {
      await ctx.reply(
        `❌ Kategori tidak ditemukan.\n` +
        `ID: <code>${categoryId}</code>\n\n` +
        `💡 Gunakan <code>/listcategories</code> untuk melihat ID yang valid.`,
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
      `🆔 ID: <code>${updated.id}</code>\n\n` +
      `${regexDisplay}`,
      { parse_mode: 'HTML' },
    )
  }
}

export const handleEditCategory = new HandleEditCategory()
