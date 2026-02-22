import { Markup } from 'telegraf'
import { he } from '../utils/htmlEscape'
import type { ImapErrorReason } from '../types'

interface ResultErrorOutput {
  text: string
  keyboard: ReturnType<typeof Markup.inlineKeyboard>['reply_markup']
}

const ERROR_DETAIL: Record<ImapErrorReason, { headline: string; bullets: string }> = {
  auth_failed: {
    headline: '❌ <b>Autentikasi Server Email Gagal</b>',
    bullets:
      `• Kredensial IMAP tidak valid atau sudah berubah\n` +
      `• Hubungi admin untuk memperbarui konfigurasi IMAP`,
  },
  connection_error: {
    headline: '❌ <b>Gagal Terhubung ke Server Email</b>',
    bullets:
      `• Server email sedang tidak dapat dihubungi\n` +
      `• Coba lagi beberapa saat kemudian`,
  },
}

class ResultErrorMessage {
  execute(
    categoryName: string,
    emailAddress: string,
    retryCount = 0,
    errorReason?: ImapErrorReason,
  ): ResultErrorOutput {
    const safeName = he(categoryName)
    const attemptLine = retryCount > 0 ? `🔄 <b>Percobaan ke-${retryCount + 1}</b>\n\n` : ''
    const detail = ERROR_DETAIL[errorReason ?? 'connection_error']

    const text =
      `${detail.headline}\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `${attemptLine}` +
      `📧 <b>Email:</b> <code>${emailAddress}</code>\n\n` +
      `${detail.bullets}\n\n` +
      `─────────────────────\n` +
      `💡 <i>Gunakan tombol di bawah untuk mencoba lagi.</i>`

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Coba Lagi', `retry:${emailAddress}:${categoryName}`)],
    ]).reply_markup

    return { text, keyboard }
  }
}

export const resultErrorMessage = new ResultErrorMessage()
