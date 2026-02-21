import type { BotContext } from '../../types'
import { findCategoryById } from '../../category/FindCategoryById'
import { updateCategory } from '../../category/UpdateCategory'
import { he } from '../../utils/htmlEscape'

class HandleAddSubject {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const text: string = String((ctx.message as any)?.text ?? '')
    const parts = text.trim().split(/\s+/)
    const categoryId = parts[1]
    const rawKeywords = parts.slice(2).join(' ')

    if (!categoryId || !rawKeywords) {
      await ctx.reply(
        '📋 <b>Tambah Kata Kunci Subject</b>\n\n' +
        'Penggunaan:\n' +
        '<code>/addsubject [category_id] [keyword1|keyword2|...]</code>\n\n' +
        '💡 <i>Gunakan <code>/listcategories</code> untuk mendapatkan ID kategori.</i>\n\n' +
        'Contoh:\n' +
        '<code>/addsubject 6639f1a2b3c4d5e6f7890123 Login code|Kode masuk</code>',
        { parse_mode: 'HTML' },
      )
      return
    }

    const category = await findCategoryById.execute(tenant.id, categoryId)
    if (!category) {
      await ctx.reply(
        `❌ <b>Kategori Tidak Ditemukan</b>\n\n` +
        `ID <code>${categoryId}</code> tidak ditemukan atau tidak aktif.\n\n` +
        `💡 <i>Gunakan <code>/listcategories</code> untuk melihat ID yang valid.</i>`,
        { parse_mode: 'HTML' },
      )
      return
    }

    const newKeywords = rawKeywords.split('|').map(k => k.trim()).filter(Boolean)
    const existingSet = new Set(category.subjectKeywords.map(k => k.toLowerCase()))
    const toAdd = newKeywords.filter(k => !existingSet.has(k.toLowerCase()))
    const duplicates = newKeywords.filter(k => existingSet.has(k.toLowerCase()))

    const updatedKeywords = [...category.subjectKeywords, ...toAdd]
    await updateCategory.execute({
      tenantId: tenant.id,
      categoryId,
      subjectKeywords: updatedKeywords,
    })

    const addedList = toAdd.map(k => `  ✅ <code>${he(k)}</code>`).join('\n')
    const dupList = duplicates.map(k => `  ⏭️ <code>${he(k)}</code> <i>(sudah ada)</i>`).join('\n')

    const lines = [addedList, dupList].filter(Boolean).join('\n')

    await ctx.reply(
      `📋 <b>Kata Kunci Ditambahkan</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Kategori: <b>${he(category.name)}</b>\n\n` +
      `${lines}\n\n` +
      `─────────────────────\n` +
      `Total kata kunci: <b>${updatedKeywords.length}</b>`,
      { parse_mode: 'HTML' },
    )
  }
}

export const handleAddSubject = new HandleAddSubject()
