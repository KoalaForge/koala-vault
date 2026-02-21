class SearchInitiatedMessage {
  execute(categoryName: string, emails: string[]): string {
    const emailList = emails.map(e => `  📧 <code>${e}</code>`).join('\n')

    return (
      `🔍 <b>Pencarian Dimulai</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Kategori: <b>${categoryName}</b>\n\n` +
      `Email yang dicari:\n` +
      `${emailList}\n\n` +
      `─────────────────────\n` +
      `⏳ <i>Sedang memindai kotak masuk, harap tunggu...</i>`
    )
  }
}

export const searchInitiatedMessage = new SearchInitiatedMessage()
