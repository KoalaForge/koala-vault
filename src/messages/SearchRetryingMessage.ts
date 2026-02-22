import { he } from '../utils/htmlEscape'

class SearchRetryingMessage {
  execute(categoryName: string, emailAddress: string): string {
    return (
      `🔍 <b>Mencoba Ulang Pencarian</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Kategori: <b>${he(categoryName)}</b>\n\n` +
      `📧 <code>${emailAddress}</code>\n\n` +
      `─────────────────────\n` +
      `⏳ <i>Sedang memindai ulang kotak masuk, harap tunggu...</i>`
    )
  }
}

export const searchRetryingMessage = new SearchRetryingMessage()
