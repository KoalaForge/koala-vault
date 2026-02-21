class AccessDeniedMessage {
  execute(): string {
    return (
      `❌ <b>Akses Ditolak</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Permintaan aksesmu telah ditolak oleh administrator.\n\n` +
      `─────────────────────\n` +
      `💡 <i>Jika kamu merasa ini adalah kesalahan, hubungi administrator secara langsung.</i>`
    )
  }
}

export const accessDeniedMessage = new AccessDeniedMessage()
