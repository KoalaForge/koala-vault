import type { BotContext } from '../../types'
import { findCategoryBySlug } from '../../category/FindCategoryBySlug'
import { updateCategory } from '../../category/UpdateCategory'
import { he } from '../../utils/htmlEscape'

class HandleAddSubject {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const text: string = String((ctx.message as any)?.text ?? '')
    const parts = text.trim().split(/\s+/)
    const categorySlug = parts[1]
    const rawKeywords = parts.slice(2).join(' ')

    if (!categorySlug || !rawKeywords) {
      await ctx.reply(
        '📋 <b>Tambah Kata Kunci Subject</b>\n\n' +
        'Penggunaan:\n' +
        '<code>/addsubject [category_slug] [keyword1|keyword2|...]</code>\n\n' +
        '💡 <i>Gunakan <code>/listcategories</code> untuk melihat slug kategori.</i>\n\n' +
        'Contoh:\n' +
        '<code>/addsubject sign-in-code Login code|Kode masuk</code>',
        { parse_mode: 'HTML' },
      )
      return
    }

    const category = await findCategoryBySlug.execute(tenant.id, categorySlug)
    if (!category) {
      await ctx.reply(
        `❌ <b>Kategori Tidak Ditemukan</b>\n\n` +
        `Slug <code>${he(categorySlug)}</code> tidak ditemukan atau tidak aktif.\n\n` +
        `💡 <i>Gunakan <code>/listcategories</code> untuk melihat slug yang valid.</i>`,
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
      categoryId: category.id,
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
