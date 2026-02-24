import { Markup } from 'telegraf'

type Keyboard = ReturnType<typeof Markup.inlineKeyboard>['reply_markup']

interface PanelHome {
  text: string
  keyboard: Keyboard
}

class PanelHomeMessage {
  execute(name: string, isMaster: boolean, botName: string): PanelHome {
    const text =
      `🏠 <b>${botName} Admin Panel</b>\n\n` +
      `Halo, <b>${name}</b>! 👋\n\n` +
      `Pilih menu di bawah untuk melihat panduan cara penggunaan perintah:`

    const masterRows = isMaster
      ? [[Markup.button.callback('🏢 Tenant', 'pn:s:ten')]]
      : []

    const rows = [
      ...masterRows,
      [
        Markup.button.callback('🔌 Koneksi Email', 'pn:s:imap'),
        Markup.button.callback('👥 Pengguna', 'pn:s:usr'),
      ],
      [
        Markup.button.callback('🚪 Kontrol Akses', 'pn:s:wl'),
        Markup.button.callback('📬 Kelola Email', 'pn:s:reg'),
      ],
      [
        Markup.button.callback('🔍 Jenis Pencarian', 'pn:s:cat'),
        Markup.button.callback('📢 Notifikasi', 'pn:s:log'),
      ],
    ]

    return { text, keyboard: Markup.inlineKeyboard(rows).reply_markup }
  }
}

export const panelHomeMessage = new PanelHomeMessage()
