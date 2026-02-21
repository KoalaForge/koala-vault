import type { BotContext } from '../../types'
import { deassignCategory } from '../../category-assignment/DeassignCategory'

const USAGE_MESSAGE =
  '🗑️ <b>Cabut Assignment Kategori</b>\n\n' +
  'Penggunaan:\n' +
  '<code>/deassigncategory [catId1] [catId2]... [userId1] [userId2]...</code>\n\n' +
  '• <b>catId</b> — MongoDB ObjectId 24 karakter hex\n' +
  '• <b>userId</b> — Telegram user ID (hanya angka)\n\n' +
  'Contoh (1 kategori dari 1 user):\n' +
  '<code>/deassigncategory 65f1a2b3c4d5e6f7a8b9c0d1 123456789</code>\n\n' +
  'Contoh (2 kategori dari 2 user):\n' +
  '<code>/deassigncategory 65f1a2b3c4d5e6f7a8b9c0d1 65f1a2b3c4d5e6f7a8b9c0d2 123456789 987654321</code>'

const OBJECT_ID_REGEX = /^[0-9a-f]{24}$/i
const USER_ID_REGEX = /^\d+$/

class HandleDeassignCategory {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const text: string = String((ctx.message as any)?.text ?? '')
    const args = text.trim().split(/\s+/).slice(1)

    const categoryIds = args.filter(a => OBJECT_ID_REGEX.test(a))
    const telegramUserIds = args.filter(a => USER_ID_REGEX.test(a))

    if (categoryIds.length === 0 || telegramUserIds.length === 0) {
      await ctx.reply(USAGE_MESSAGE, { parse_mode: 'HTML' })
      return
    }

    const { removedCount, notFoundCount } = await deassignCategory.execute({
      tenantId: tenant.id,
      telegramUserIds,
      categoryIds,
    })

    const userLines = telegramUserIds.map(u => `  👤 <code>${u}</code>`).join('\n')

    await ctx.reply(
      `🔓 <b>Hasil Pencabutan Assignment Kategori</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `👥 User:\n${userLines}\n\n` +
      `✅ Dicabut: <b>${removedCount}</b>\n` +
      `⚠️ Tidak ditemukan: <b>${notFoundCount}</b>`,
      { parse_mode: 'HTML' },
    )
  }
}

export const handleDeassignCategory = new HandleDeassignCategory()
