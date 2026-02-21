import { Markup } from 'telegraf'
import type { Category } from '../types'

interface CategorySelection {
  text: string
  keyboard: ReturnType<typeof Markup.inlineKeyboard>['reply_markup']
}

class CategorySelectionMessage {
  execute(emails: string[], categories: Category[]): CategorySelection {
    const emailList = emails.map(e => `  📧 <code>${e}</code>`).join('\n')

    const text =
      `🔍 <b>Pilih Kategori Pencarian</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `<b>${emails.length} email</b> akan dicari:\n` +
      `${emailList}\n\n` +
      `─────────────────────\n` +
      `💡 <i>Pilih kategori di bawah untuk memulai pencarian.</i>`

    const buttons = categories.map(cat =>
      [Markup.button.callback(cat.name, `category:${cat.id}`)]
    )

    const keyboard = Markup.inlineKeyboard(buttons).reply_markup

    return { text, keyboard }
  }
}

export const categorySelectionMessage = new CategorySelectionMessage()
