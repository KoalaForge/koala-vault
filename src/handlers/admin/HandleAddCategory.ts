import type { BotContext } from '../../types'
import { createCategory } from '../../category/CreateCategory'
import { validateRegexPattern } from '../../security/ValidateRegexPattern'
import { he } from '../../utils/htmlEscape'

class HandleAddCategory {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const text: string = String((ctx.message as any)?.text ?? '')
    const args = text.split('\n').slice(1)

    if (args.length < 3) {
      await ctx.reply(
        '📋 <b>Add Category</b>\n\n' +
        'Usage (one per line after command):\n' +
        '<code>/addcategory\n' +
        'Category Name\n' +
        'Subject Keyword 1|Subject Keyword 2\n' +
        'primary_regex\n' +
        'fallback_regex (opsional)</code>\n\n' +
        'Example:\n' +
        '<code>/addcategory\n' +
        'Verify Email\n' +
        'Your verification code|Kode verifikasi\n' +
        '(\\d{4,8})\n' +
        'code[:\\s]+(\\d{4,8})</code>',
        { parse_mode: 'HTML' }
      )
      return
    }

    const name = args[0]!.trim()
    const subjects = args[1]!.split('|').map(s => s.trim()).filter(Boolean)
    const regexList = args.slice(2).map(r => r.trim()).filter(Boolean)

    const invalidRegex = regexList.find(r => !validateRegexPattern.execute(r))
    if (invalidRegex) {
      await ctx.reply(
        `❌ Invalid regex pattern:\n<code>${he(invalidRegex)}</code>\n\nPeriksa ekspresi dan coba lagi.`,
        { parse_mode: 'HTML' },
      )
      return
    }

    const category = await createCategory.execute({
      tenantId: tenant.id,
      name,
      subjectKeywords: subjects,
      extractionRegexList: regexList,
      isGlobal: tenant.isMaster,
    })

    const globalNote = category.isGlobal ? '\n🌐 <i>Kategori ini berlaku untuk semua tenant.</i>' : ''
    const regexDisplay = regexList
      .map((r, i) => `  ${i === 0 ? '🔍 Primary' : `⬇️ Fallback ${i}`}: <code>${he(r)}</code>`)
      .join('\n')

    await ctx.reply(
      `✅ <b>Category Created</b>\n\n` +
      `📌 Name: ${he(category.name)}\n` +
      `🏷️ Slug: <code>${category.slug}</code>\n` +
      `🔑 Subjects: ${subjects.map(he).join(', ')}\n` +
      `${regexDisplay}${globalNote}`,
      { parse_mode: 'HTML' }
    )
  }
}

export const handleAddCategory = new HandleAddCategory()
