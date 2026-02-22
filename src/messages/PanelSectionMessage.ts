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
    `📁 <b>Kategori</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `Atur kategori pencarian email dan kontrol akses per-user.\n\n` +
    `${SEP}\n\n` +
    `📄 <b>/listcategories</b>\n` +
    `Tampilkan semua kategori aktif. Master melihat detail penuh, admin melihat nama + ID.\n` +
    `<code>/listcategories</code>\n\n` +
    `${SEP}\n\n` +
    `📌 <b>/setdefaultcategory</b>\n` +
    `Toggle kategori menjadi default — semua user bisa akses tanpa assignment.\n` +
    `<code>/setdefaultcategory [category_id]</code>\n\n` +
    `${SEP}\n\n` +
    `👤 <b>/assigncategory</b>\n` +
    `Assign satu atau banyak kategori ke satu atau banyak user sekaligus.\n` +
    `<code>/assigncategory [catId1] [catId2] [userId1] [userId2]</code>\n` +
    `💡 <i>categoryId = 24 char hex, userId = angka Telegram ID</i>\n\n` +
    `${SEP}\n\n` +
    `🔓 <b>/deassigncategory</b>\n` +
    `Cabut assignment kategori dari user.\n` +
    `<code>/deassigncategory [catId] [userId]</code>\n\n` +
    `${SEP}\n\n` +
    `🔍 <b>/listcategoryassign</b>\n` +
    `Lihat kategori yang di-assign ke user tertentu.\n` +
    `<code>/listcategoryassign [userId]</code>\n\n` +
    `${SEP}\n\n` +
    `<i>👑 Perintah berikut hanya untuk Master:</i>\n` +
    `<code>/addcategory</code> — Buat kategori global baru (primary + fallback regex)\n` +
    `<code>/editcategory</code> — Edit regex kategori\n` +
    `<code>/addsubject</code> — Tambah kata kunci subject\n` +
    `<code>/deletecategory</code> — Hapus kategori`,

  log: () =>
    `📢 <b>Log Channel</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `Kirim notifikasi otomatis ke channel Telegram setiap kali pencarian email selesai.\n\n` +
    `${SEP}\n\n` +
    `<b>📌 Cara Kerja</b>\n` +
    `Setiap hasil pencarian (ditemukan / tidak ditemukan / error) akan dikirim\n` +
    `ke channel yang dikonfigurasi. Jika tenant tidak punya channel sendiri,\n` +
    `log akan dikirim ke channel global milik master (via bot master).\n\n` +
    `${SEP}\n\n` +
    `<b>⚙️ Persiapan Channel</b>\n` +
    `① Buat channel Telegram (private atau public)\n` +
    `② Tambahkan bot ini sebagai <b>Administrator</b> channel\n` +
    `③ Aktifkan permission <b>"Post Messages"</b>\n` +
    `④ Dapatkan Channel ID dengan cara:\n` +
    `   • Channel public: gunakan <code>@username_channel</code>\n` +
    `   • Channel private: forward pesan ke @getidsbot untuk dapat ID\n\n` +
    `${SEP}\n\n` +
    `📢 <b>/setlogchannel</b>\n` +
    `Set channel log untuk tenant ini.\n` +
    `<code>/setlogchannel -1001234567890</code>\n` +
    `<code>/setlogchannel @namaChannel</code>\n` +
    `💡 <i>Jalankan tanpa argumen untuk menonaktifkan log channel.</i>\n\n` +
    `${SEP}\n\n` +
    `<b>📋 Format Pesan Log</b>\n` +
    `<code>🔄 Log {Kategori}\n\n` +
    `👤 Username: @username\n` +
    `📧 Email: user@gmail.com\n` +
    `📋 Subject: 123456\n` +
    `⏰ Received Time: 2026-01-01 12:00:00</code>\n\n` +
    `<i>👑 Master dapat mengatur channel per-tenant via <code>/settenantlog</code></i>`,

  ten: () =>
    `🏢 <b>Tenant</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `Kelola bot-bot yang terdaftar di KoalaVault.\n\n` +
    `${SEP}\n\n` +
    `➕ <b>/addtenant</b>\n` +
    `Daftarkan bot Telegram baru sebagai tenant.\n` +
    `<code>/addtenant\nNama Tenant\nBOT_TOKEN\nOWNER_TELEGRAM_ID\nDURASI_HARI (opsional)</code>\n` +
    `💡 <i>Tanpa durasi → aktif tanpa batas waktu. Dapatkan BOT_TOKEN dari @BotFather.</i>\n\n` +
    `${SEP}\n\n` +
    `📄 <b>/listtenant</b>\n` +
    `Tampilkan semua tenant beserta status aktif/nonaktif dan tanggal kadaluarsa.\n` +
    `<code>/listtenant</code>\n\n` +
    `${SEP}\n\n` +
    `⏳ <b>/extenttenant</b>\n` +
    `Perpanjang masa berlangganan tenant.\n` +
    `<code>/extenttenant\nTENANT_ID\nJUMLAH_HARI</code>\n` +
    `💡 <i>Dihitung dari tanggal berakhir sebelumnya (bukan dari hari ini).</i>\n\n` +
    `${SEP}\n\n` +
    `🚫 <b>/deactivatetenant</b>\n` +
    `Nonaktifkan tenant dan lepas webhook-nya.\n` +
    `<code>/deactivatetenant [tenant_id]</code>`,
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
