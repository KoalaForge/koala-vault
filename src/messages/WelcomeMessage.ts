class WelcomeMessage {
  execute(botName: string): string {
    return (
      `📧 <b>${botName}</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Selamat datang! Masukkan alamat email yang ingin kamu cari.\n\n` +
      `<b>Cara penggunaan:</b>\n` +
      `• Ketik satu atau beberapa alamat email\n` +
      `• Pisahkan dengan spasi atau baris baru\n` +
      `• Pilih kategori pencarian\n` +
      `• Hasil akan langsung dikirimkan\n\n` +
      `─────────────────────\n` +
      `💡 <i>Contoh: user@gmail.com user2@yahoo.com</i>`
    )
  }
}

export const welcomeMessage = new WelcomeMessage()
