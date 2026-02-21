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
      `Pilih menu di bawah untuk melihat panduan dan cara penggunaan perintah yang tersedia:`

    const masterRows = isMaster
      ? [[Markup.button.callback('🏢 Tenant', 'pn:s:ten')]]
      : []

    const rows = [
      ...masterRows,
      [
        Markup.button.callback('📧 Konfigurasi IMAP', 'pn:s:imap'),
        Markup.button.callback('👥 Pengguna', 'pn:s:usr'),
      ],
      [
        Markup.button.callback('🔒 Whitelist', 'pn:s:wl'),
        Markup.button.callback('📋 Email Terdaftar', 'pn:s:reg'),
      ],
      [
        Markup.button.callback('📁 Kategori', 'pn:s:cat'),
      ],
    ]

    return { text, keyboard: Markup.inlineKeyboard(rows).reply_markup }
  }
}

export const panelHomeMessage = new PanelHomeMessage()
