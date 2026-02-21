class ProcessingCompleteMessage {
  execute(successCount: number, totalCount: number): string {
    const failCount = totalCount - successCount
    const statusLine = failCount === 0
      ? `✅ Semua <b>${totalCount}</b> email berhasil diproses`
      : `✅ <b>${successCount}</b> berhasil  ·  ❌ <b>${failCount}</b> tidak ditemukan`

    return (
      `📋 <b>Pencarian Selesai</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `${statusLine}\n\n` +
      `─────────────────────\n` +
      `💡 <i>Kirim email baru untuk pencarian berikutnya, atau ketik /start untuk mengulang.</i>`
    )
  }
}

export const processingCompleteMessage = new ProcessingCompleteMessage()
