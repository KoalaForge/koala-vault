import type { BotContext } from '../../types'
import { config } from '../../config/env'

// ─── Master Help Sections ────────────────────────────────────────────────────

const MASTER_INTRO = `\
👑 <b>PANDUAN SETUP — MASTER BOT</b>
━━━━━━━━━━━━━━━━━━━━━

Sebagai <b>Master</b>, kamu bertanggung jawab atas:
• Membuat dan mengelola tenant bot klien
• Membuat kategori global (berlaku untuk semua tenant)
• Memantau status & perpanjang langganan tenant

Ikuti 3 fase berikut untuk memulai.`

const MASTER_FASE_1 = `\
📌 <b>FASE 1 — BUAT TENANT BOT BARU</b>
━━━━━━━━━━━━━━━━━━━━━

Setiap klien membutuhkan bot Telegram-nya sendiri.

<b>① Buat bot baru di @BotFather</b>
   Kirim <code>/newbot</code> ke @BotFather, ikuti instruksinya,
   lalu salin <b>BOT_TOKEN</b> yang diberikan.

<b>② Minta Telegram ID pemilik bot</b>
   Pemilik bisa cek Telegram ID mereka di @userinfobot.

<b>③ Daftarkan tenant di sini:</b>
<code>/addtenant
Nama Tenant
BOT_TOKEN_dari_BotFather
TELEGRAM_ID_pemilik
DURASI_HARI (opsional)</code>

   Contoh (dengan durasi 30 hari):
<code>/addtenant
Netflix Store
123456789:AAF_token_disini
987654321
30</code>

   💡 <i>Tanpa baris durasi → tenant aktif tanpa batas waktu.</i>

<b>④ Verifikasi tenant aktif:</b>
   <code>/listtenant</code>

💡 <i>Bot langsung aktif dan webhook otomatis terpasang setelah tenant dibuat.</i>`

const MASTER_FASE_2 = `\
📌 <b>FASE 2 — BUAT KATEGORI GLOBAL</b>
━━━━━━━━━━━━━━━━━━━━━

Kategori menentukan jenis kode/konten yang dicari dari email.
Kategori global berlaku untuk <b>semua tenant</b>.

<b>① Buat kategori baru:</b>
<code>/addcategory
Nama Kategori
Kata kunci subject 1|Kata kunci subject 2
primary_regex
fallback_regex (opsional)</code>

   Contoh (OTP 4-8 digit + fallback):
<code>/addcategory
Sign In Code
Sign in code|Kode masuk|Your code
(\d{4,8})
code[:\s]+(\d{4,8})</code>

   Contoh (link verifikasi):
<code>/addcategory
Verify Email
Verify your email|Konfirmasi email
(https://[^\s"]+verify[^\s"]+)</code>

<b>② Jadikan default agar semua user otomatis bisa akses:</b>
   <code>/setdefaultcategory [slug]</code>

<b>③ Verifikasi (kategori 📌 DEFAULT sudah aktif):</b>
   <code>/listcategories</code>

<b>④ Edit regex kategori yang sudah ada:</b>
<code>/editcategory
CATEGORY_SLUG
primary_regex_baru
fallback_regex (opsional)</code>

<b>⑤ Tambah kata kunci subject tambahan jika perlu:</b>
   <code>/addsubject [slug] keyword1|keyword2</code>

<b>⑥ Hapus kategori yang tidak terpakai:</b>
   <code>/deletecategory [slug]</code>`

const MASTER_FASE_3 = `\
📌 <b>FASE 3 — KELOLA TENANT</b>
━━━━━━━━━━━━━━━━━━━━━

<b>Lihat semua tenant beserta statusnya:</b>
   <code>/listtenant</code>

<b>Perpanjang langganan tenant:</b>
<code>/extenttenant
TENANT_ID
30</code>
   ⬆️ Tambah 30 hari dari tanggal berakhir saat ini.

<b>Nonaktifkan tenant (bot langsung berhenti):</b>
   <code>/deactivatetenant [tenantId]</code>

─────────────────────

📌 <b>SETELAH TENANT DIBUAT — INFO UNTUK ADMIN</b>

Setelah tenant dibuat, <b>pemilik bot (admin)</b> harus melakukan setup berikut di bot mereka:

   ✅ Setup koneksi email
   ✅ Daftarkan email yang bisa dicari user
   ✅ Konfigurasi akses (persetujuan on/off)
   ✅ Tandai kategori sebagai default

💡 <i>Admin bisa ketik <code>/help</code> di bot mereka untuk panduan lengkap.</i>

─────────────────────

📌 <b>LOG CHANNEL — PANTAU SEMUA TENANT</b>

<b>Set channel global (fallback semua tenant):</b>
   <code>/setlogchannel -1001234567890</code>
   ↳ Dijalankan di <b>master bot ini</b>. Bot master harus jadi admin channel.
   ↳ Semua tenant yang tidak punya channel sendiri akan log ke sini.

<b>Set channel untuk tenant tertentu:</b>
<code>/settenantlog TENANT_ID -1009876543210</code>
   ↳ Gunakan <code>/listtenant</code> untuk mendapatkan TENANT_ID.

<b>Nonaktifkan log channel tenant tertentu:</b>
   <code>/settenantlog TENANT_ID</code>`

const MASTER_REFERENCE = `\
📋 <b>REFERENSI COMMAND LENGKAP</b>
━━━━━━━━━━━━━━━━━━━━━

👑 <b>Master Commands:</b>
<code>/addtenant</code>        — Buat tenant bot baru
<code>/listtenant</code>       — Lihat semua tenant & statusnya
<code>/extenttenant</code>     — Perpanjang langganan tenant
<code>/deactivatetenant</code> — Nonaktifkan tenant

📁 <b>Kategori Global (Master):</b>
<code>/addcategory</code>      — Buat kategori global baru
<code>/listcategories</code>   — Lihat semua kategori + status DEFAULT
<code>/editcategory</code>     — Edit regex kategori (primary + fallback)
<code>/deletecategory</code>   — Hapus kategori
<code>/addsubject</code>       — Tambah kata kunci subject ke kategori

📢 <b>Log Channel (Master):</b>
<code>/settenantlog</code>     — Set channel log untuk tenant tertentu

🛠️ <b>Admin Commands (berlaku di master tenant ini):</b>
<code>/setimapgmail</code>     — Koneksi Gmail (cara termudah)
<code>/addimapconfig</code>    — Buat profil koneksi email baru
<code>/setdefaultimap</code>   — Aktifkan profil untuk semua email
<code>/setimap</code>          — Hubungkan email ke profil tertentu
<code>/delimapconfig</code>    — Hapus profil koneksi
<code>/listimap</code>         — Cek status koneksi email
<code>/addemail</code>         — Tambah email ke daftar
<code>/removemail</code>       — Hapus email dari daftar
<code>/listemails</code>       — Lihat email yang terdaftar
<code>/assignemail</code>      — Batasi email ke pengguna tertentu
<code>/deassignmail</code>     — Cabut batasan email
<code>/listassigned</code>     — Cek email yang dibatasi ke pengguna
<code>/togglewhitelist</code>  — Nyalakan/matikan mode persetujuan akses
<code>/whitelist</code>        — Tambah pengguna langsung
<code>/unwhitelist</code>      — Keluarkan pengguna
<code>/users</code>            — Lihat semua pengguna
<code>/setdefaultcategory</code> — Aktifkan jenis pencarian untuk semua
<code>/assigncategory</code>   — Aktifkan jenis pencarian untuk pengguna tertentu
<code>/deassigncategory</code> — Cabut dari pengguna tertentu
<code>/listcategoryassign</code> — Cek apa yang dilihat pengguna
<code>/panel</code>            — Dashboard admin`

// ─── Admin Help Sections ─────────────────────────────────────────────────────

const ADMIN_INTRO = `\
🛠️ <b>PANDUAN ADMIN BOT</b>
━━━━━━━━━━━━━━━━━━━━━

Halo! Selamat datang sebagai Admin.

Bot ini bertugas membantu penggunamu mengambil kode dari email — misalnya kode OTP, kode verifikasi, atau link konfirmasi.

Tugasmu adalah mengatur bot ini agar siap dipakai. Ikuti <b>4 langkah</b> berikut secara berurutan. Tidak perlu paham teknologi — setiap langkah sudah dijelaskan sejelas mungkin.`

const ADMIN_FASE_1 = `\
📌 <b>LANGKAH 1 — IZINKAN BOT BACA EMAIL</b>
━━━━━━━━━━━━━━━━━━━━━

Bot perlu "izin khusus" untuk bisa masuk dan membaca kotak masuk email. Bayangkan seperti memberikan kunci ke seseorang yang tugasnya mengambilkan surat.

─────────────────────
🌟 <b>Untuk Gmail (cara termudah)</b>

Gmail tidak mengizinkan aplikasi lain login dengan password biasa.
Kamu perlu membuat <b>App Password</b> — kode khusus untuk bot ini.

<b>📋 Cara buat App Password (ikuti urutan ini):</b>
① Buka di browser: <code>myaccount.google.com</code>
② Klik <b>Security</b> di menu kiri
③ Pastikan <b>2-Step Verification</b> sudah ON (aktifkan dulu jika belum)
④ Di halaman yang sama, cari <b>App passwords</b> → klik
⑤ Klik <b>Select app</b> → pilih <b>Mail</b>
⑥ Klik <b>Select device</b> → pilih <b>Other</b> → ketik nama bebas, mis: <i>Bot</i>
⑦ Klik <b>Generate</b> → salin 16 karakter yang muncul
   ⚠️ <i>Simpan sekarang — tidak bisa dilihat lagi setelah ditutup!</i>

Setelah punya App Password, kirim perintah ini:
<code>/setimapgmail
email_yang_mau_dicari@gmail.com
akun_gmail_kamu@gmail.com
AppPassword16KarakterDisini</code>

─────────────────────
⚙️ <b>Untuk email selain Gmail</b>

Hubungi penyedia email/hosting kamu dan minta info:
• Alamat server masuk (contoh: <code>mail.domainku.com</code>)
• Port server (biasanya <code>993</code>)
• Username dan password email

Setelah dapat, buat profil koneksi:
<code>/addimapconfig
NamaProfil
alamat.server.masuk
993
username@email.com
password_email</code>

Lalu aktifkan untuk semua email:
   <code>/setdefaultimap NamaProfil</code>

─────────────────────
<b>✅ Cek apakah sudah berhasil:</b>
   <code>/listimap</code>`

const ADMIN_FASE_2 = `\
📌 <b>LANGKAH 2 — TENTUKAN EMAIL YANG BOLEH DICARI</b>
━━━━━━━━━━━━━━━━━━━━━

Bot tidak mau membuka sembarang email. Kamu harus memberi tahu bot: email mana saja yang boleh dibuka oleh pengguna.

<b>① Tambah email (bisa sekaligus banyak, pisahkan spasi):</b>
   <code>/addemail toko@gmail.com cs@gmail.com</code>

<b>② Lihat daftar email yang sudah terdaftar:</b>
   <code>/listemails</code>

<b>③ Hapus email dari daftar:</b>
   <code>/removemail email@gmail.com</code>

─────────────────────
<b>[OPSIONAL] Batasi email ke pengguna tertentu</b>

Secara default, semua pengguna bisa mencari semua email yang terdaftar.

Kalau mau membatasi — misalnya Pelanggan A hanya boleh cari email tertentu:

<b>Batasi dengan batas waktu (isi angka hari):</b>
   <code>/assignemail [ID_pengguna] 30 email@gmail.com</code>
   ↳ Angka 30 artinya aktif 30 hari

<b>Batasi tanpa batas waktu:</b>
   <code>/assignemail [ID_pengguna] 0 email@gmail.com</code>
   ↳ Angka 0 artinya tidak ada batas waktu

<b>Lihat email mana yang dimiliki pengguna:</b>
   <code>/listassigned [ID_pengguna]</code>

<b>Cabut akses email dari pengguna:</b>
   <code>/deassignmail [ID_pengguna] email@gmail.com</code>

💡 <i>ID pengguna bisa dilihat dari <code>/users</code></i>`

const ADMIN_FASE_3 = `\
📌 <b>LANGKAH 3 — ATUR SIAPA YANG BOLEH PAKAI BOT</b>
━━━━━━━━━━━━━━━━━━━━━

Ada 2 pilihan cara mengatur akses ke bot:

<b>【TERBUKA】</b> ← aktif saat ini
Siapa pun yang punya link bot langsung bisa pakai tanpa persetujuan.

<b>【PERSETUJUAN】</b>
Pengguna baru harus kirim permintaan akses dulu.
Kamu akan dapat notifikasi → bisa setujui atau tolak dari tombol.
Cocok kalau tidak ingin sembarang orang masuk.

─────────────────────

<b>① Nyalakan/matikan mode persetujuan:</b>
   <code>/togglewhitelist</code>
   <i>(ketik ulang perintah yang sama untuk balik ke sebelumnya)</i>

<b>② Tambah pengguna langsung tanpa mereka perlu request:</b>
   <code>/whitelist [ID_pengguna]</code>

<b>③ Keluarkan pengguna dari bot:</b>
   <code>/unwhitelist [ID_pengguna]</code>

<b>④ Lihat semua pengguna beserta statusnya:</b>
   <code>/users</code>

💡 <i>Saat mode persetujuan aktif, kamu akan dapat notifikasi setiap ada yang minta akses. Cukup tekan ✅ Setujui atau ❌ Tolak — tidak perlu ketik perintah apapun.</i>`

const ADMIN_FASE_4 = `\
📌 <b>LANGKAH 4 — AKTIFKAN JENIS PENCARIAN</b>
━━━━━━━━━━━━━━━━━━━━━

"Jenis pencarian" menentukan <b>kode apa yang dicari</b> dari email — misalnya:
• Kode OTP 6 digit
• Link verifikasi email
• Kode transfer bank

Jenis pencarian sudah disiapkan oleh pengelola sistem. Tugasmu hanya mengaktifkan mana yang mau dipakai.

─────────────────────

<b>① Lihat jenis pencarian yang tersedia:</b>
   <code>/listcategories</code>
   ↳ Salin slug (bertanda 🏷️) di bawah nama kategori
   ↳ Yang bertanda <b>📌 DEFAULT</b> sudah aktif untuk semua pengguna

<b>② Aktifkan/nonaktifkan untuk semua pengguna:</b>
   <code>/setdefaultcategory [slug]</code>
   <i>(ketik ulang perintah yang sama untuk menonaktifkan)</i>

<b>③ Aktifkan hanya untuk pengguna tertentu:</b>
   <code>/assigncategory [slug] [ID_pengguna]</code>

<b>④ Cabut dari pengguna tertentu:</b>
   <code>/deassigncategory [slug] [ID_pengguna]</code>

<b>⑤ Cek apa yang bisa dilihat pengguna tertentu:</b>
   <code>/listcategoryassign [ID_pengguna]</code>

⚠️ <b>Penting:</b> Jika tidak ada jenis pencarian yang aktif, pengguna akan berhenti di tengah — tidak bisa lanjut setelah memasukkan email. Pastikan minimal 1 sudah diaktifkan!`

const ADMIN_LOG_CHANNEL = `\
📌 <b>[OPSIONAL] NOTIFIKASI HASIL PENCARIAN</b>
━━━━━━━━━━━━━━━━━━━━━

Fitur ini mengirim notifikasi otomatis ke channel Telegram setiap kali pengguna selesai mencari kode — termasuk jika hasilnya tidak ditemukan atau gagal.

Berguna jika kamu ingin memantau aktivitas tanpa menunggu laporan dari pengguna.

Jika tidak dikonfigurasi, bot tetap berjalan normal — hanya tidak ada notifikasi.

─────────────────────

<b>Cara setup:</b>
① Buat channel Telegram (bebas private atau publik)
② Tambahkan bot ini sebagai <b>Administrator</b> di channel tersebut
   → Aktifkan izin <b>Post Messages</b>
③ Dapatkan ID channel:
   • Channel publik: pakai username-nya, contoh <code>@namatoko</code>
   • Channel privat: forward salah satu pesan dari channel ke @getidsbot

<b>Aktifkan notifikasi:</b>
   <code>/setlogchannel @namaChannel</code>
   <code>/setlogchannel -1001234567890</code>

<b>Nonaktifkan notifikasi:</b>
   <code>/setlogchannel</code>  <i>(tanpa isi apapun setelahnya)</i>`

const ADMIN_CHECKLIST = `\
✅ <b>SETUP SELESAI — BOT SIAP DIPAKAI!</b>
━━━━━━━━━━━━━━━━━━━━━

Sebelum bagikan link bot ke pengguna, cek semua ini:

☐ <b>Bot bisa baca email</b>
   Ketik <code>/listimap</code> → harus ada isinya

☐ <b>Email sudah didaftarkan</b>
   Ketik <code>/listemails</code> → harus ada isinya

☐ <b>Mode akses sudah dipilih</b>
   Ketik <code>/togglewhitelist</code> untuk cek atau ubah

☐ <b>Minimal 1 jenis pencarian aktif</b>
   Ketik <code>/listcategories</code> → harus ada yang bertanda 📌 DEFAULT

☐ <b>[Opsional] Notifikasi channel dikonfigurasi</b>
   Ketik <code>/setlogchannel</code>

Setelah semua beres, bagikan link bot ke pengguna.
Pengguna cukup ketik <code>/start</code> untuk mulai!

─────────────────────
📋 <b>DAFTAR SEMUA PERINTAH</b>

🔌 <b>Koneksi Email:</b>
<code>/setimapgmail</code>   — Gmail (cukup email + App Password)
<code>/addimapconfig</code>  — Email lain (butuh data dari provider)
<code>/setdefaultimap</code> — Aktifkan satu profil untuk semua email
<code>/setimap</code>        — Hubungkan email tertentu ke profil
<code>/delimapconfig</code>  — Hapus profil koneksi
<code>/listimap</code>       — Cek status koneksi email

📬 <b>Email yang Boleh Dicari:</b>
<code>/addemail</code>       — Tambah email (bisa banyak sekaligus)
<code>/removemail</code>     — Hapus email dari daftar
<code>/listemails</code>     — Lihat daftar email terdaftar
<code>/assignemail</code>    — Batasi email ke pengguna tertentu + durasi
<code>/deassignmail</code>   — Cabut batasan email
<code>/listassigned</code>   — Cek email yang dibatasi ke pengguna

🚪 <b>Akses Pengguna:</b>
<code>/togglewhitelist</code> — Nyalakan/matikan mode persetujuan
<code>/whitelist</code>      — Tambah pengguna langsung
<code>/unwhitelist</code>    — Keluarkan pengguna
<code>/users</code>          — Lihat semua pengguna & statusnya

🔍 <b>Jenis Pencarian:</b>
<code>/listcategories</code>     — Lihat semua jenis pencarian + statusnya
<code>/setdefaultcategory</code> — Aktifkan/nonaktifkan untuk semua pengguna
<code>/assigncategory</code>     — Aktifkan untuk pengguna tertentu
<code>/deassigncategory</code>   — Cabut dari pengguna tertentu
<code>/listcategoryassign</code> — Cek apa yang bisa dilihat pengguna

📢 <b>Notifikasi:</b>
<code>/setlogchannel</code>  — Set channel Telegram untuk notifikasi hasil

🖥️ <b>Panel & Bantuan:</b>
<code>/panel</code>  — Buka menu admin
<code>/help</code>   — Tampilkan panduan ini`

// ─── Handler ─────────────────────────────────────────────────────────────────

class HandleHelp {
  async execute(ctx: BotContext): Promise<void> {
    const { tenant } = ctx.tenantContext
    const userId = String(ctx.from!.id)
    const isMasterOwner = userId === config.masterOwnerTelegramId

    if (isMasterOwner && tenant.isMaster) {
      await this.sendMasterHelp(ctx)
    } else {
      await this.sendAdminHelp(ctx, tenant.name)
    }
  }

  private async sendMasterHelp(ctx: BotContext): Promise<void> {
    const sections = [
      MASTER_INTRO,
      MASTER_FASE_1,
      MASTER_FASE_2,
      MASTER_FASE_3,
      MASTER_REFERENCE,
    ]
    for (const section of sections) {
      await ctx.reply(section, { parse_mode: 'HTML' })
    }
  }

  private async sendAdminHelp(ctx: BotContext, tenantName: string): Promise<void> {
    const intro = ADMIN_INTRO + `\n\n🏢 <b>Bot:</b> ${tenantName}`
    const sections = [
      intro,
      ADMIN_FASE_1,
      ADMIN_FASE_2,
      ADMIN_FASE_3,
      ADMIN_FASE_4,
      ADMIN_LOG_CHANNEL,
      ADMIN_CHECKLIST,
    ]
    for (const section of sections) {
      await ctx.reply(section, { parse_mode: 'HTML' })
    }
  }
}

export const handleHelp = new HandleHelp()
