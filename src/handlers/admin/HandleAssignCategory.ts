import type { BotContext } from '../../types'
import { assignCategory } from '../../category-assignment/AssignCategory'
import { findCategoriesBySlugs } from '../../category/FindCategoriesBySlugs'

const USAGE_MESSAGE =
  '📁 <b>Assign Kategori ke Pengguna</b>\n\n' +
  'Penggunaan:\n' +
  '<code>/assigncategory [slug1] [slug2]... [userId1] [userId2]...</code>\n\n' +
  '• <b>slug</b> — slug kategori (gunakan /listcategories untuk melihat slug)\n' +
  '• <b>userId</b> — Telegram user ID (hanya angka)\n\n' +
  'Contoh (1 kategori → 1 user):\n' +
  '<code>/assigncategory dana-transfer 123456789</code>\n\n' +
  'Contoh (2 kategori → 2 user):\n' +
  '<code>/assigncategory dana-transfer bca-transfer 123456789 987654321</code>'

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/
const USER_ID_REGEX = /^\d+$/

class HandleAssignCategory {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const text: string = String((ctx.message as any)?.text ?? '')
    const args = text.trim().split(/\s+/).slice(1)

    const categorySlugs = args.filter(a => SLUG_REGEX.test(a) && !USER_ID_REGEX.test(a))
    const telegramUserIds = args.filter(a => USER_ID_REGEX.test(a))

    if (categorySlugs.length === 0 || telegramUserIds.length === 0) {
      await ctx.reply(USAGE_MESSAGE, { parse_mode: 'HTML' })
      return
    }

    const categories = await findCategoriesBySlugs.execute(tenant.id, categorySlugs)
    const foundSlugs = new Set(categories.map(c => c.slug))
    const invalidSlugs = categorySlugs.filter(s => !foundSlugs.has(s))
    const categoryIds = categories.map(c => c.id)

    if (categoryIds.length === 0) {
      await ctx.reply(USAGE_MESSAGE, { parse_mode: 'HTML' })
      return
    }

    const { assigned } = await assignCategory.execute({
      tenantId: tenant.id,
      telegramUserIds,
      categoryIds,
      assignedByTelegramId: String(ctx.from!.id),
    })

    const invalidLines = invalidSlugs.map(s => `  ⚠️ <code>${s}</code> <i>(tidak ditemukan/tidak aktif)</i>`).join('\n')
    const userLines = telegramUserIds.map(u => `  👤 <code>${u}</code>`).join('\n')

    await ctx.reply(
      `✅ <b>Kategori Berhasil Di-assign</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `👥 User:\n${userLines}\n\n` +
      `📊 Total assignment baru/diperbarui: <b>${assigned.length}</b>` +
      (invalidLines ? `\n\n${invalidLines}` : ''),
      { parse_mode: 'HTML' },
    )
  }
}

export const handleAssignCategory = new HandleAssignCategory()
