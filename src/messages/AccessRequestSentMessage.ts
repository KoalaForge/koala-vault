class AccessRequestSentMessage {
  execute(): string {
    return (
      `⏳ <b>Permintaan Terkirim</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Permintaan aksesmu telah dikirimkan ke administrator.\n` +
      `Kamu akan menerima notifikasi di sini setelah permintaan ditinjau.\n\n` +
      `─────────────────────\n` +
      `💡 <i>Mohon tunggu — administrator akan segera merespons.</i>`
    )
  }
}

export const accessRequestSentMessage = new AccessRequestSentMessage()
