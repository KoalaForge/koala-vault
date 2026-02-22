import type { BotContext } from '../../types'
import { deleteCategory } from '../../category/DeleteCategory'
import { findCategoryBySlug } from '../../category/FindCategoryBySlug'

class HandleDeleteCategory {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const text = (ctx.message as any)?.text ?? ''
    const slug = text.split(' ')[1]?.trim()

    if (!slug) {
      await ctx.reply(
        'Penggunaan: /deletecategory <slug>\n' +
        'Contoh: /deletecategory dana-transfer\n\n' +
        'Gunakan /listcategories untuk melihat slug.',
      )
      return
    }

    const category = await findCategoryBySlug.execute(tenant.id, slug)
    if (!category) {
      await ctx.reply(`❌ Kategori tidak ditemukan: <code>${slug}</code>`, { parse_mode: 'HTML' })
      return
    }

    const deleted = await deleteCategory.execute(tenant.id, category.id)
    if (!deleted) {
      await ctx.reply('❌ Gagal menghapus kategori.')
      return
    }

    await ctx.reply(`✅ Kategori <b>${category.name}</b> berhasil dihapus.`, { parse_mode: 'HTML' })
  }
}

export const handleDeleteCategory = new HandleDeleteCategory()
