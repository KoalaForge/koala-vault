import { Markup } from 'telegraf'

type Keyboard = ReturnType<typeof Markup.inlineKeyboard>['reply_markup']

interface PanelSection {
  text: string
  keyboard: Keyboard
}

const BACK = Markup.inlineKeyboard([[Markup.button.callback('🔙 Kembali ke Panel', 'pn:home')]]).reply_markup

const SEP = '─────────────────────'

const SECTIONS: Record<string, () => string> = {
  imap: () =>
    `📡 <b>Konfigurasi IMAP</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `Atur koneksi IMAP agar bot bisa membaca email via Gmail.\n\n` +
    `${SEP}\n\n` +
    `⚙️ <b>/setprovider</b>\n` +
    `Set konfigurasi IMAP default (berlaku untuk semua email Gmail).\n` +
    `<code>/setprovider\ngmail\nimap.gmail.com\n993\nuser@gmail.com\napp_password</code>\n` +
    `💡 <i>App Password: Google Account → Security → App Passwords</i>\n\n` +
    `${SEP}\n\n` +
    `📌 <b>/setimap</b>\n` +
    `Override IMAP khusus untuk satu alamat email tertentu.\n` +
    `<code>/setimap\nuser@domain.com\nimap.domain.com\n993\nuser@domain.com\npassword</code>\n\n` +
    `${SEP}\n\n` +
    `📋 <b>/listimap</b>\n` +
    `Tampilkan semua konfigurasi IMAP yang tersimpan.\n` +
    `<code>/listimap</code>`,

  usr: () =>
    `👥 <b>Pengguna</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `Lihat dan kelola pengguna yang menggunakan bot.\n\n` +
    `${SEP}\n\n` +
    `👥 <b>/users</b>\n` +
    `Tampilkan semua pengguna beserta status whitelist mereka.\n` +
    `<code>/users</code>\n\n` +
    `Status: ✅ Disetujui · ⏳ Menunggu · ❌ Ditolak`,

  wl: () =>
    `🔒 <b>Whitelist</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `Kontrol akses pengguna ke bot.\n\n` +
    `${SEP}\n\n` +
    `🔄 <b>/togglewhitelist</b>\n` +
    `Aktifkan/nonaktifkan sistem whitelist.\n` +
    `<code>/togglewhitelist</code>\n` +
    `💡 <i>Saat OFF: semua orang bisa langsung pakai bot tanpa persetujuan</i>\n\n` +
    `${SEP}\n\n` +
    `✅ <b>/whitelist</b>\n` +
    `Tambah pengguna ke whitelist langsung via Telegram ID.\n` +
    `<code>/whitelist 123456789</code>\n\n` +
    `${SEP}\n\n` +
    `❌ <b>/unwhitelist</b>\n` +
    `Hapus pengguna dari whitelist.\n` +
    `<code>/unwhitelist 123456789</code>`,

  reg: () =>
    `📋 <b>Manajemen Email</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `<b>Pool Global</b> — email untuk semua pengguna tanpa assignment.\n` +
    `<b>Assignment</b> — email spesifik per user, bisa diberi batas waktu.\n\n` +
    `${SEP}\n\n` +
    `➕ <b>/addemail</b>\n` +
    `Tambah email ke pool global (bisa bulk).\n` +
    `<code>/addemail user@gmail.com work@gmail.com</code>\n\n` +
    `${SEP}\n\n` +
    `🗑️ <b>/removemail</b>\n` +
    `Hapus email dari pool global.\n` +
    `<code>/removemail user@gmail.com</code>\n\n` +
    `${SEP}\n\n` +
    `📄 <b>/listemails</b>\n` +
    `Tampilkan semua email di pool global.\n` +
    `<code>/listemails</code>\n\n` +
    `${SEP}\n\n` +
    `👤 <b>/assignemail</b>\n` +
    `Assign email ke user dengan opsional batas waktu.\n` +
    `<code>/assignemail [user_id] [hari|0] [email1] [email2]</code>\n` +
    `💡 <i>0 = tanpa batas waktu. Contoh: /assignemail 123 30 user@gmail.com</i>\n\n` +
    `${SEP}\n\n` +
    `🔓 <b>/deassignmail</b>\n` +
    `Cabut akses email dari user (user dapat notifikasi).\n` +
    `<code>/deassignmail 123456789 user@gmail.com</code>\n\n` +
    `${SEP}\n\n` +
    `📋 <b>/listassigned</b>\n` +
    `Lihat assignment aktif beserta tanggal expiry.\n` +
    `<code>/listassigned 123456789</code>`,

  cat: () =>
    `📋 <b>Kategori</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `Kelola kategori pencarian email (OTP, reset password, dll).\n\n` +
    `${SEP}\n\n` +
    `➕ <b>/addcategory</b>\n` +
    `Buat kategori baru dengan kata kunci subject dan regex ekstraksi.\n` +
    `<code>/addcategory\nNama Kategori\nKeyword 1|Keyword 2|Keyword 3\n(\\d{4,8})</code>\n\n` +
    `${SEP}\n\n` +
    `🔑 <b>/addsubject</b>\n` +
    `Tambah kata kunci subject ke kategori yang sudah ada.\n` +
    `<code>/addsubject [category_id] Keyword Baru|Keyword Lain</code>\n` +
    `💡 <i>Gunakan /listcategories untuk mendapatkan ID</i>\n\n` +
    `${SEP}\n\n` +
    `📄 <b>/listcategories</b>\n` +
    `Tampilkan semua kategori aktif beserta ID, keyword, dan regex.\n` +
    `<code>/listcategories</code>\n\n` +
    `${SEP}\n\n` +
    `🗑️ <b>/deletecategory</b>\n` +
    `Nonaktifkan kategori (soft delete).\n` +
    `<code>/deletecategory [category_id]</code>`,

  ten: () =>
    `🏢 <b>Tenant</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `Kelola bot-bot yang terdaftar di KoalaVault.\n\n` +
    `${SEP}\n\n` +
    `➕ <b>/addtenant</b>\n` +
    `Daftarkan bot Telegram baru sebagai tenant.\n` +
    `<code>/addtenant\nNama Tenant\nBOT_TOKEN\nOWNER_TELEGRAM_ID</code>\n` +
    `💡 <i>Dapatkan BOT_TOKEN dari @BotFather</i>\n\n` +
    `${SEP}\n\n` +
    `📄 <b>/listtenant</b>\n` +
    `Tampilkan semua tenant beserta status aktif/nonaktif.\n` +
    `<code>/listtenant</code>\n\n` +
    `${SEP}\n\n` +
    `🚫 <b>/deactivatetenant</b>\n` +
    `Nonaktifkan tenant dan lepas webhook-nya.\n` +
    `<code>/deactivatetenant [tenant_id]</code>\n\n` +
    `${SEP}\n\n` +
    `⏳ <b>/extenttenant</b>\n` +
    `Perpanjang masa berlangganan tenant.\n` +
    `<code>/extenttenant\nTENANT_ID\nJUMLAH_HARI</code>\n` +
    `💡 <i>Contoh: tambah 30 hari. Jika belum expired, dihitung dari tanggal berakhir sebelumnya.</i>`,
}

class PanelSectionMessage {
  execute(section: string): PanelSection {
    const builder = SECTIONS[section]

    if (!builder) {
      return {
        text: '❌ Menu tidak ditemukan.',
        keyboard: BACK,
      }
    }

    return { text: builder(), keyboard: BACK }
  }
}

export const panelSectionMessage = new PanelSectionMessage()
