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
      `💡 <i>Langsung kirim email baru untuk pencarian berikutnya.</i>`
    )
  }
}

export const processingCompleteMessage = new ProcessingCompleteMessage()
