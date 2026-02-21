import type { BotContext } from '../../types'
import { updateCategory } from '../../category/UpdateCategory'
import { validateRegexPattern } from '../../security/ValidateRegexPattern'
import { he } from '../../utils/htmlEscape'

const USAGE_MESSAGE =
  '✏️ <b>Edit Regex Kategori</b>\n\n' +
  'Penggunaan (dua baris setelah command):\n' +
  '<code>/editcategory\n' +
  'CATEGORY_ID\n' +
  'regex_baru</code>\n\n' +
  '💡 Gunakan <code>/listcategories</code> untuk mendapatkan ID.\n\n' +
  'Contoh (URL tanpa trailing bracket):\n' +
  '<code>/editcategory\n' +
  '65f1a2b3c4d5e6f7a8b9c0d1\n' +
  `https?:\\/\\/[^\\s"'&lt;&gt;\\]]+</code>`

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
    const newRegex = lines[1]!.trim()

    if (!categoryId || !newRegex) {
      await ctx.reply(USAGE_MESSAGE, { parse_mode: 'HTML' })
      return
    }

    if (!validateRegexPattern.execute(newRegex)) {
      await ctx.reply(
        `❌ <b>Regex tidak valid</b>\n\n` +
        `Pattern: <code>${he(newRegex)}</code>\n\n` +
        `Periksa ekspresi dan coba lagi.`,
        { parse_mode: 'HTML' },
      )
      return
    }

    const updated = await updateCategory.execute({
      tenantId: tenant.id,
      categoryId,
      extractionRegex: newRegex,
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

    await ctx.reply(
      `✅ <b>Regex Diperbarui</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📁 Kategori: <b>${he(updated.name)}</b>\n` +
      `🆔 ID: <code>${updated.id}</code>\n\n` +
      `🔍 Regex baru:\n<code>${he(updated.extractionRegex)}</code>`,
      { parse_mode: 'HTML' },
    )
  }
}

export const handleEditCategory = new HandleEditCategory()
