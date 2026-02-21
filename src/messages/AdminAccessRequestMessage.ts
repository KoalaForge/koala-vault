import { Markup } from 'telegraf'

interface AdminNotification {
  text: string
  keyboard: ReturnType<typeof Markup.inlineKeyboard>['reply_markup']
}

class AdminAccessRequestMessage {
  execute(userId: string, username: string | null, firstName: string | null): AdminNotification {
    const displayName = username ? `@${username}` : firstName ?? `User ${userId}`

    const text =
      `🔔 <b>Permintaan Akses Baru</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `👤 <b>Nama:</b> ${displayName}\n` +
      `🆔 <b>ID:</b> <code>${userId}</code>\n\n` +
      `─────────────────────\n` +
      `Setujui atau tolak permintaan akses pengguna ini.`

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Setujui', `approve:${userId}`),
        Markup.button.callback('❌ Tolak', `deny:${userId}`),
      ],
    ]).reply_markup

    return { text, keyboard }
  }
}

export const adminAccessRequestMessage = new AdminAccessRequestMessage()
