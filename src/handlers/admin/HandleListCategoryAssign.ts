import type { BotContext } from '../../types'
import { listUserCategoryAssignments } from '../../category-assignment/ListUserCategoryAssignments'
import { CategoryModel } from '../../database/models/CategoryModel'

class HandleListCategoryAssign {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const text: string = String((ctx.message as any)?.text ?? '')
    const targetUserId = text.trim().split(/\s+/)[1]

    if (!targetUserId || !/^\d+$/.test(targetUserId)) {
      await ctx.reply(
        '📋 <b>Lihat Assignment Kategori Pengguna</b>\n\n' +
        'Penggunaan:\n<code>/listcategoryassign [telegram_user_id]</code>\n\n' +
        'Contoh:\n<code>/listcategoryassign 123456789</code>',
        { parse_mode: 'HTML' },
      )
      return
    }

    const assignments = await listUserCategoryAssignments.execute(tenant.id, targetUserId)

    if (assignments.length === 0) {
      await ctx.reply(
        `📋 <b>Assignment Kategori</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `👤 User ID: <code>${targetUserId}</code>\n\n` +
        `Tidak ada assignment kategori. User hanya dapat melihat kategori default.`,
        { parse_mode: 'HTML' },
      )
      return
    }

    const catIds = assignments.map(a => a.categoryId)
    const catDocs = await CategoryModel.find({
      _id: { $in: catIds },
      $or: [{ tenantId: tenant.id }, { isGlobal: true }],
    })
      .select('_id name slug')
      .lean<{ _id: any; name: string; slug?: string }[]>()

    const catMap = new Map(catDocs.map(c => [c._id.toString(), c]))

    const lines = assignments.map((a, i) => {
      const cat = catMap.get(a.categoryId)
      const name = cat?.name ?? '(nama tidak tersedia)'
      const slug = cat?.slug ? `  🏷️ <code>${cat.slug}</code>` : ''
      return `${i + 1}. <b>${name}</b>${slug}`
    }).join('\n\n')

    await ctx.reply(
      `📋 <b>Assignment Kategori (${assignments.length})</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `👤 User ID: <code>${targetUserId}</code>\n\n` +
      `${lines}`,
      { parse_mode: 'HTML' },
    )
  }
}

export const handleListCategoryAssign = new HandleListCategoryAssign()
