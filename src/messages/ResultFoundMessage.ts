import { Markup } from 'telegraf'

interface ResultFoundOutput {
  text: string
}

class ResultFoundMessage {
  execute(
    categoryName: string,
    emailAddress: string,
    content: string,
    emailTime: Date | null,
    fetchDurationMs: number,
  ): ResultFoundOutput {
    const timeStr = emailTime
      ? emailTime.toLocaleString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Jakarta',
        })
      : 'Tidak diketahui'

    const durationSec = (fetchDurationMs / 1000).toFixed(2)

    const text =
      `🎯 <b>${categoryName} Ditemukan</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📧 <b>Email:</b> <code>${emailAddress}</code>\n` +
      `📅 <b>Waktu email:</b> ${timeStr} WIB\n\n` +
      `<b>Hasil:</b>\n` +
      `<code>${content}</code>\n\n` +
      `─────────────────────\n` +
      `⏱️ <i>Ditemukan dalam ${durationSec} detik</i>`

    return { text }
  }
}

export const resultFoundMessage = new ResultFoundMessage()
