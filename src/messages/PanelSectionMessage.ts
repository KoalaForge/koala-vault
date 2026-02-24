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
    `🔌 <b>Koneksi Email</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `Bot perlu izin untuk masuk dan membaca email.\n` +
    `Pilih cara sesuai jenis email kamu:\n\n` +
    `${SEP}\n\n` +
    `🌟 <b>/setimapgmail — Untuk Gmail (termudah)</b>\n` +
    `Cukup 3 baris: email yang dicari, akun Gmail, dan App Password.\n` +
    `<code>/setimapgmail\nemail_dicari@gmail.com\nakun@gmail.com\nAppPassword16Karakter</code>\n\n` +
    `❓ <i>App Password bukan password Gmail biasa.\n` +
    `Buat di: myaccount.google.com → Security → App passwords</i>\n\n` +
    `${SEP}\n\n` +
    `⚙️ <b>/addimapconfig — Email Selain Gmail</b>\n` +
    `Buat profil koneksi dengan nama yang mudah diingat.\n` +
    `Info server bisa ditanyakan ke penyedia email/hosting.\n` +
    `<code>/addimapconfig\nNamaProfil\nalamat.server.masuk\n993\nusername\npassword</code>\n\n` +
    `▶️ <b>/setdefaultimap — Aktifkan Profil untuk Semua Email</b>\n` +
    `<code>/setdefaultimap NamaProfil</code>\n\n` +
    `▶️ <b>/setimap — Hubungkan Email Tertentu ke Profil</b>\n` +
    `<code>/setimap\nemail@domain.com\nNamaProfil</code>\n\n` +
    `🗑️ <b>/delimapconfig — Hapus Profil</b>\n` +
    `<code>/delimapconfig NamaProfil</code>\n\n` +
    `${SEP}\n\n` +
    `📋 <b>/listimap — Cek Status Koneksi</b>\n` +
    `<code>/listimap</code>`,

  usr: () =>
    `👥 <b>Pengguna</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `Lihat semua pengguna yang pernah membuka bot beserta statusnya.\n\n` +
    `${SEP}\n\n` +
    `👥 <b>/users</b>\n` +
    `Tampilkan daftar pengguna dan status akses mereka.\n` +
    `<code>/users</code>\n\n` +
    `Status yang mungkin muncul:\n` +
    `✅ Disetujui — pengguna aktif, bisa pakai bot\n` +
    `⏳ Menunggu — sudah request, belum disetujui\n` +
    `❌ Ditolak — permintaan ditolak\n\n` +
    `💡 <i>Salin ID pengguna dari daftar ini jika ingin mengatur akses mereka.</i>`,

  wl: () =>
    `🚪 <b>Kontrol Akses</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `Atur siapa yang boleh menggunakan bot ini.\n\n` +
    `${SEP}\n\n` +
    `🔄 <b>/togglewhitelist — Nyalakan/Matikan Mode Persetujuan</b>\n` +
    `<code>/togglewhitelist</code>\n\n` +
    `Mode yang tersedia:\n` +
    `🟢 <b>TERBUKA</b> — siapa pun bisa langsung pakai bot\n` +
    `🔴 <b>PERSETUJUAN</b> — pengguna baru harus request akses dulu,\n` +
    `kamu akan dapat notifikasi dan bisa setujui/tolak dari tombol\n\n` +
    `${SEP}\n\n` +
    `✅ <b>/whitelist — Tambah Pengguna Langsung</b>\n` +
    `Tambah pengguna tanpa mereka perlu request.\n` +
    `<code>/whitelist 123456789</code>\n\n` +
    `${SEP}\n\n` +
    `❌ <b>/unwhitelist — Keluarkan Pengguna</b>\n` +
    `<code>/unwhitelist 123456789</code>\n\n` +
    `💡 <i>Lihat ID pengguna dari /users</i>`,

  reg: () =>
    `📬 <b>Kelola Email</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `Bot tidak mau membuka sembarang email. Kamu harus tentukan email mana saja yang boleh dicari pengguna.\n\n` +
    `${SEP}\n\n` +
    `➕ <b>/addemail — Tambah Email</b>\n` +
    `Bisa tambah banyak sekaligus, pisahkan dengan spasi.\n` +
    `<code>/addemail toko@gmail.com cs@gmail.com</code>\n\n` +
    `${SEP}\n\n` +
    `🗑️ <b>/removemail — Hapus Email</b>\n` +
    `<code>/removemail toko@gmail.com</code>\n\n` +
    `${SEP}\n\n` +
    `📄 <b>/listemails — Lihat Daftar Email</b>\n` +
    `<code>/listemails</code>\n\n` +
    `${SEP}\n\n` +
    `👤 <b>/assignemail — Batasi Email ke Pengguna Tertentu</b>\n` +
    `Secara default semua pengguna bisa cari semua email.\n` +
    `Gunakan ini jika ingin membatasi pengguna A hanya bisa cari email tertentu.\n` +
    `<code>/assignemail [ID_pengguna] [hari] [email]</code>\n` +
    `Contoh — aktif 30 hari: <code>/assignemail 123456 30 toko@gmail.com</code>\n` +
    `Contoh — tanpa batas: <code>/assignemail 123456 0 toko@gmail.com</code>\n\n` +
    `${SEP}\n\n` +
    `🔓 <b>/deassignmail — Cabut Batasan</b>\n` +
    `<code>/deassignmail 123456789 toko@gmail.com</code>\n\n` +
    `📋 <b>/listassigned — Cek Email yang Dimiliki Pengguna</b>\n` +
    `<code>/listassigned 123456789</code>`,

  cat: () =>
    `🔍 <b>Jenis Pencarian</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `"Jenis pencarian" menentukan kode apa yang dicari bot dari email — misalnya kode OTP, link verifikasi, dll.\n\n` +
    `Jenis pencarian sudah disiapkan oleh pengelola sistem. Tugasmu hanya mengaktifkan mana yang mau dipakai.\n\n` +
    `${SEP}\n\n` +
    `📄 <b>/listcategories — Lihat Semua Jenis Pencarian</b>\n` +
    `<code>/listcategories</code>\n` +
    `↳ Salin kode ID di depan nama (deretan huruf & angka)\n` +
    `↳ Yang bertanda 📌 DEFAULT sudah aktif untuk semua pengguna\n\n` +
    `${SEP}\n\n` +
    `📌 <b>/setdefaultcategory — Aktifkan/Nonaktifkan untuk Semua</b>\n` +
    `<code>/setdefaultcategory [ID_jenis_pencarian]</code>\n` +
    `<i>Ketik ulang perintah yang sama untuk menonaktifkan</i>\n\n` +
    `${SEP}\n\n` +
    `👤 <b>/assigncategory — Aktifkan untuk Pengguna Tertentu</b>\n` +
    `<code>/assigncategory [ID_jenis_pencarian] [ID_pengguna]</code>\n\n` +
    `🔓 <b>/deassigncategory — Cabut dari Pengguna Tertentu</b>\n` +
    `<code>/deassigncategory [ID_jenis_pencarian] [ID_pengguna]</code>\n\n` +
    `🔍 <b>/listcategoryassign — Cek Apa yang Dilihat Pengguna</b>\n` +
    `<code>/listcategoryassign [ID_pengguna]</code>\n\n` +
    `${SEP}\n\n` +
    `<i>👑 Membuat dan mengubah jenis pencarian hanya bisa dilakukan oleh Master.</i>`,

  log: () =>
    `📢 <b>Notifikasi Hasil Pencarian</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `Kirim notifikasi otomatis ke channel Telegram setiap kali pengguna selesai mencari kode dari email.\n\n` +
    `Berguna untuk memantau aktivitas tanpa menunggu laporan dari pengguna.\n` +
    `Jika tidak dikonfigurasi, bot tetap berjalan normal — hanya tidak ada notifikasi.\n\n` +
    `${SEP}\n\n` +
    `<b>Cara Setup:</b>\n` +
    `① Buat channel Telegram (private atau publik)\n` +
    `② Tambahkan bot ini sebagai <b>Administrator</b> channel\n` +
    `③ Aktifkan izin <b>Post Messages</b>\n` +
    `④ Dapatkan ID channel:\n` +
    `   • Channel publik: pakai username, contoh <code>@namatoko</code>\n` +
    `   • Channel privat: forward pesan dari channel ke @getidsbot\n\n` +
    `${SEP}\n\n` +
    `📢 <b>/setlogchannel — Aktifkan Notifikasi</b>\n` +
    `<code>/setlogchannel @namaChannel</code>\n` +
    `<code>/setlogchannel -1001234567890</code>\n\n` +
    `🚫 <b>Nonaktifkan Notifikasi:</b>\n` +
    `<code>/setlogchannel</code>  <i>(tanpa isi apapun)</i>\n\n` +
    `<i>👑 Master dapat mengatur notifikasi per-tenant via <code>/settenantlog</code></i>`,

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
