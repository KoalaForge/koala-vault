import type { BotContext } from '../../types'
import { deleteCategory } from '../../category/DeleteCategory'

class HandleDeleteCategory {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const text = (ctx.message as any)?.text ?? ''
    const categoryId = text.split(' ')[1]?.trim()

    if (!categoryId) {
      await ctx.reply('Usage: /deletecategory <category_id>')
      return
    }

    const deleted = await deleteCategory.execute(tenant.id, categoryId)

    if (!deleted) {
      await ctx.reply('❌ Category not found or already deleted.')
      return
    }

    await ctx.reply('✅ Category deleted successfully.')
  }
}

export const handleDeleteCategory = new HandleDeleteCategory()
