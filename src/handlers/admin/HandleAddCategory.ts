import type { BotContext } from '../../types'
import { createCategory } from '../../category/CreateCategory'
import { validateRegexPattern } from '../../security/ValidateRegexPattern'

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
        'regex_pattern_here</code>\n\n' +
        'Example:\n' +
        '<code>/addcategory\n' +
        'Verify Email\n' +
        'Your verification code|Kode verifikasi\n' +
        '(\\d{4,8})</code>',
        { parse_mode: 'HTML' }
      )
      return
    }

    const name = args[0]!.trim()
    const subjects = args[1]!.split('|').map(s => s.trim()).filter(Boolean)
    const regex = args[2]!.trim()

    if (!validateRegexPattern.execute(regex)) {
      await ctx.reply('❌ Invalid regex pattern. Please check your expression and try again.', { parse_mode: 'HTML' })
      return
    }

    const category = await createCategory.execute({
      tenantId: tenant.id,
      name,
      subjectKeywords: subjects,
      extractionRegex: regex,
      isGlobal: tenant.isMaster,
    })

    const globalNote = category.isGlobal ? '\n🌐 <i>Kategori ini berlaku untuk semua tenant.</i>' : ''

    await ctx.reply(
      `✅ <b>Category Created</b>\n\n` +
      `📌 Name: ${category.name}\n` +
      `🔍 Subjects: ${subjects.join(', ')}\n` +
      `🔢 Regex: <code>${regex}</code>${globalNote}`,
      { parse_mode: 'HTML' }
    )
  }
}

export const handleAddCategory = new HandleAddCategory()
