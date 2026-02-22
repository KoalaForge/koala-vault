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
   <code>/setdefaultcategory [categoryId]</code>

<b>③ Verifikasi (kategori 📌 DEFAULT sudah aktif):</b>
   <code>/listcategories</code>

<b>④ Edit regex kategori yang sudah ada:</b>
<code>/editcategory
CATEGORY_ID
primary_regex_baru
fallback_regex (opsional)</code>

<b>⑤ Tambah kata kunci subject tambahan jika perlu:</b>
   <code>/addsubject [categoryId] keyword1|keyword2</code>

<b>⑥ Hapus kategori yang tidak terpakai:</b>
   <code>/deletecategory [categoryId]</code>`

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

   ✅ Setup koneksi IMAP email
   ✅ Daftarkan email yang bisa dicari user
   ✅ Konfigurasi akses (whitelist on/off)
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
<code>/setprovider</code>      — Setup IMAP per-provider
<code>/setimap</code>          — Setup IMAP per-alamat email
<code>/listimap</code>         — Lihat konfigurasi IMAP
<code>/addemail</code>         — Tambah email ke pool
<code>/removemail</code>       — Hapus email dari pool
<code>/listemails</code>       — Lihat email di pool
<code>/assignemail</code>      — Assign email ke user tertentu
<code>/deassignmail</code>     — Cabut assignment email
<code>/listassigned</code>     — Lihat email yang di-assign ke user
<code>/togglewhitelist</code>  — Aktifkan/nonaktifkan whitelist
<code>/whitelist</code>        — Tambah user ke whitelist
<code>/unwhitelist</code>      — Hapus user dari whitelist
<code>/users</code>            — Lihat semua user
<code>/setdefaultcategory</code> — Toggle kategori jadi default
<code>/assigncategory</code>   — Assign kategori ke user tertentu
<code>/deassigncategory</code> — Cabut assignment kategori
<code>/listcategoryassign</code> — Lihat kategori yang di-assign ke user
<code>/panel</code>            — Dashboard admin`

// ─── Admin Help Sections ─────────────────────────────────────────────────────

const ADMIN_INTRO = `\
🛠️ <b>PANDUAN SETUP — ADMIN BOT</b>
━━━━━━━━━━━━━━━━━━━━━

Sebagai <b>Admin</b>, tugasmu adalah mengkonfigurasi bot ini agar user bisa mencari kode/konten dari email mereka.

Ikuti 4 fase berikut secara berurutan hingga bot siap dipakai.`

const ADMIN_FASE_1 = `\
📌 <b>FASE 1 — SETUP KONEKSI IMAP</b>
━━━━━━━━━━━━━━━━━━━━━

IMAP adalah protokol yang digunakan bot untuk <b>membaca email</b>.
Tanpa ini, bot tidak bisa mencari apapun.

Ada 2 cara setup — pilih salah satu:

<b>【A】Per-provider</b> (untuk semua email dengan domain yang sama)
<code>/setprovider
gmail
imap.gmail.com
993
akun@gmail.com
app_password_disini</code>

   💡 <b>Untuk Gmail</b>, gunakan App Password (bukan password biasa):
   Buka <code>myaccount.google.com</code> → Security → App passwords
   Pilih "Mail" → Generate → Salin 16 karakter

<b>【B】Per-alamat email</b> (untuk email berbeda-beda)
<code>/setimap
target@gmail.com
imap.gmail.com
993
username_imap
password_imap</code>

<b>✅ Verifikasi konfigurasi IMAP:</b>
   <code>/listimap</code>

💡 <i>Jika ada email yang butuh konfigurasi berbeda, gunakan <code>/setimap</code>
sebagai override — prioritasnya lebih tinggi dari setprovider.</i>`

const ADMIN_FASE_2 = `\
📌 <b>FASE 2 — DAFTARKAN EMAIL KE POOL</b>
━━━━━━━━━━━━━━━━━━━━━

Pool email adalah daftar email yang <b>boleh dicari</b> oleh user.
User tidak bisa mencari email yang belum didaftarkan di sini.

<b>① Tambahkan email ke pool (bisa sekaligus banyak):</b>
   <code>/addemail user@gmail.com kerja@gmail.com</code>

<b>② Verifikasi email di pool:</b>
   <code>/listemails</code>

<b>③ Hapus email dari pool:</b>
   <code>/removemail email@gmail.com</code>

─────────────────────
<b>【OPSIONAL】Batasi email per-user</b>

Secara default, semua user bisa mencari <b>semua email</b> di pool.
Jika ingin membatasi — user A hanya bisa cari email tertentu:

<b>Assign dengan batas waktu (30 hari):</b>
   <code>/assignemail [userId] 30 email@gmail.com</code>

<b>Assign tanpa batas waktu:</b>
   <code>/assignemail [userId] 0 email@gmail.com</code>

<b>Lihat assignment user:</b>
   <code>/listassigned [userId]</code>

<b>Cabut assignment:</b>
   <code>/deassignmail [userId] email@gmail.com</code>

💡 <i>Cari userId user dengan perintah <code>/users</code></i>`

const ADMIN_FASE_3 = `\
📌 <b>FASE 3 — KONFIGURASI AKSES USER</b>
━━━━━━━━━━━━━━━━━━━━━

Pilih mode akses yang sesuai untuk bot kamu:

<b>【MODE TERBUKA】</b> (default)
Siapa pun yang memulai bot langsung bisa menggunakannya.
Tidak perlu persetujuan admin.

<b>【MODE WHITELIST】</b>
User baru harus disetujui admin sebelum bisa menggunakan bot.
Cocok jika ingin kontrol penuh siapa yang bisa akses.

<b>① Aktifkan/nonaktifkan whitelist:</b>
   <code>/togglewhitelist</code>
   (jalankan lagi untuk toggle bolak-balik)

<b>② Tambah user langsung ke whitelist (tanpa menunggu mereka request):</b>
   <code>/whitelist [userId]</code>

<b>③ Hapus user dari whitelist:</b>
   <code>/unwhitelist [userId]</code>

<b>④ Lihat semua user beserta statusnya:</b>
   <code>/users</code>

💡 <i>Saat whitelist aktif, user baru yang klik /start akan mendapat pesan
"request access". Notifikasi masuk ke kamu sebagai admin — kamu bisa
<b>approve</b> atau <b>deny</b> langsung dari tombol di notifikasi tersebut.</i>`

const ADMIN_FASE_4 = `\
📌 <b>FASE 4 — KONFIGURASI KATEGORI</b>
━━━━━━━━━━━━━━━━━━━━━

Kategori menentukan <b>jenis kode/konten</b> yang dicari dari email.
Kategori dibuat oleh Master — tugasmu hanya mengaktifkan & mengaturnya.

<b>① Lihat kategori yang tersedia:</b>
   <code>/listcategories</code>
   ↳ Kategori dengan <b>📌 DEFAULT</b> sudah bisa dipakai semua user.

<b>② Jadikan kategori dapat diakses semua user (toggle):</b>
   <code>/setdefaultcategory [categoryId]</code>

<b>③ Assign kategori ke user tertentu saja:</b>
   <code>/assigncategory [categoryId] [userId]</code>

   Bisa banyak sekaligus:
   <code>/assigncategory [catId1] [catId2] [userId1] [userId2]</code>

<b>④ Cabut assignment kategori:</b>
   <code>/deassigncategory [categoryId] [userId]</code>

<b>⑤ Cek kategori apa yang dilihat user tertentu:</b>
   <code>/listcategoryassign [userId]</code>

💡 <i>User hanya melihat kategori DEFAULT + yang di-assign khusus ke mereka.
Jika tidak ada kategori default dan tidak ada assignment → user tidak bisa melanjutkan.</i>`

const ADMIN_LOG_CHANNEL = `\
📌 <b>[OPSIONAL] LOG CHANNEL</b>
━━━━━━━━━━━━━━━━━━━━━

Kirim notifikasi otomatis ke channel Telegram setiap kali pencarian email selesai.
Jika tidak dikonfigurasi, tidak ada yang dikirim — bot tetap berjalan normal.

<b>Persiapan:</b>
① Buat channel Telegram (public atau private)
② Tambah bot ini sebagai <b>Administrator</b> → aktifkan <b>"Post Messages"</b>
③ Dapatkan Channel ID:
   • Channel public: gunakan username, contoh <code>@mychannel</code>
   • Channel private: forward pesan dari channel ke @getidsbot

<b>Set log channel:</b>
   <code>/setlogchannel -1001234567890</code>
   <code>/setlogchannel @namaChannel</code>

<b>Nonaktifkan log channel:</b>
   <code>/setlogchannel</code> (tanpa argumen)

💡 <i>Jika tidak dikonfigurasi, log otomatis dikirim ke channel global master
(jika master sudah setup) via bot master — bukan bot kamu.</i>`

const ADMIN_CHECKLIST = `\
✅ <b>BOT SIAP DIGUNAKAN!</b>
━━━━━━━━━━━━━━━━━━━━━

Pastikan semua checklist berikut sudah selesai sebelum membagikan bot ke user:

☐ <b>IMAP dikonfigurasi</b> → cek dengan <code>/listimap</code>
☐ <b>Email pool diisi</b> → cek dengan <code>/listemails</code>
☐ <b>Mode akses ditentukan</b> → cek dengan <code>/togglewhitelist</code>
☐ <b>Minimal 1 kategori default aktif</b> → cek dengan <code>/listcategories</code>
☐ <b>[Opsional] Log channel dikonfigurasi</b> → <code>/setlogchannel</code>

Setelah semua selesai, bagikan link bot ke user.
User cukup ketik <code>/start</code> untuk mulai menggunakan.

─────────────────────
📋 <b>REFERENSI COMMAND LENGKAP</b>

⚙️ <b>IMAP:</b>
<code>/setprovider</code>      — Setup IMAP per-provider (Gmail, dll)
<code>/setimap</code>          — Setup IMAP per-alamat email (override)
<code>/listimap</code>         — Lihat semua konfigurasi IMAP

📧 <b>Email Pool:</b>
<code>/addemail</code>         — Tambah email ke pool global
<code>/removemail</code>       — Hapus email dari pool
<code>/listemails</code>       — Lihat semua email di pool

🔐 <b>Assignment Email (opsional):</b>
<code>/assignemail</code>      — Assign email ke user tertentu + durasi
<code>/deassignmail</code>     — Cabut assignment email
<code>/listassigned</code>     — Lihat email yang di-assign ke user

🔒 <b>Akses & Whitelist:</b>
<code>/togglewhitelist</code>  — Aktifkan/nonaktifkan whitelist
<code>/whitelist</code>        — Tambah user ke whitelist
<code>/unwhitelist</code>      — Hapus user dari whitelist
<code>/users</code>            — Lihat semua user & statusnya

📁 <b>Kategori:</b>
<code>/listcategories</code>   — Lihat semua kategori + status DEFAULT
<code>/setdefaultcategory</code> — Toggle kategori jadi default
<code>/assigncategory</code>   — Assign kategori ke user tertentu
<code>/deassigncategory</code> — Cabut assignment kategori
<code>/listcategoryassign</code> — Lihat kategori yang dilihat user

📢 <b>Log Channel:</b>
<code>/setlogchannel</code>    — Set channel Telegram untuk log hasil pencarian

🖥️ <b>Panel & Bantuan:</b>
<code>/panel</code>            — Buka dashboard admin
<code>/help</code>             — Tampilkan panduan ini`

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
