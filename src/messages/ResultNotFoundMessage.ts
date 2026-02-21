import { Markup } from 'telegraf'

interface ResultNotFoundOutput {
  text: string
  keyboard: ReturnType<typeof Markup.inlineKeyboard>['reply_markup']
}

class ResultNotFoundMessage {
  execute(categoryName: string, emailAddress: string): ResultNotFoundOutput {
    const text =
      `⚠️ <b>${categoryName} Tidak Ditemukan</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📧 <b>Email:</b> <code>${emailAddress}</code>\n\n` +
      `Kemungkinan penyebab:\n` +
      `• Email belum diterima di kotak masuk\n` +
      `• Pastikan kamu sudah meminta <b>${categoryName}</b> baru\n` +
      `• Coba lagi beberapa detik kemudian\n\n` +
      `─────────────────────\n` +
      `💡 <i>Gunakan tombol di bawah untuk mencoba lagi.</i>`

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Coba Lagi', `retry:${emailAddress}:${categoryName}`)],
    ]).reply_markup

    return { text, keyboard }
  }
}

export const resultNotFoundMessage = new ResultNotFoundMessage()
