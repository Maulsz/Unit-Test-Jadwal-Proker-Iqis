/**
 * ============================================================================
 * JADWAL PROKER OSIS - BACKEND GOOGLE APPS SCRIPT DENGAN SISTEM PASSWORD ADMIN
 * ============================================================================
 * Proyek: Jadwal Proker OSIS (CRUD Web App)
 * Database: Google Sheets (Tab 'Kegiatan' & Tab 'Subscribers')
 * Backend: Google Apps Script Web App
 * Keamanan: Otentikasi & Otorisasi Berbasis Password Admin (Script Properties & Token)
 *
 * ============================================================================
 * PANDUAN PENTING: KONFIGURASI ADMIN PASSWORD & CARA DEPLOYMENT
 * ============================================================================
 * 
 * 1. DI MANA PASSWORD ADMIN DIKONFIGURASI?
 *    Password Admin TIDAK DISIMPAN di Google Sheets dan TIDAK DISIMPAN di frontend.
 *    Password disimpan secara aman pada fitur bawaan Google Apps Script yaitu:
 *    "Script Properties" (Properti Skrip).
 *
 * 2. CARA MEMBUAT SCRIPT PROPERTY 'ADMIN_PASSWORD_IKHWAN' & 'ADMIN_PASSWORD_AKHWAT':
 *    a. Buka editor Google Apps Script ini di peramban Anda.
 *    b. Di bilah sisi kiri (sidebar), klik ikon roda gigi ⚙️ "Project Settings"
 *       (Setelan Proyek).
 *    c. Gulir ke bawah hingga bagian "Script Properties" (Properti Skrip).
 *    d. Klik tombol "Add script property" (Tambahkan properti skrip).
 *    e. Masukkan:
 *       - Property : ADMIN_PASSWORD_IKHWAN  (untuk admin Ikhwan)
 *       - Value    : [Password Rahasia Anda]
 *       - Property : ADMIN_PASSWORD_AKHWAT  (untuk admin Akhwat)
 *       - Value    : [Password Rahasia Anda]
 *    f. Klik "Save script properties" (Simpan properti skrip).
 *
 * 3. CATATAN KEAMANAN MENGENAI PASSWORD:
 *    - JANGAN PERNAH menuliskan Password langsung di dalam baris kode ini.
 *    - JANGAN menaruh Password di Google Sheets atau di file JavaScript frontend.
 *    - Frontend HANYA menerima token sesi sementara (kedaluwarsa dalam 1 jam).
 *    - Frontend TIDAK PERNAH menerima atau mengetahui nilai Password asli yang tersimpan.
 *
 * 4. APA YANG HARUS DILAKUKAN SETELAH MENGUBAH CODE.GS?
 *    Setiap kali ada perubahan pada Code.gs, Web App HARUS DIPERBARUI agar versi
 *    kode terbaru yang dijalankan oleh Google server:
 *    a. Simpan file ini dengan menekan tombol disket (Save) atau Ctrl+S.
 *    b. Klik tombol biru "Deploy" di pojok kanan atas > pilih "Manage deployments"
 *       (Kelola penerapan).
 *    c. Pada daftar penerapan di sebelah kiri, pilih deployment Web App yang aktif.
 *    d. Klik ikon pensil ✏️ "Edit" di bagian kanan atas modal.
 *    e. Pada dropdown "Version" (Versi), pilih "New version" (Versi baru).
 *       (Anda bisa menuliskan catatan deskripsi versi, misal: "v3 - Program Kerja & Notifikasi").
 *    f. Pastikan:
 *       - Execute as: Me (email akun Google Anda)
 *       - Who has access: Anyone (Siapa saja)
 *    g. Klik tombol "Deploy".
 *
 * 5. APAKAH URL WEB APP BERUBAH?
 *    TIDAK. Jika Anda memperbarui deployment yang sudah ada melalui menu
 *    "Manage deployments" > "Edit" > "New version", maka URL Web App TETAP SAMA.
 *    Anda TIDAK PERLU mengubah konstanta APPS_SCRIPT_URL di script.js!
 *
 * 6. STRUKTUR 12 KOLOM TAB KEGIATAN:
 *    Tabel Kegiatan menggunakan 12 kolom terstruktur:
 *    [id, judul, deskripsi, lokasi, divisi, proker, petugas, tanggal_mulai, tanggal_selesai, jam_mulai, jam_selesai, status]
 *    Jangan menghapus sheet, mengubah nama tab, atau menukar urutan kolom secara manual.
 *
 * ============================================================================
 * LANGKAH WAJIB SETELAH UPDATE FITUR PROGRAM KERJA & NOTIFIKASI
 * ============================================================================
 * 1. BACKUP DULU: Buka Google Sheet kalender Anda -> Klik menu File -> Make a copy
 *    (Buat salinan) sebelum melakukan tindakan apa pun untuk mengamankan data yang ada.
 * 2. Ganti seluruh isi Code.gs di editor Apps Script dengan versi terbaru ini, lalu Save (Ctrl+S).
 * 3. Isi konstanta SITE_URL di bawah ini dengan URL website kalender asli tempat web di-hosting.
 * 4. Jalankan fungsi 'setupAll' sekali dari editor Apps Script:
 *    - Pada bilah toolbar atas editor, pilih fungsi 'setupAll' dari dropdown fungsi.
 *    - Klik tombol 'Run' (Jalankan).
 *    - Google akan menampilkan dialog 'Authorization Required' (Perizinan Diperlukan).
 *    - Klik 'Review permissions' -> Pilih akun Google Anda -> Klik 'Advanced' (Lanjutan)
 *      -> Klik 'Go to [Nama Proyek] (unsafe)' -> Klik 'Allow' (Izinkan).
 *    - Izin akses kini mencakup pengelolaan spreadsheet dan pengiriman email otomatis.
 * 5. Cek spreadsheet Google Sheet Anda:
 *    - Pada tab 'Kegiatan', pastikan kolom baru (divisi, proker, petugas) berada di kolom E, F, G
 *      dan data lama telah tergeser rapi ke kanan (tanggal_mulai di kolom H dst).
 *    - Pastikan tab baru 'Subscribers' telah otomatis terbuat dengan header 'email' & 'subscribed_at'.
 * 6. Deploy pembaruan: Klik Deploy -> Manage deployments -> Edit (ikon pensil) ->
 *    Pilih Version: New version -> Klik Deploy. (URL Web App TIDAK BERUBAH).
 * 7. Setel Zona Waktu Proyek: Klik ikon roda gigi ⚙️ 'Project Settings' di sidebar kiri ->
 *    Pastikan 'Time zone' disetel ke (GMT+08:00) Asia/Makassar (WITA).
 * 8. Atur Pemicu Email Harian (Trigger):
 *    - Di sidebar kiri, klik ikon jam pemicu (Triggers / Pemicu).
 *    - Klik '+ Add Trigger' di kanan bawah.
 *    - Choose which function to run : sendDailyReminderEmails
 *    - Choose which deployment     : Head
 *    - Select event source          : Time-driven (Berdasarkan waktu)
 *    - Select type of time based trigger : Day timer (Penentu waktu hari)
 *    - Select time of day           : Pilih jendela waktu, misal 06:00 to 07:00 (Pagi)
 *    - Klik 'Save'.
 * 9. Testing Fitur:
 *    - Buat 1 kegiatan uji coba dengan tanggal_mulai hari ini di web kalender.
 *    - Daftarkan email Anda melalui website (ikon email di navbar) atau tambahkan di tab Subscribers.
 *    - Di editor Apps Script, pilih fungsi 'sendDailyReminderEmails' lalu klik 'Run'.
 *    - Periksa inbox & folder Spam email Anda untuk memastikan email digest diterima dengan rapi.
 *    - Periksa menu 'Executions' di Apps Script jika terjadi kendala.
 * 10. Kuota Email: Akun Gmail pribadi (@gmail.com) memiliki kuota ~100 penerima/hari, sedangkan
 *     Google Workspace sekolah/organisasi hingga ~1.500 penerima/hari. Email dikirim atas nama akun Google Anda.
 * 11. Pendaftaran & Pembatalan Email: Bersifat publik mandiri tanpa PIN. Administrator disarankan
 *     memeriksa tab Subscribers secara berkala; baris email dapat dihapus manual jika diperlukan.
 * 12. Peringatan Struktur Data: Jangan mengubah nama tab 'Kegiatan' atau 'Subscribers', dan jangan
 *     mengubah urutan kolom header tabel.
 *
 * ============================================================================
 * PANDUAN PENGATURAN NOTIFIKASI TELEGRAM (IKHWAN & AKHWAT TERPISAH):
 * ============================================================================
 * 1. Buat Bot Telegram Baru via @BotFather:
 *    - Buka Telegram, cari @BotFather, ketik /newbot.
 *    - Beri nama dan username bot (contoh: OsisIqisReminderBot).
 *    - Salin HTTP API Token yang diberikan (format: 123456789:ABCdefGhIjk...).
 *    - JANGAN PERNAH commit atau bagikan Bot Token ini ke publik/GitHub!
 * 2. Masukkan Bot ke Grup / Saluran / Supergroup Forum:
 *    - Tambahkan bot ke grup/saluran Ikhwan dan grup/saluran Akhwat.
 *    - Jadikan bot sebagai ADMINISTRATOR dengan izin mengirim pesan (Post Messages / Send Messages).
 * 3. Dapatkan Chat ID & Topic ID (Opsional):
 *    - Cara termudah: Salin tautan pesan di grup (Klik kanan pesan -> Copy Message Link).
 *      Format link: t.me/c/<id>/<topic>/<msg> atau t.me/c/<id>/<msg>.
 *      Chat ID adalah -100<id> (misal id: 1234567890 -> Chat ID: -1001234567890).
 *      Topic ID (jika grup bertipe forum) adalah angka di bagian tengah <topic>.
 *      Jika bukan grup topik/forum, Topic ID tidak perlu diisi.
 *    - Cara alternatif: Buka https://api.telegram.org/bot<TOKEN>/getUpdates setelah mengirim pesan di grup.
 * 4. Atur Script Properties di Google Apps Script:
 *    - Klik Project Settings ⚙️ di bilah sisi kiri editor -> Gulir ke "Script Properties".
 *    - Tambahkan Properti WAJIB:
 *      * TELEGRAM_BOT_TOKEN       : [Token Bot dari @BotFather]
 *      * TELEGRAM_CHAT_ID_IKHWAN  : [Chat ID Grup/Channel Ikhwan, misal: -100xxxxxxxxxx]
 *      * TELEGRAM_CHAT_ID_AKHWAT  : [Chat ID Grup/Channel Akhwat, misal: -100yyyyyyyyyy]
 *    - Tambahkan Properti OPSIONAL (jika menggunakan grup Forum / Topik):
 *      * TELEGRAM_TOPIC_ID_IKHWAN : [Nomor ID Topik Ikhwan, misal: 2]
 *      * TELEGRAM_TOPIC_ID_AKHWAT : [Nomor ID Topik Akhwat, misal: 5]
 * 5. Jalankan Tes Koneksi:
 *    - Pilih fungsi 'testTelegramConnection' dari dropdown fungsi di bilah toolbar atas editor -> Klik 'Run'.
 *    - Ini akan memicu dialog 'Authorization Required' untuk izin UrlFetchApp (koneksi HTTP eksternal).
 *    - Klik 'Review Permissions' -> Izinkan akses.
 *    - Periksa tab 'Execution log' untuk memastikan pesan tes berhasil terkirim ke target Ikhwan dan Akhwat.
 * 6. Pasang 2 Pemicu Otomatis (Time-driven Triggers):
 *    a. Pemicu Digest Harian (sendTelegramDailyDigest):
 *       - Function: sendTelegramDailyDigest | Deployment: Head
 *       - Event source: Time-driven | Type: Day timer | Time: 06:00 to 07:00 (Pagi).
 *    b. Pemicu Pengingat Menjelang Kegiatan (sendTelegramReminders):
 *       - Function: sendTelegramReminders | Deployment: Head
 *       - Event source: Time-driven | Type: Minutes timer | Interval: Every 10 minutes (Setiap 10 menit).
 * ============================================================================
 */

// Konfigurasi ID Google Sheet
var SPREADSHEET_ID = "1JtHzXqL8Mqfmo63W_k38rnyOjjjUEgkzOpWnJ7MJOfc";

// URL website publik tempat frontend kalender dihosting (digunakan untuk tautan di footer email)
var SITE_URL = "https://proker-osis-iqis.vercel.app";

// Nama sheet/tab untuk menyimpan data kegiatan
var SHEET_NAME = "Kegiatan";

// Nama properti di Script Properties untuk menyimpan Password Admin (Ikhwan & Akhwat)
var ADMIN_PASSWORD_IKHWAN_PROPERTY_NAME = "ADMIN_PASSWORD_IKHWAN";
var ADMIN_PASSWORD_AKHWAT_PROPERTY_NAME = "ADMIN_PASSWORD_AKHWAT";

// Durasi masa aktif sesi token admin (1 jam = 3600 detik)
var TOKEN_EXPIRATION_SECONDS = 3600;

// Konfigurasi Pengingat & Notifikasi Telegram
var TELEGRAM_REMINDER_MINUTES_BEFORE = 30;
var TELEGRAM_NOTIFY_ENABLED = true;

// Struktur kolom tabel kegiatan (Jadwal Program Kerja OSIS - 13 Kolom dengan Unit)
var HEADERS = [
  "id",
  "judul",
  "deskripsi",
  "lokasi",
  "divisi",
  "proker",
  "petugas",
  "tanggal_mulai",
  "tanggal_selesai",
  "jam_mulai",
  "jam_selesai",
  "status",
  "unit"
];

// Konfigurasi sheet tab langganan email (Subscribers)
var SUBSCRIBERS_SHEET_NAME = "Subscribers";
var SUBSCRIBER_HEADERS = ["email", "subscribed_at", "status", "unsubscribed_at"];

// Konfigurasi sheet tab riwayat & arsip kegiatan (Arsip - 15 Kolom dengan Unit)
var ARCHIVE_SHEET_NAME = "Arsip";
var ARCHIVE_HEADERS = [
  "id",
  "judul",
  "deskripsi",
  "lokasi",
  "divisi",
  "proker",
  "petugas",
  "tanggal_mulai",
  "tanggal_selesai",
  "jam_mulai",
  "jam_selesai",
  "status",
  "status_pelaksanaan",
  "keterangan_pelaksanaan",
  "unit"
];

// ============================================================================
// HELPER OTENTIKASI & SISTEM TOKEN ADMIN PER-UNIT
// ============================================================================

/**
 * Mengambil Password Admin Ikhwan & Akhwat dari Script Properties secara aman.
 */
function getAdminPasswordsFromProperties() {
  try {
    var scriptProperties = PropertiesService.getScriptProperties();
    var passIkhwan = scriptProperties.getProperty(ADMIN_PASSWORD_IKHWAN_PROPERTY_NAME);
    var passAkhwat = scriptProperties.getProperty(ADMIN_PASSWORD_AKHWAT_PROPERTY_NAME);
    return {
      ikhwan: passIkhwan ? String(passIkhwan).trim() : null,
      akhwat: passAkhwat ? String(passAkhwat).trim() : null
    };
  } catch (err) {
    console.error("Gagal membaca Script Properties:", err);
    return { ikhwan: null, akhwat: null };
  }
}

/**
 * Mengambil atau membuat kunci rahasia HMAC (SESSION_SECRET) di Script Properties.
 * Kunci ini digunakan untuk menandatangani token sesi admin agar tidak dapat dipalsukan.
 */
function getOrCreateSessionSecret() {
  var scriptProperties = PropertiesService.getScriptProperties();
  var secret = scriptProperties.getProperty("SESSION_SECRET");
  if (!secret) {
    secret = Utilities.getUuid() + "_" + new Date().getTime();
    scriptProperties.setProperty("SESSION_SECRET", secret);
  }
  return secret;
}

/**
 * Membuat token sesi admin sementara yang ditandatangani HMAC-SHA256.
 * Payload mencakup: randomId|expiresAt|unit
 * Token berlaku selama TOKEN_EXPIRATION_SECONDS (1 jam).
 * Status aktif token juga dicatat di CacheService agar bisa di-revoke saat logout.
 */
function createAdminSessionToken(unitRole) {
  var secret = getOrCreateSessionSecret();
  var randomId = Utilities.getUuid();
  var expiresAt = new Date().getTime() + (TOKEN_EXPIRATION_SECONDS * 1000);
  var role = (unitRole === "Akhwat") ? "Akhwat" : "Ikhwan";

  // Payload: randomId|expiresAt|unit
  var payload = randomId + "|" + expiresAt + "|" + role;
  var signatureBytes = Utilities.computeHmacSha256Signature(payload, secret);
  var signature = Utilities.base64Encode(signatureBytes);

  // Token format: base64(payload).signature
  var token = Utilities.base64Encode(payload) + "." + signature;

  // Catat token aktif ke dalam CacheService
  try {
    var cache = CacheService.getScriptCache();
    cache.put("admin_session_" + randomId, "active", TOKEN_EXPIRATION_SECONDS);
  } catch (cacheErr) {
    console.warn("Peringatan CacheService saat pembuatan token:", cacheErr);
  }

  return {
    token: token,
    expiresAt: expiresAt,
    unit: role
  };
}

/**
 * Memvalidasi apakah token sesi admin valid, tanda tangan HMAC cocok,
 * belum kedaluwarsa, dan belum di-logout.
 * Mengembalikan objek: { valid: boolean, unit: string|null, randomId: string|null }
 */
function isValidAdminToken(token) {
  if (!token || typeof token !== "string" || token.indexOf(".") === -1) {
    return { valid: false, unit: null, randomId: null };
  }

  try {
    var parts = token.split(".");
    if (parts.length !== 2) return { valid: false, unit: null, randomId: null };

    var encodedPayload = parts[0];
    var providedSignature = parts[1];

    var secret = getOrCreateSessionSecret();
    var payloadBlob = Utilities.newBlob(Utilities.base64Decode(encodedPayload));
    var payload = payloadBlob.getDataAsString();

    var payloadParts = payload.split("|");
    // Format baru: randomId|expiresAt|unit (3 bagian)
    // Format lama: randomId|expiresAt (2 bagian) -> fallback ke Bersama/Ikhwan
    if (payloadParts.length < 2) return { valid: false, unit: null, randomId: null };

    var randomId = payloadParts[0];
    var expiresAt = parseInt(payloadParts[1], 10);
    var unit = (payloadParts.length >= 3 && payloadParts[2]) ? payloadParts[2] : "Ikhwan";

    // 1. Cek masa berlaku token (waktu sekarang vs waktu kedaluwarsa)
    if (isNaN(expiresAt) || new Date().getTime() > expiresAt) {
      return { valid: false, unit: null, randomId: null };
    }

    // 2. Verifikasi tanda tangan HMAC-SHA256
    var expectedSignatureBytes = Utilities.computeHmacSha256Signature(payload, secret);
    var expectedSignature = Utilities.base64Encode(expectedSignatureBytes);
    if (expectedSignature !== providedSignature) {
      return { valid: false, unit: null, randomId: null };
    }

    // 3. Cek apakah token telah di-logout di CacheService
    var cache = CacheService.getScriptCache();
    var cacheStatus = cache.get("admin_session_" + randomId);
    if (cacheStatus === "revoked") {
      return { valid: false, unit: null, randomId: null };
    }

    return { valid: true, unit: unit, randomId: randomId };
  } catch (err) {
    console.error("Kesalahan saat validasi token admin:", err);
    return { valid: false, unit: null, randomId: null };
  }
}

/**
 * Helper otorisasi: Memeriksa apakah admin dengan role tertentu berhak mengelola suatu unit kegiatan
 */
function isAuthorizedForUnit(adminRole, targetUnit) {
  if (!adminRole) return false;
  var target = String(targetUnit || "Bersama").trim();
  if (target === "Bersama") return true;
  return adminRole === target;
}

/**
 * Mencabut (revoke) token admin saat pengguna menekan tombol Logout.
 */
function revokeAdminToken(token) {
  if (!token || typeof token !== "string" || token.indexOf(".") === -1) {
    return;
  }
  try {
    var parts = token.split(".");
    var payloadBlob = Utilities.newBlob(Utilities.base64Decode(parts[0]));
    var payload = payloadBlob.getDataAsString();
    var randomId = payload.split("|")[0];

    var cache = CacheService.getScriptCache();
    cache.put("admin_session_" + randomId, "revoked", TOKEN_EXPIRATION_SECONDS);
  } catch (err) {
    console.warn("Gagal revoke token admin:", err);
  }
}

// ============================================================================
// HELPER DATABASE SPREADSHEET & MIGRASI
// ============================================================================

/**
 * Memeriksa dan memigrasi struktur tab Kegiatan jika masih menggunakan skema lama.
 * Idempoten dan aman dieksekusi berulang kali (dilindungi ScriptLock).
 * Memastikan kolom 'unit' (kolom ke-13) ada dan mem-backfill baris lama dengan 'Bersama'.
 */
function migrateEventsSheetIfNeeded(sheet) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {
    console.warn("Tidak dapat memperoleh lock untuk migrasi sheet:", e);
    return;
  }

  try {
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    if (lastRow === 0 || lastCol === 0) {
      return; // Sheet baru kosong
    }

    var headerValues = sheet.getRange(1, 1, 1, Math.max(lastCol, HEADERS.length)).getValues()[0];
    var col5Header = String(headerValues[4] || "").trim().toLowerCase();
    var needsMigration = false;
    var needsRepair = false;

    if (col5Header !== "divisi") {
      needsMigration = true;
    } else if (lastRow > 1) {
      // Kasus Perbaikan (REPAIR): Header baris 1 sudah tertimpa 'divisi',
      // namun data baris 2 masih menggunakan susunan 9 kolom lama (kolom 5 adalah tanggal)
      var sampleRow = sheet.getRange(2, 1, 1, Math.max(lastCol, HEADERS.length)).getValues()[0];
      var col5Val = String(sampleRow[4] || "").trim();
      var col8Val = String(sampleRow[7] || "").trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(col5Val) && !/^\d{4}-\d{2}-\d{2}$/.test(col8Val)) {
        needsRepair = true;
      }
    }

    if (needsMigration || needsRepair) {
      console.log("Menjalankan migrasi/perbaikan data divisi pada sheet 'Kegiatan'...");
      sheet.insertColumnsAfter(4, 3);
    }

    // Periksa kolom 'unit' (kolom ke-13)
    var currentLastCol = sheet.getLastColumn();
    var currentHeaders = sheet.getRange(1, 1, 1, Math.max(currentLastCol, HEADERS.length)).getValues()[0];
    var col13Header = String(currentHeaders[12] || "").trim().toLowerCase();

    if (currentLastCol < HEADERS.length || col13Header !== "unit" || needsMigration || needsRepair) {
      console.log("Menjalankan migrasi kolom 'unit' pada sheet 'Kegiatan'...");
      
      // Tulis ulang baris header lengkap 13 kolom
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#10b981");
      headerRange.setFontColor("#ffffff");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);

      // Atur lebar kolom proporsional
      sheet.setColumnWidth(1, 140); // id
      sheet.setColumnWidth(2, 220); // judul
      sheet.setColumnWidth(3, 260); // deskripsi
      sheet.setColumnWidth(4, 180); // lokasi
      sheet.setColumnWidth(5, 180); // divisi
      sheet.setColumnWidth(6, 200); // proker
      sheet.setColumnWidth(7, 150); // petugas
      sheet.setColumnWidth(8, 120); // tanggal_mulai
      sheet.setColumnWidth(9, 120); // tanggal_selesai
      sheet.setColumnWidth(10, 100); // jam_mulai
      sheet.setColumnWidth(11, 100); // jam_selesai
      sheet.setColumnWidth(12, 110); // status
      sheet.setColumnWidth(13, 120); // unit

      // Backfill data baris lama jika ada: unit = 'Bersama' jika kosong
      var updatedLastRow = sheet.getLastRow();
      if (updatedLastRow > 1) {
        var numDataRows = updatedLastRow - 1;
        var existingUnitValues = sheet.getRange(2, 13, numDataRows, 1).getValues();
        var backfillValues = [];
        var modified = false;

        for (var r = 0; r < numDataRows; r++) {
          var val = String(existingUnitValues[r][0] || "").trim();
          if (!val) {
            backfillValues.push(["Bersama"]);
            modified = true;
          } else {
            backfillValues.push([val]);
          }
        }

        if (modified) {
          sheet.getRange(2, 13, numDataRows, 1).setValues(backfillValues);
          console.log("Backfill unit='Bersama' berhasil pada " + numDataRows + " baris kegiatan.");
        }
      }

      console.log("Migrasi sheet 'Kegiatan' selesai.");
    }
  } finally {
    try {
      lock.releaseLock();
    } catch (err) {}
  }
}

/**
 * Fungsi pembantu untuk membuka atau membuat sheet 'Kegiatan' otomatis
 * beserta header dan migrasi jika diperlukan.
 */
function getOrCreateSheet() {
  var ss;
  try {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (err) {
    throw new Error("Gagal membuka Spreadsheet dengan ID: " + SPREADSHEET_ID + ". Pastikan ID benar dan izin akses telah diberikan.");
  }

  var sheet = ss.getSheetByName(SHEET_NAME);

  // Jika tab belum ada, buat tab baru
  if (!sheet) {
    var sheets = ss.getSheets();
    if (sheets.length === 1 && sheets[0].getLastRow() === 0 && sheets[0].getLastColumn() === 0) {
      sheet = sheets[0];
      sheet.setName(SHEET_NAME);
    } else {
      sheet = ss.insertSheet(SHEET_NAME);
    }
  }

  // Cek apakah baris pertama sudah berisi header
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow === 0 || lastCol === 0) {
    // Tulis header baru 13 kolom
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    
    // Format header
    var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#10b981");
    headerRange.setFontColor("#ffffff");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);

    // Atur lebar kolom
    sheet.setColumnWidth(1, 140); // id
    sheet.setColumnWidth(2, 220); // judul
    sheet.setColumnWidth(3, 260); // deskripsi
    sheet.setColumnWidth(4, 180); // lokasi
    sheet.setColumnWidth(5, 180); // divisi
    sheet.setColumnWidth(6, 200); // proker
    sheet.setColumnWidth(7, 150); // petugas
    sheet.setColumnWidth(8, 120); // tanggal_mulai
    sheet.setColumnWidth(9, 120); // tanggal_selesai
    sheet.setColumnWidth(10, 100); // jam_mulai
    sheet.setColumnWidth(11, 100); // jam_selesai
    sheet.setColumnWidth(12, 110); // status
    sheet.setColumnWidth(13, 120); // unit
  } else {
    // Sheet ada data: jalankan migrasi aman jika diperlukan
    migrateEventsSheetIfNeeded(sheet);
  }

  return sheet;
}

/**
 * Migrasi otomatis sheet 'Subscribers' jika masih menggunakan format lama (2 kolom).
 */
function migrateSubscribersSheetIfNeeded(sheet) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {
    console.warn("Tidak dapat memperoleh lock untuk migrasi sheet Subscribers:", e);
    return;
  }

  try {
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    if (lastRow === 0 || lastCol === 0) {
      return; // Sheet baru kosong
    }

    var headerValues = sheet.getRange(1, 1, 1, Math.max(lastCol, SUBSCRIBER_HEADERS.length)).getValues()[0];
    var col3Header = String(headerValues[2] || "").trim().toLowerCase();
    var needsMigration = false;

    // Deteksi jika struktur masih 2 kolom (header kolom 3 bukan 'status' atau jumlah kolom < 4)
    if (lastCol < 4 || col3Header !== "status") {
      needsMigration = true;
    }

    if (needsMigration) {
      console.log("Menjalankan migrasi data pada sheet 'Subscribers' (kolom lama: " + lastCol + ")...");

      // Sisipkan 2 kolom baru setelah kolom 2 (subscribed_at)
      if (lastCol <= 2) {
        sheet.insertColumnsAfter(2, 2);
      } else if (lastCol === 3) {
        sheet.insertColumnsAfter(3, 1);
      }

      // Tulis ulang baris header lengkap 4 kolom
      sheet.getRange(1, 1, 1, SUBSCRIBER_HEADERS.length).setValues([SUBSCRIBER_HEADERS]);
      var headerRange = sheet.getRange(1, 1, 1, SUBSCRIBER_HEADERS.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#10b981");
      headerRange.setFontColor("#ffffff");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);

      // Atur lebar kolom proporsional
      sheet.setColumnWidth(1, 280); // email
      sheet.setColumnWidth(2, 200); // subscribed_at
      sheet.setColumnWidth(3, 130); // status
      sheet.setColumnWidth(4, 200); // unsubscribed_at

      // Backfill data baris lama jika ada: status = 'subscribed', unsubscribed_at = ''
      if (lastRow > 1) {
        var numDataRows = lastRow - 1;
        var backfillValues = [];
        for (var r = 0; r < numDataRows; r++) {
          backfillValues.push(["subscribed", ""]);
        }
        sheet.getRange(2, 3, numDataRows, 2).setValues(backfillValues);
      }

      console.log("Migrasi sheet 'Subscribers' selesai.");
    }
  } finally {
    try {
      lock.releaseLock();
    } catch (err) {}
  }
}

/**
 * Fungsi pembantu untuk membuka atau membuat sheet tab 'Subscribers'
 * untuk menyimpan daftar email langganan notifikasi agenda.
 */
function getOrCreateSubscribersSheet() {
  var ss;
  try {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (err) {
    throw new Error("Gagal membuka Spreadsheet dengan ID: " + SPREADSHEET_ID);
  }

  var sheet = ss.getSheetByName(SUBSCRIBERS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SUBSCRIBERS_SHEET_NAME);
  }

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow === 0 || lastCol === 0) {
    sheet.getRange(1, 1, 1, SUBSCRIBER_HEADERS.length).setValues([SUBSCRIBER_HEADERS]);
    var headerRange = sheet.getRange(1, 1, 1, SUBSCRIBER_HEADERS.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#10b981");
    headerRange.setFontColor("#ffffff");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);

    sheet.setColumnWidth(1, 280); // email
    sheet.setColumnWidth(2, 200); // subscribed_at
    sheet.setColumnWidth(3, 130); // status
    sheet.setColumnWidth(4, 200); // unsubscribed_at
  } else {
    // Sheet ada data: jalankan migrasi aman jika diperlukan
    migrateSubscribersSheetIfNeeded(sheet);
  }

  return sheet;
}

/**
 * Migrasi otomatis sheet 'Arsip' jika kolom 'unit' (kolom ke-15) belum ada.
 */
function migrateArchiveSheetIfNeeded(sheet) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {
    console.warn("Tidak dapat memperoleh lock untuk migrasi sheet Arsip:", e);
    return;
  }

  try {
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    if (lastRow === 0 || lastCol === 0) {
      return;
    }

    var headerValues = sheet.getRange(1, 1, 1, Math.max(lastCol, ARCHIVE_HEADERS.length)).getValues()[0];
    var col15Header = String(headerValues[14] || "").trim().toLowerCase();

    if (lastCol < ARCHIVE_HEADERS.length || col15Header !== "unit") {
      console.log("Menjalankan migrasi kolom 'unit' pada sheet 'Arsip'...");

      sheet.getRange(1, 1, 1, ARCHIVE_HEADERS.length).setValues([ARCHIVE_HEADERS]);
      var headerRange = sheet.getRange(1, 1, 1, ARCHIVE_HEADERS.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#10b981");
      headerRange.setFontColor("#ffffff");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);

      sheet.setColumnWidth(1, 140);  // id
      sheet.setColumnWidth(2, 220);  // judul
      sheet.setColumnWidth(3, 260);  // deskripsi
      sheet.setColumnWidth(4, 180);  // lokasi
      sheet.setColumnWidth(5, 180);  // divisi
      sheet.setColumnWidth(6, 200);  // proker
      sheet.setColumnWidth(7, 150);  // petugas
      sheet.setColumnWidth(8, 120);  // tanggal_mulai
      sheet.setColumnWidth(9, 120);  // tanggal_selesai
      sheet.setColumnWidth(10, 100); // jam_mulai
      sheet.setColumnWidth(11, 100); // jam_selesai
      sheet.setColumnWidth(12, 110); // status
      sheet.setColumnWidth(13, 160); // status_pelaksanaan
      sheet.setColumnWidth(14, 280); // keterangan_pelaksanaan
      sheet.setColumnWidth(15, 120); // unit

      if (lastRow > 1) {
        var numDataRows = lastRow - 1;
        var existingUnitValues = sheet.getRange(2, 15, numDataRows, 1).getValues();
        var backfillValues = [];
        var modified = false;

        for (var r = 0; r < numDataRows; r++) {
          var val = String(existingUnitValues[r][0] || "").trim();
          if (!val) {
            backfillValues.push(["Bersama"]);
            modified = true;
          } else {
            backfillValues.push([val]);
          }
        }

        if (modified) {
          sheet.getRange(2, 15, numDataRows, 1).setValues(backfillValues);
          console.log("Backfill unit='Bersama' berhasil pada " + numDataRows + " baris arsip.");
        }
      }

      console.log("Migrasi sheet 'Arsip' selesai.");
    }
  } finally {
    try {
      lock.releaseLock();
    } catch (err) {}
  }
}

/**
 * Fungsi pembantu untuk membuka atau membuat sheet tab 'Arsip'
 * untuk menyimpan riwayat kegiatan yang telah selesai lebih dari 24 jam (15 Kolom).
 */
function getOrCreateArchiveSheet() {
  var ss;
  try {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (err) {
    throw new Error("Gagal membuka Spreadsheet dengan ID: " + SPREADSHEET_ID);
  }

  var sheet = ss.getSheetByName(ARCHIVE_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(ARCHIVE_SHEET_NAME);
  }

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow === 0 || lastCol === 0) {
    sheet.getRange(1, 1, 1, ARCHIVE_HEADERS.length).setValues([ARCHIVE_HEADERS]);
    var headerRange = sheet.getRange(1, 1, 1, ARCHIVE_HEADERS.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#10b981");
    headerRange.setFontColor("#ffffff");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);

    sheet.setColumnWidth(1, 140);  // id
    sheet.setColumnWidth(2, 220);  // judul
    sheet.setColumnWidth(3, 260);  // deskripsi
    sheet.setColumnWidth(4, 180);  // lokasi
    sheet.setColumnWidth(5, 180);  // divisi
    sheet.setColumnWidth(6, 200);  // proker
    sheet.setColumnWidth(7, 150);  // petugas
    sheet.setColumnWidth(8, 120);  // tanggal_mulai
    sheet.setColumnWidth(9, 120);  // tanggal_selesai
    sheet.setColumnWidth(10, 100); // jam_mulai
    sheet.setColumnWidth(11, 100); // jam_selesai
    sheet.setColumnWidth(12, 110); // status
    sheet.setColumnWidth(13, 160); // status_pelaksanaan
    sheet.setColumnWidth(14, 280); // keterangan_pelaksanaan
    sheet.setColumnWidth(15, 120); // unit
  } else {
    migrateArchiveSheetIfNeeded(sheet);
  }

  return sheet;
}

/**
 * Format respon standar JSON dengan ContentService
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Helper untuk mengonversi baris sheet menjadi objek kegiatan
 * Membaca posisi 13 kolom tetap (termasuk unit)
 */
function rowToObject(row) {
  var unitVal = String(row[12] || "").trim();
  if (!unitVal) unitVal = "Bersama";

  return {
    id: String(row[0] || ""),
    judul: String(row[1] || ""),
    deskripsi: String(row[2] || ""),
    lokasi: String(row[3] || ""),
    divisi: String(row[4] || ""),
    proker: String(row[5] || ""),
    petugas: String(row[6] || ""),
    tanggal_mulai: String(row[7] || ""),
    tanggal_selesai: String(row[8] || ""),
    jam_mulai: String(row[9] || ""),
    jam_selesai: String(row[10] || ""),
    status: String(row[11] || "confirmed"),
    unit: unitVal
  };
}

/**
 * Helper untuk mengonversi baris sheet Arsip menjadi objek riwayat kegiatan (15 Kolom termasuk unit)
 */
function rowToArchiveObject(row) {
  var unitVal = String(row[14] || "").trim();
  if (!unitVal) unitVal = "Bersama";

  return {
    id: String(row[0] || ""),
    judul: String(row[1] || ""),
    deskripsi: String(row[2] || ""),
    lokasi: String(row[3] || ""),
    divisi: String(row[4] || ""),
    proker: String(row[5] || ""),
    petugas: String(row[6] || ""),
    tanggal_mulai: String(row[7] || ""),
    tanggal_selesai: String(row[8] || ""),
    jam_mulai: String(row[9] || ""),
    jam_selesai: String(row[10] || ""),
    status: String(row[11] || "confirmed"),
    status_pelaksanaan: String(row[12] || "Belum Dinilai"),
    keterangan_pelaksanaan: String(row[13] || ""),
    unit: unitVal
  };
}

/**
 * ============================================================================
 * PANDUAN PENGATURAN TRIGGER AUTO-ARCHIVE (archiveExpiredEvents):
 * 1. Buka editor Google Apps Script ini.
 * 2. Di bilah sisi kiri, klik ikon jam pemicu (Triggers / Pemicu).
 * 3. Klik tombol "+ Add Trigger" (+ Tambahkan Pemicu) di kanan bawah.
 * 4. Tentukan konfigurasi pemicu:
 *    - Choose which function to run : archiveExpiredEvents
 *    - Choose which deployment     : Head
 *    - Select event source          : Time-driven (Berdasarkan waktu)
 *    - Select type of time based trigger : Hour timer (Penentu waktu jam)
 *    - Select hour interval         : Every hour (Setiap jam)
 * 5. Klik "Save" (Simpan).
 * ============================================================================
 *
 * Fungsi otomatis untuk memindahkan kegiatan yang telah berakhir lebih dari 24 jam
 * dari tab 'Kegiatan' ke tab 'Arsip'.
 */
function archiveExpiredEvents() {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (lockErr) {
    console.warn("Tidak dapat memperoleh lock untuk archiveExpiredEvents:", lockErr);
    return;
  }

  try {
    var eventsSheet = getOrCreateSheet();
    var lastRow = eventsSheet.getLastRow();
    if (lastRow <= 1) {
      console.log("Tidak ada kegiatan di tab Kegiatan untuk diarsipkan.");
      return;
    }

    var values = eventsSheet.getRange(2, 1, lastRow - 1, HEADERS.length).getDisplayValues();
    var archiveSheet = getOrCreateArchiveSheet();

    var now = new Date().getTime();
    var TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    var rowsToArchive = [];

    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var id = row[0];
      if (!id) continue;

      var startDateStr = String(row[7] || "").trim();
      var endDateStr = String(row[8] || "").trim() || startDateStr;
      var endTimeStr = String(row[10] || "").trim() || "23:59";

      if (!endDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(endDateStr)) {
        continue;
      }

      var timeParts = endTimeStr.split(":");
      var hour = timeParts.length >= 1 ? parseInt(timeParts[0], 10) : 23;
      var min = timeParts.length >= 2 ? parseInt(timeParts[1], 10) : 59;
      if (isNaN(hour)) hour = 23;
      if (isNaN(min)) min = 59;

      var dateParts = endDateStr.split("-");
      var yr = parseInt(dateParts[0], 10);
      var mo = parseInt(dateParts[1], 10);
      var dy = parseInt(dateParts[2], 10);

      // Zona Waktu Asia/Makassar (WITA, UTC+8)
      var endDateTimeMs = Date.UTC(yr, mo - 1, dy, hour - 8, min, 0);

      // Cek apakah sudah lewat lebih dari 24 jam sejak waktu selesai kegiatan
      if (now - endDateTimeMs > TWENTY_FOUR_HOURS_MS) {
        var archiveRow = [
          row[0],  // id
          row[1],  // judul
          row[2],  // deskripsi
          row[3],  // lokasi
          row[4],  // divisi
          row[5],  // proker
          row[6],  // petugas
          row[7],  // tanggal_mulai
          row[8],  // tanggal_selesai
          row[9],  // jam_mulai
          row[10], // jam_selesai
          row[11], // status
          "Belum Dinilai", // status_pelaksanaan
          "",      // keterangan_pelaksanaan
          String(row[12] || "Bersama").trim() || "Bersama" // unit
        ];
        rowsToArchive.push({
          rowIndex: i + 2,
          archiveRow: archiveRow,
          judul: row[1]
        });
      }
    }

    if (rowsToArchive.length === 0) {
      console.log("Tidak ada kegiatan kedaluwarsa (>24 jam) untuk diarsipkan.");
      return;
    }

    console.log("Menemukan " + rowsToArchive.length + " kegiatan yang memenuhi syarat untuk diarsipkan.");

    // 1. Tambahkan semua baris ke sheet Arsip
    for (var a = 0; a < rowsToArchive.length; a++) {
      archiveSheet.appendRow(rowsToArchive[a].archiveRow);
    }

    // 2. Hapus baris dari sheet Kegiatan dari bawah ke atas agar indeks baris tidak bergeser
    for (var d = rowsToArchive.length - 1; d >= 0; d--) {
      eventsSheet.deleteRow(rowsToArchive[d].rowIndex);
      console.log("Mengarsipkan: '" + rowsToArchive[d].judul + "' (baris " + rowsToArchive[d].rowIndex + ")");
    }

    console.log("archiveExpiredEvents selesai: " + rowsToArchive.length + " kegiatan berhasil dipindahkan ke Arsip.");

  } catch (err) {
    console.error("Kesalahan saat menjalankan archiveExpiredEvents:", err);
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}

/**
 * Helper untuk escape string HTML di sisi server
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Helper untuk mengonversi string jam ("H:mm" atau "HH:mm") menjadi total menit.
 * Nilai kosong atau tidak valid diperlakukan sebagai 99999 agar diurutkan di bagian paling akhir.
 */
function parseTimeToMinutes_(timeStr) {
  if (!timeStr) return 99999;
  var parts = String(timeStr).trim().split(":");
  if (parts.length < 2) return 99999;
  var hours = parseInt(parts[0], 10);
  var minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || minutes < 0) return 99999;
  return hours * 60 + minutes;
}

/**
 * Fungsi Setup Sekali Klik untuk Pemilik Spreadsheet
 * Buka Apps Script -> Pilih 'setupAll' -> Klik Run -> Izinkan hak akses (OAuth)
 */
function setupAll() {
  console.log("Memulai setup database Jadwal Proker OSIS...");
  var eventsSheet = getOrCreateSheet();
  console.log("Tab 'Kegiatan' siap (jumlah baris: " + eventsSheet.getLastRow() + ", kolom: " + eventsSheet.getLastColumn() + ").");
  var subSheet = getOrCreateSubscribersSheet();
  console.log("Tab 'Subscribers' siap (jumlah baris: " + subSheet.getLastRow() + ").");
  var arcSheet = getOrCreateArchiveSheet();
  console.log("Tab 'Arsip' siap (jumlah baris: " + arcSheet.getLastRow() + ", kolom: " + arcSheet.getLastColumn() + ").");
  var remainingQuota = MailApp.getRemainingDailyQuota();
  console.log("Sisa kuota pengiriman email hari ini: " + remainingQuota + " email.");
  console.log("Setup selesai dengan sukses!");
}

// ============================================================================
// ENDPOINT GET (AKSES PUBLIK KEGIATAN & AKSES TEROTORISASI ARSIP)
// ============================================================================
/**
 * - GET ?action=archive&token=... (mengambil daftar riwayat arsip - Hanya Admin Terotentikasi)
 * - GET ?id=... (mengambil 1 kegiatan spesifik dari Kegiatan - Publik)
 * - GET tanpa parameter (mengambil seluruh daftar kegiatan aktif dari Kegiatan - Publik)
 * Tab 'Subscribers' TIDAK PERNAH diekspos melalui doGet.
 */
function doGet(e) {
  try {
    // ------------------------------------------------------------------------
    // CABANG 1: AKSES ARSIP (Hanya Admin Terotentikasi via token)
    // ------------------------------------------------------------------------
    if (e && e.parameter && e.parameter.action === "archive") {
      var clientToken = e.parameter.token || "";
      var auth = isValidAdminToken(clientToken);
      if (!auth.valid) {
        return createJsonResponse({
          success: false,
          unauthorized: true,
          error: "Akses ditolak: Anda tidak memiliki izin atau sesi admin telah kedaluwarsa. Silakan login kembali dengan Password Admin."
        });
      }

      var archiveSheet = getOrCreateArchiveSheet();
      var lastArchiveRow = archiveSheet.getLastRow();
      if (lastArchiveRow <= 1) {
        return createJsonResponse({
          success: true,
          data: []
        });
      }

      var archiveValues = archiveSheet.getRange(2, 1, lastArchiveRow - 1, ARCHIVE_HEADERS.length).getDisplayValues();
      var archiveEvents = [];
      for (var a = 0; a < archiveValues.length; a++) {
        if (archiveValues[a][0] !== "") {
          archiveEvents.push(rowToArchiveObject(archiveValues[a]));
        }
      }

      return createJsonResponse({
        success: true,
        data: archiveEvents
      });
    }

    // ------------------------------------------------------------------------
    // CABANG 2: AKSES PUBLIK KEGIATAN AKTIF (Default)
    // ------------------------------------------------------------------------
    var sheet = getOrCreateSheet();
    var lastRow = sheet.getLastRow();

    // Jika hanya ada baris header (belum ada data kegiatan)
    if (lastRow <= 1) {
      return createJsonResponse({
        success: true,
        data: []
      });
    }

    var values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getDisplayValues();

    // Cek apakah ada parameter ?id=...
    var targetId = e && e.parameter && e.parameter.id ? String(e.parameter.id).trim() : null;

    if (targetId) {
      for (var i = 0; i < values.length; i++) {
        if (values[i][0] === targetId) {
          return createJsonResponse({
            success: true,
            data: rowToObject(values[i])
          });
        }
      }
      return createJsonResponse({
        success: false,
        error: "Kegiatan dengan ID '" + targetId + "' tidak ditemukan."
      });
    }

    // Jika tidak ada parameter ID, kembalikan seluruh list kegiatan
    var events = [];
    for (var j = 0; j < values.length; j++) {
      if (values[j][0] !== "") {
        events.push(rowToObject(values[j]));
      }
    }

    return createJsonResponse({
      success: true,
      data: events
    });

  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.message || "Terjadi kesalahan pada server saat membaca data."
    });
  }
}

// ============================================================================
// ENDPOINT POST (OTENTIKASI, LANGGANAN EMAIL & OPERASI CRUD TERLINDUNGI)
// ============================================================================
function doPost(e) {
  try {
    // Membaca payload dari e.postData.contents
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({
        success: false,
        error: "Permintaan tidak valid: data payload kosong."
      });
    }

    var requestBody;
    try {
      requestBody = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return createJsonResponse({
        success: false,
        error: "Format JSON payload tidak valid."
      });
    }

    var action = requestBody.action;
    var data = requestBody.data || {};
    var clientToken = requestBody.token || data.token || "";

    // ------------------------------------------------------------------------
    // AKSI 1: LOGIN ADMIN (Verifikasi Password Ikhwan vs Akhwat)
    // ------------------------------------------------------------------------
    if (action === "login") {
      var submittedPassword = String(requestBody.password || data.password || requestBody.pin || data.pin || "").trim();

      if (!submittedPassword) {
        return createJsonResponse({
          success: false,
          error: "Password Admin tidak boleh kosong."
        });
      }

      var passwords = getAdminPasswordsFromProperties();

      // Peringatan jika pengembang belum membuat Password di Script Properties
      if (!passwords.ikhwan && !passwords.akhwat) {
        return createJsonResponse({
          success: false,
          error: "Konfigurasi server belum lengkap: ADMIN_PASSWORD_IKHWAN atau ADMIN_PASSWORD_AKHWAT belum disetel di Script Properties Google Apps Script. Buka Project Settings > Script Properties."
        });
      }

      var resolvedUnit = null;
      if (passwords.ikhwan && submittedPassword === passwords.ikhwan) {
        resolvedUnit = "Ikhwan";
      } else if (passwords.akhwat && submittedPassword === passwords.akhwat) {
        resolvedUnit = "Akhwat";
      }

      // Validasi kesamaan Password
      if (!resolvedUnit) {
        return createJsonResponse({
          success: false,
          error: "Password Admin salah. Silakan periksa dan coba lagi."
        });
      }

      // Password Benar: Buat token sesi sementara (1 jam) dengan unit role
      var session = createAdminSessionToken(resolvedUnit);

      return createJsonResponse({
        success: true,
        message: "Login admin " + resolvedUnit + " berhasil.",
        token: session.token,
        expiresAt: session.expiresAt,
        unit: resolvedUnit
      });
    }

    // ------------------------------------------------------------------------
    // AKSI 2: VERIFIKASI SESI TOKEN
    // ------------------------------------------------------------------------
    else if (action === "verifySession") {
      var auth = isValidAdminToken(clientToken);
      return createJsonResponse({
        success: true,
        valid: auth.valid,
        unit: auth.unit,
        message: auth.valid ? ("Sesi admin " + (auth.unit || "") + " aktif.").trim() : "Sesi admin telah kedaluwarsa atau tidak valid."
      });
    }

    // ------------------------------------------------------------------------
    // AKSI 3: LOGOUT ADMIN (Mencabut token)
    // ------------------------------------------------------------------------
    else if (action === "logout") {
      if (clientToken) {
        revokeAdminToken(clientToken);
      }
      return createJsonResponse({
        success: true,
        message: "Logout admin berhasil."
      });
    }

    // ------------------------------------------------------------------------
    // AKSI 4: SUBSCRIBE EMAIL (Pendaftaran Notifikasi Agenda - Akses Publik)
    // ------------------------------------------------------------------------
    else if (action === "subscribeEmail") {
      var email = String(requestBody.email || data.email || "").trim().toLowerCase();
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        return createJsonResponse({
          success: false,
          error: "Format email tidak valid. Masukkan alamat email yang benar."
        });
      }

      var subLock = LockService.getScriptLock();
      try {
        subLock.waitLock(30000);
      } catch (lockErr) {
        return createJsonResponse({
          success: false,
          error: "Server sedang sibuk. Silakan coba beberapa saat lagi."
        });
      }

      try {
        var subSheet = getOrCreateSubscribersSheet();
        var lastSubRow = subSheet.getLastRow();
        var foundRowIndex = -1;
        var existingStatus = "";

        if (lastSubRow > 1) {
          var existingData = subSheet.getRange(2, 1, lastSubRow - 1, Math.max(subSheet.getLastColumn(), 4)).getDisplayValues();
          for (var s = 0; s < existingData.length; s++) {
            if (existingData[s][0].trim().toLowerCase() === email) {
              foundRowIndex = s + 2;
              existingStatus = String(existingData[s][2] || "").trim().toLowerCase();
              break;
            }
          }
        }

        var timestamp = Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd HH:mm:ss") + " WITA";

        if (foundRowIndex !== -1) {
          if (existingStatus === "subscribed") {
            return createJsonResponse({
              success: true,
              alreadySubscribed: true,
              email: email,
              message: "Email ini sudah terdaftar sebelumnya dalam daftar notifikasi agenda."
            });
          } else {
            // Re-subscribe email yang sebelumnya berstatus "unsubscribed"
            subSheet.getRange(foundRowIndex, 2, 1, 3).setValues([[timestamp, "subscribed", ""]]);
            return createJsonResponse({
              success: true,
              resubscribed: true,
              email: email,
              message: "Terima kasih! Email Anda berhasil didaftarkan kembali untuk menerima notifikasi agenda harian."
            });
          }
        } else {
          // Email baru: tambahkan baris baru dengan status "subscribed"
          subSheet.appendRow([email, timestamp, "subscribed", ""]);
          return createJsonResponse({
            success: true,
            email: email,
            message: "Terima kasih! Email Anda berhasil didaftarkan untuk menerima notifikasi agenda harian."
          });
        }
      } finally {
        try {
          subLock.releaseLock();
        } catch (e) {}
      }
    }

    // ------------------------------------------------------------------------
    // AKSI 5: UNSUBSCRIBE EMAIL (Berhenti Berlangganan - Soft Delete)
    // ------------------------------------------------------------------------
    else if (action === "unsubscribeEmail") {
      var emailToUnsub = String(requestBody.email || data.email || "").trim().toLowerCase();
      if (!emailToUnsub) {
        return createJsonResponse({
          success: false,
          error: "Alamat email wajib disertakan."
        });
      }

      var unsubLock = LockService.getScriptLock();
      try {
        unsubLock.waitLock(30000);
      } catch (lockErr) {
        return createJsonResponse({
          success: false,
          error: "Server sedang sibuk. Silakan coba beberapa saat lagi."
        });
      }

      try {
        var unsubSheet = getOrCreateSubscribersSheet();
        var lastUnsubRow = unsubSheet.getLastRow();
        var targetUnsubIndex = -1;

        if (lastUnsubRow > 1) {
          var subData = unsubSheet.getRange(2, 1, lastUnsubRow - 1, Math.max(unsubSheet.getLastColumn(), 4)).getDisplayValues();
          for (var u = 0; u < subData.length; u++) {
            var rowEmail = subData[u][0].trim().toLowerCase();
            var rowStatus = String(subData[u][2] || "").trim().toLowerCase();
            if (rowEmail === emailToUnsub && rowStatus === "subscribed") {
              targetUnsubIndex = u + 2;
              break;
            }
          }
        }

        if (targetUnsubIndex === -1) {
          return createJsonResponse({
            success: false,
            error: "Alamat email tidak ditemukan dalam daftar langganan notifikasi aktif."
          });
        }

        var unsubTimestamp = Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd HH:mm:ss") + " WITA";
        // Soft delete: perbarui status menjadi "unsubscribed" dan catat unsubscribed_at (jangan pernah deleteRow)
        unsubSheet.getRange(targetUnsubIndex, 3, 1, 2).setValues([["unsubscribed", unsubTimestamp]]);

        return createJsonResponse({
          success: true,
          email: emailToUnsub,
          message: "Berhasil! Anda telah berhenti berlangganan notifikasi agenda harian."
        });
      } finally {
        try {
          unsubLock.releaseLock();
        } catch (e) {}
      }
    }

    // ------------------------------------------------------------------------
    // AKSI 6: CHECK SUBSCRIPTION (Cek Status Langganan Email - Akses Publik)
    // ------------------------------------------------------------------------
    else if (action === "checkSubscription") {
      var checkEmail = String(requestBody.email || data.email || "").trim().toLowerCase();
      var emailRegexCheck = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!checkEmail || !emailRegexCheck.test(checkEmail)) {
        return createJsonResponse({
          success: false,
          error: "Format email tidak valid. Masukkan alamat email yang benar."
        });
      }

      try {
        var checkSheet = getOrCreateSubscribersSheet();
        var lastCheckRow = checkSheet.getLastRow();
        var isSubscribed = false;

        if (lastCheckRow > 1) {
          var checkValues = checkSheet.getRange(2, 1, lastCheckRow - 1, Math.max(checkSheet.getLastColumn(), 4)).getDisplayValues();
          for (var c = 0; c < checkValues.length; c++) {
            var cEmail = checkValues[c][0].trim().toLowerCase();
            var cStatus = String(checkValues[c][2] || "").trim().toLowerCase();
            if (cEmail === checkEmail && cStatus === "subscribed") {
              isSubscribed = true;
              break;
            }
          }
        }

        return createJsonResponse({
          success: true,
          subscribed: isSubscribed,
          email: checkEmail,
          message: isSubscribed ? "Email ini terdaftar aktif untuk menerima notifikasi." : "Email ini belum terdaftar dalam notifikasi agenda."
        });
      } catch (checkErr) {
        return createJsonResponse({
          success: false,
          error: checkErr.message || "Gagal memeriksa status langganan email."
        });
      }
    }

    // ========================================================================
    // PROTEKSI OTORISASI: OPERASI CRUD (CREATE, UPDATE, DELETE)
    // ========================================================================
    // Seluruh operasi di bawah ini WAJIB memiliki token sesi admin yang valid!
    var auth = isValidAdminToken(clientToken);
    if (action === "create" || action === "update" || action === "delete") {
      if (!auth.valid) {
        return createJsonResponse({
          success: false,
          unauthorized: true,
          error: "Akses ditolak: Anda tidak memiliki izin atau sesi admin telah kedaluwarsa. Silakan login kembali dengan Password Admin."
        });
      }
    }

    var sheet = getOrCreateSheet();

    // ------------------------------------------------------------------------
    // AKSI 7: CREATE (Tambah kegiatan baru - Hanya Admin Berwenang)
    // ------------------------------------------------------------------------
    if (action === "create") {
      if (!data.judul || !data.tanggal_mulai || !data.tanggal_selesai) {
        return createJsonResponse({
          success: false,
          error: "Field 'judul', 'tanggal_mulai', dan 'tanggal_selesai' wajib diisi."
        });
      }

      if (!data.divisi || String(data.divisi).trim() === "") {
        return createJsonResponse({
          success: false,
          error: "Field 'divisi' (Divisi Penanggung Jawab) wajib diisi."
        });
      }

      var submittedUnit = String(data.unit || "").trim();
      var validUnits = ["Ikhwan", "Akhwat", "Bersama"];
      if (!submittedUnit || validUnits.indexOf(submittedUnit) === -1) {
        return createJsonResponse({
          success: false,
          error: "Field 'unit' (Unit Satuan) wajib diisi ('Ikhwan', 'Akhwat', atau 'Bersama')."
        });
      }

      // Validasi hak akses unit admin
      if (!isAuthorizedForUnit(auth.unit, submittedUnit)) {
        return createJsonResponse({
          success: false,
          error: "Akses ditolak: Anda login sebagai admin " + auth.unit + " dan tidak dapat membuat kegiatan untuk unit " + submittedUnit + "."
        });
      }

      var newId = "evt_" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000);

      var newRow = [
        newId,
        data.judul || "",
        data.deskripsi || "",
        data.lokasi || "",
        data.divisi || "",
        data.proker || "",
        data.petugas || "",
        data.tanggal_mulai || "",
        data.tanggal_selesai || "",
        data.jam_mulai || "",
        data.jam_selesai || "",
        data.status || "confirmed",
        submittedUnit
      ];

      sheet.appendRow(newRow);

      return createJsonResponse({
        success: true,
        message: "Kegiatan berhasil ditambahkan.",
        data: rowToObject(newRow)
      });
    }

    // ------------------------------------------------------------------------
    // AKSI 8: UPDATE (Perbarui kegiatan yang ada - Hanya Admin Berwenang)
    // ------------------------------------------------------------------------
    else if (action === "update") {
      var updateId = data.id ? String(data.id).trim() : "";
      if (!updateId) {
        return createJsonResponse({
          success: false,
          error: "ID kegiatan wajib disertakan untuk melakukan update."
        });
      }

      if (!data.divisi || String(data.divisi).trim() === "") {
        return createJsonResponse({
          success: false,
          error: "Field 'divisi' (Divisi Penanggung Jawab) wajib diisi."
        });
      }

      var submittedUpdateUnit = String(data.unit || "").trim();
      var validUnitsList = ["Ikhwan", "Akhwat", "Bersama"];
      if (!submittedUpdateUnit || validUnitsList.indexOf(submittedUpdateUnit) === -1) {
        return createJsonResponse({
          success: false,
          error: "Field 'unit' (Unit Satuan) wajib diisi ('Ikhwan', 'Akhwat', atau 'Bersama')."
        });
      }

      var lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        return createJsonResponse({
          success: false,
          error: "Tidak ada data kegiatan di spreadsheet."
        });
      }

      var existingRows = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getDisplayValues();
      var foundRowIndex = -1;
      var existingUnit = "Bersama";

      for (var k = 0; k < existingRows.length; k++) {
        if (existingRows[k][0] === updateId) {
          foundRowIndex = k + 2;
          existingUnit = String(existingRows[k][12] || "Bersama").trim() || "Bersama";
          break;
        }
      }

      if (foundRowIndex === -1) {
        return createJsonResponse({
          success: false,
          error: "Kegiatan dengan ID '" + updateId + "' tidak ditemukan."
        });
      }

      // Validasi otorisasi: admin hanya boleh mengedit kegiatan unit miliknya / Bersama
      if (!isAuthorizedForUnit(auth.unit, existingUnit)) {
        return createJsonResponse({
          success: false,
          error: "Akses ditolak: Anda login sebagai admin " + auth.unit + " dan tidak dapat mengubah kegiatan unit " + existingUnit + "."
        });
      }

      // Validasi otorisasi target unit baru
      if (!isAuthorizedForUnit(auth.unit, submittedUpdateUnit)) {
        return createJsonResponse({
          success: false,
          error: "Akses ditolak: Anda login sebagai admin " + auth.unit + " dan tidak dapat mengubah unit kegiatan menjadi " + submittedUpdateUnit + "."
        });
      }

      var updatedRow = [
        updateId,
        data.judul || "",
        data.deskripsi || "",
        data.lokasi || "",
        data.divisi || "",
        data.proker || "",
        data.petugas || "",
        data.tanggal_mulai || "",
        data.tanggal_selesai || "",
        data.jam_mulai || "",
        data.jam_selesai || "",
        data.status || "confirmed",
        submittedUpdateUnit
      ];

      sheet.getRange(foundRowIndex, 1, 1, HEADERS.length).setValues([updatedRow]);

      return createJsonResponse({
        success: true,
        message: "Kegiatan berhasil diperbarui.",
        data: rowToObject(updatedRow)
      });
    }

    // ------------------------------------------------------------------------
    // AKSI 9: DELETE (Hapus kegiatan - Hanya Admin Berwenang)
    // ------------------------------------------------------------------------
    else if (action === "delete") {
      var deleteId = data.id ? String(data.id).trim() : "";
      if (!deleteId) {
        return createJsonResponse({
          success: false,
          error: "ID kegiatan wajib disertakan untuk melakukan penghapusan."
        });
      }

      var lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        return createJsonResponse({
          success: false,
          error: "Tidak ada data kegiatan di spreadsheet."
        });
      }

      var deleteRows = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getDisplayValues();
      var targetRowIndex = -1;
      var deleteUnit = "Bersama";

      for (var m = 0; m < deleteRows.length; m++) {
        if (deleteRows[m][0] === deleteId) {
          targetRowIndex = m + 2;
          deleteUnit = String(deleteRows[m][12] || "Bersama").trim() || "Bersama";
          break;
        }
      }

      if (targetRowIndex === -1) {
        return createJsonResponse({
          success: false,
          error: "Kegiatan dengan ID '" + deleteId + "' tidak ditemukan."
        });
      }

      // Validasi otorisasi hapus
      if (!isAuthorizedForUnit(auth.unit, deleteUnit)) {
        return createJsonResponse({
          success: false,
          error: "Akses ditolak: Anda login sebagai admin " + auth.unit + " dan tidak dapat menghapus kegiatan unit " + deleteUnit + "."
        });
      }

      sheet.deleteRow(targetRowIndex);

      return createJsonResponse({
        success: true,
        message: "Kegiatan berhasil dihapus.",
        data: { id: deleteId }
      });
    }

    // ------------------------------------------------------------------------
    // AKSI 10: UPDATE ARCHIVE STATUS (Evaluasi Pelaksanaan Kegiatan - Hanya Admin Berwenang)
    // ------------------------------------------------------------------------
    else if (action === "updateArchiveStatus") {
      if (!auth.valid) {
        return createJsonResponse({
          success: false,
          unauthorized: true,
          error: "Akses ditolak: Anda tidak memiliki izin atau sesi admin telah kedaluwarsa. Silakan login kembali dengan Password Admin."
        });
      }

      var targetArchiveId = String(requestBody.id || data.id || "").trim();
      var statusPelaksanaan = String(requestBody.status_pelaksanaan || data.status_pelaksanaan || "").trim();
      var keteranganPelaksanaan = String(requestBody.keterangan_pelaksanaan || data.keterangan_pelaksanaan || "").trim();

      if (!targetArchiveId) {
        return createJsonResponse({
          success: false,
          error: "ID kegiatan arsip wajib disertakan."
        });
      }

      var validStatuses = ["Terlaksana", "Tidak Terlaksana", "Belum Dinilai"];
      if (validStatuses.indexOf(statusPelaksanaan) === -1) {
        return createJsonResponse({
          success: false,
          error: "Status pelaksanaan tidak valid. Harus salah satu dari: 'Terlaksana', 'Tidak Terlaksana', atau 'Belum Dinilai'."
        });
      }

      var archiveLock = LockService.getScriptLock();
      try {
        archiveLock.waitLock(30000);
      } catch (lockErr) {
        return createJsonResponse({
          success: false,
          error: "Server sedang sibuk. Silakan coba beberapa saat lagi."
        });
      }

      try {
        var arcSheet = getOrCreateArchiveSheet();
        var lastArcRow = arcSheet.getLastRow();
        if (lastArcRow <= 1) {
          return createJsonResponse({
            success: false,
            error: "Tidak ada data kegiatan di sheet Arsip."
          });
        }

        var arcRows = arcSheet.getRange(2, 1, lastArcRow - 1, ARCHIVE_HEADERS.length).getDisplayValues();
        var targetArcRow = -1;
        var arcUnit = "Bersama";

        for (var p = 0; p < arcRows.length; p++) {
          if (arcRows[p][0] === targetArchiveId) {
            targetArcRow = p + 2;
            arcUnit = String(arcRows[p][14] || "Bersama").trim() || "Bersama";
            break;
          }
        }

        if (targetArcRow === -1) {
          return createJsonResponse({
            success: false,
            error: "Kegiatan arsip dengan ID '" + targetArchiveId + "' tidak ditemukan."
          });
        }

        // Validasi otorisasi evaluasi arsip
        if (!isAuthorizedForUnit(auth.unit, arcUnit)) {
          return createJsonResponse({
            success: false,
            error: "Akses ditolak: Anda login sebagai admin " + auth.unit + " dan tidak dapat mengevaluasi kegiatan unit " + arcUnit + "."
          });
        }

        // Update kolom 13 (status_pelaksanaan) dan kolom 14 (keterangan_pelaksanaan)
        arcSheet.getRange(targetArcRow, 13, 1, 2).setValues([[statusPelaksanaan, keteranganPelaksanaan]]);

        var fullUpdatedRow = arcSheet.getRange(targetArcRow, 1, 1, ARCHIVE_HEADERS.length).getDisplayValues()[0];

        return createJsonResponse({
          success: true,
          message: "Status evaluasi pelaksanaan berhasil diperbarui.",
          data: rowToArchiveObject(fullUpdatedRow)
        });
      } finally {
        try {
          archiveLock.releaseLock();
        } catch (e) {}
      }
    }

    // ------------------------------------------------------------------------
    // AKSI TIDAK DIKENALI
    // ------------------------------------------------------------------------
    else {
      return createJsonResponse({
        success: false,
        error: "Aksi '" + action + "' tidak dikenali. Gunakan: 'login', 'verifySession', 'logout', 'subscribeEmail', 'unsubscribeEmail', 'checkSubscription', 'create', 'update', 'delete', atau 'updateArchiveStatus'."
      });
    }

  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.message || "Terjadi kesalahan pada server saat memproses aksi."
    });
  }
}

// ============================================================================
// PENGIRIMAN EMAIL REMINDER HARIAN (EMAIL DIGEST DENGAN LABEL UNIT)
// ============================================================================
function sendDailyReminderEmails() {
  try {
    var todayStr = Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd");
    var todayIndoFull = Utilities.formatDate(new Date(), "Asia/Makassar", "dd MMMM yyyy");

    // 1. Ambil data kegiatan dari sheet utama
    var sheet = getOrCreateSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      console.log("Tidak ada kegiatan di database. Pengiriman email dilewati.");
      return;
    }

    var values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getDisplayValues();
    var todayEvents = [];

    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      if (!row[0]) continue;
      var evt = rowToObject(row);
      // Filter kegiatan: mulai hari ini ATAU kegiatan multi-hari yang sedang berlangsung hari ini
      var start = evt.tanggal_mulai;
      var end = evt.tanggal_selesai || evt.tanggal_mulai;
      if (start && end && start <= todayStr && end >= todayStr) {
        todayEvents.push(evt);
      }
    }

    // Jika tidak ada kegiatan hari ini, lewati (no empty digests)
    if (todayEvents.length === 0) {
      console.log("Tidak ada agenda kegiatan untuk hari ini (" + todayStr + "). Email reminder dilewati.");
      return;
    }

    // 2. Ambil daftar email dari sheet Subscribers (hanya penerima dengan status "subscribed")
    var subSheet = getOrCreateSubscribersSheet();
    var lastSubRow = subSheet.getLastRow();
    if (lastSubRow <= 1) {
      console.log("Belum ada email di tab Subscribers. Pengiriman email dilewati.");
      return;
    }

    var subValues = subSheet.getRange(2, 1, lastSubRow - 1, Math.max(subSheet.getLastColumn(), 4)).getDisplayValues();
    var recipientMap = {};
    var recipientEmails = [];
    for (var j = 0; j < subValues.length; j++) {
      var emailCandidate = subValues[j][0].trim().toLowerCase();
      var statusCandidate = String(subValues[j][2] || "").trim().toLowerCase();

      // Hanya masukkan subscriber aktif (status "subscribed"), lewati yang "unsubscribed"
      if (statusCandidate === "subscribed" && emailCandidate && emailCandidate.indexOf("@") !== -1 && !recipientMap[emailCandidate]) {
        recipientMap[emailCandidate] = true;
        recipientEmails.push(emailCandidate);
      }
    }

    if (recipientEmails.length === 0) {
      console.log("Tidak ada alamat email aktif berstatus 'subscribed' di tab Subscribers.");
      return;
    }

    // Cek sisa kuota email harian
    var remainingQuota = MailApp.getRemainingDailyQuota();
    if (remainingQuota <= 0) {
      console.warn("Kuota pengiriman email harian habis (0). Pengiriman email dibatalkan.");
      return;
    }

    if (remainingQuota < recipientEmails.length) {
      console.warn("Peringatan: Sisa kuota email (" + remainingQuota + ") lebih kecil dari jumlah subscriber (" + recipientEmails.length + "). Hanya mengirim ke " + remainingQuota + " penerima pertama.");
      recipientEmails = recipientEmails.slice(0, remainingQuota);
    }

    // Urutkan agenda berdasarkan jam mulai secara numerik
    todayEvents.sort(function (a, b) {
      return parseTimeToMinutes_(a.jam_mulai) - parseTimeToMinutes_(b.jam_mulai);
    });

    // 3. Susun isi email (Plain Text & HTML)
    var subject = "Agenda Hari Ini - Jadwal Proker OSIS (" + todayIndoFull + ")";

    var textLines = [
      "AGENDA HARI INI - JADWAL PROKER OSIS",
      "Tanggal: " + todayIndoFull + " (WITA)",
      "Jumlah Agenda: " + todayEvents.length + " Kegiatan",
      "==================================================",
      ""
    ];

    var htmlEventsList = "";

    for (var k = 0; k < todayEvents.length; k++) {
      var ev = todayEvents[k];
      var jamRange = (ev.jam_mulai || "-") + " - " + (ev.jam_selesai || "-") + " WITA";
      var unitLabel = ev.unit || "Bersama";

      textLines.push((k + 1) + ". " + ev.judul + " [" + unitLabel + "]");
      textLines.push("   - Unit    : " + unitLabel);
      textLines.push("   - Divisi  : " + (ev.divisi || "-"));
      if (ev.petugas) textLines.push("   - Petugas : " + ev.petugas);
      textLines.push("   - Waktu   : " + jamRange);
      textLines.push("   - Lokasi  : " + (ev.lokasi || "-"));
      if (ev.deskripsi) textLines.push("   - Catatan : " + ev.deskripsi);
      textLines.push("");

      var unitBadgeBg = "#f1f5f9";
      var unitBadgeColor = "#475569";
      var unitBadgeBorder = "#cbd5e1";
      if (unitLabel === "Ikhwan") {
        unitBadgeBg = "#e0f2fe";
        unitBadgeColor = "#0369a1";
        unitBadgeBorder = "#bae6fd";
      } else if (unitLabel === "Akhwat") {
        unitBadgeBg = "#fce7f3";
        unitBadgeColor = "#be185d";
        unitBadgeBorder = "#fbcfe8";
      }

      htmlEventsList += `
        <div style="background-color: #f8fafc; border-left: 4px solid #10b981; border-radius: 8px; padding: 14px 16px; margin-bottom: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="margin: 0 0 6px 0; display: flex; align-items: center; justify-content: space-between;">
            <h3 style="margin: 0; color: #0f172a; font-size: 16px;">${escapeHtml(ev.judul)}</h3>
            <span style="background-color: ${unitBadgeBg}; color: ${unitBadgeColor}; border: 1px solid ${unitBadgeBorder}; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 9999px; margin-left: 8px;">${escapeHtml(unitLabel)}</span>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155; line-height: 1.6;">
            <tr>
              <td style="width: 80px; font-weight: bold; vertical-align: top;">Unit</td>
              <td>: <strong style="color: ${unitBadgeColor};">${escapeHtml(unitLabel)}</strong></td>
            </tr>
            <tr>
              <td style="width: 80px; font-weight: bold; vertical-align: top;">Divisi</td>
              <td>: ${escapeHtml(ev.divisi || "-")}</td>
            </tr>
            ${ev.petugas ? `<tr><td style="font-weight: bold; vertical-align: top;">Petugas</td><td>: ${escapeHtml(ev.petugas)}</td></tr>` : ""}
            <tr>
              <td style="font-weight: bold; vertical-align: top;">Waktu</td>
              <td>: ${escapeHtml(jamRange)}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; vertical-align: top;">Lokasi</td>
              <td>: ${escapeHtml(ev.lokasi || "-")}</td>
            </tr>
            ${ev.deskripsi ? `<tr><td style="font-weight: bold; vertical-align: top;">Catatan</td><td>: <em>${escapeHtml(ev.deskripsi)}</em></td></tr>` : ""}
          </table>
        </div>
      `;
    }

    textLines.push("==================================================");
    textLines.push("Kunjungi Website: " + SITE_URL);
    textLines.push("Pesan ini dikirimkan otomatis oleh Sistem Jadwal Proker OSIS.");

    var plainBody = textLines.join("\n");

    var htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff;">
        <div style="border-bottom: 2px solid #10b981; padding-bottom: 14px; margin-bottom: 20px;">
          <h2 style="color: #059669; margin: 0 0 4px 0; font-size: 20px;">Jadwal Proker OSIS</h2>
          <p style="margin: 0; color: #64748b; font-size: 14px;">Agenda Hari Ini &middot; ${escapeHtml(todayIndoFull)} (WITA)</p>
        </div>
        
        <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          Halo, berikut adalah daftar program kerja dan kegiatan OSIS yang dijadwalkan berlangsung hari ini:
        </p>

        ${htmlEventsList}

        <div style="border-top: 1px solid #e2e8f0; margin-top: 28px; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
          <p style="margin: 0 0 6px 0;"><a href="${escapeHtml(SITE_URL)}" style="color: #059669; text-decoration: underline;">Buka Website Jadwal Proker OSIS</a></p>
          <p style="margin: 0 0 4px 0;">Email ini dikirimkan otomatis oleh Sistem Jadwal Proker OSIS.</p>
          <p style="margin: 0;">Untuk berhenti berlangganan, buka website Jadwal Proker OSIS di atas &rarr; klik ikon email di bilah atas &rarr; pilih <em>"Berhenti berlangganan?"</em>.</p>
        </div>
      </div>
    `;

    // 4. Kirim email ke seluruh subscribers
    var sentCount = 0;
    for (var n = 0; n < recipientEmails.length; n++) {
      try {
        MailApp.sendEmail({
          to: recipientEmails[n],
          subject: subject,
          body: plainBody,
          htmlBody: htmlBody
        });
        sentCount++;
      } catch (err) {
        console.warn("Gagal mengirim email ke " + recipientEmails[n] + ":", err);
      }
    }

    console.log("sendDailyReminderEmails selesai: " + sentCount + " dari " + recipientEmails.length + " email berhasil dikirim.");
  } catch (err) {
    console.error("Kesalahan saat menjalankan sendDailyReminderEmails:", err);
  }
}

// ============================================================================
// NOTIFIKASI TELEGRAM BACKEND (IKHWAN & AKHWAT TERPISAH)
// ============================================================================

/**
 * Helper internal untuk membaca konfigurasi bot dan target Telegram dari Script Properties.
 * Properti wajib: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID_IKHWAN, TELEGRAM_CHAT_ID_AKHWAT.
 * Properti opsional: TELEGRAM_TOPIC_ID_IKHWAN, TELEGRAM_TOPIC_ID_AKHWAT (untuk supergroup Forum).
 * Token bot TIDAK PERNAH dicatat (log) ke konsol.
 */
function telegramGetConfig_() {
  var props = PropertiesService.getScriptProperties();
  var token = (props.getProperty("TELEGRAM_BOT_TOKEN") || "").trim();
  var ikhwanChatId = (props.getProperty("TELEGRAM_CHAT_ID_IKHWAN") || "").trim();
  var akhwatChatId = (props.getProperty("TELEGRAM_CHAT_ID_AKHWAT") || "").trim();
  var ikhwanTopicId = (props.getProperty("TELEGRAM_TOPIC_ID_IKHWAN") || "").trim();
  var akhwatTopicId = (props.getProperty("TELEGRAM_TOPIC_ID_AKHWAT") || "").trim();

  return {
    token: token,
    targets: {
      Ikhwan: {
        unit: "Ikhwan",
        chatId: ikhwanChatId,
        topicId: ikhwanTopicId
      },
      Akhwat: {
        unit: "Akhwat",
        chatId: akhwatChatId,
        topicId: akhwatTopicId
      }
    }
  };
}

/**
 * Helper inti pengiriman pesan Telegram via Telegram Bot API (sendMessage).
 * - Target adalah pasangan (chatId, optional topicId).
 * - "message_thread_id" HANYA dikirim jika topicId berupa angka (integer).
 * - Tidak pernah mencatat token atau URL yang berisi token ke dalam log.
 * - Memotong teks jika melebihi batas 4096 karakter Telegram.
 * - Menganalisis respon kegagalan Telegram dan memberikan petunjuk error yang informatif.
 */
function telegramSendMessage_(target, htmlText) {
  if (!TELEGRAM_NOTIFY_ENABLED) {
    console.log("Notifikasi Telegram dinonaktifkan (TELEGRAM_NOTIFY_ENABLED = false).");
    return false;
  }

  var config = telegramGetConfig_();
  if (!config.token) {
    console.warn("TELEGRAM_BOT_TOKEN belum disetel di Script Properties. Pengiriman pesan Telegram dilewati.");
    return false;
  }

  if (!target || !target.chatId) {
    console.warn("Chat ID Telegram belum disetel untuk target " + (target && target.unit ? target.unit : "Unknown") + ". Pengiriman dilewati.");
    return false;
  }

  if (!htmlText || !String(htmlText).trim()) {
    return false;
  }

  var textStr = String(htmlText);
  // Pastikan mematuhi batas 4096 karakter per pesan Telegram
  var chunks = [];
  if (textStr.length <= 4096) {
    chunks.push(textStr);
  } else {
    var lines = textStr.split("\n");
    var currentChunk = "";
    for (var l = 0; l < lines.length; l++) {
      var line = lines[l];
      if ((currentChunk + "\n" + line).length > 4096) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = line;
      } else {
        currentChunk = currentChunk ? (currentChunk + "\n" + line) : line;
      }
    }
    if (currentChunk) chunks.push(currentChunk.trim());
  }

  var allSuccess = true;

  for (var c = 0; c < chunks.length; c++) {
    var payload = {
      chat_id: target.chatId,
      text: chunks[c],
      parse_mode: "HTML",
      disable_web_page_preview: true
    };

    if (target.topicId && /^-?\d+$/.test(String(target.topicId).trim())) {
      payload.message_thread_id = parseInt(String(target.topicId).trim(), 10);
    }

    var options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    try {
      // JANGAN PERNAH mencatat URL yang mengandung token ke log
      var response = UrlFetchApp.fetch("https://api.telegram.org/bot" + config.token + "/sendMessage", options);
      var resCode = response.getResponseCode();
      var resText = response.getContentText();
      var resJson = null;

      try {
        resJson = JSON.parse(resText);
      } catch (parseErr) {}

      if (resCode !== 200 || !resJson || !resJson.ok) {
        allSuccess = false;
        var desc = (resJson && resJson.description) ? resJson.description : ("HTTP " + resCode);
        var logMsg = "[Telegram Error] Unit: " + (target.unit || "Unknown") + " | Status: " + resCode + " | Deskripsi: " + desc;

        var lowerDesc = desc.toLowerCase();
        if (lowerDesc.indexOf("message thread not found") !== -1 || lowerDesc.indexOf("thread not found") !== -1) {
          logMsg += " -> Petunjuk: Topic ID salah, topik forum telah dihapus, atau grup bukan grup Forum.";
        } else if (lowerDesc.indexOf("chat not found") !== -1 || lowerDesc.indexOf("bot was kicked") !== -1) {
          logMsg += " -> Petunjuk: Bot belum dimasukkan ke grup/channel, bot dikeluarkan (kicked), atau Chat ID salah.";
        } else if (lowerDesc.indexOf("not enough rights") !== -1 || lowerDesc.indexOf("need administrator rights") !== -1) {
          logMsg += " -> Petunjuk: Bot tidak memiliki izin administrator untuk mengirim pesan di grup/channel ini.";
        }

        if (resJson && resJson.parameters && resJson.parameters.migrate_to_chat_id) {
          var newChatId = resJson.parameters.migrate_to_chat_id;
          logMsg += " -> Petunjuk: Grup telah di-upgrade menjadi supergroup! Harap perbarui Chat ID di Script Properties menjadi: " + newChatId;
        }

        console.warn(logMsg);
      }
    } catch (fetchErr) {
      allSuccess = false;
      // Sensor token jika secara tidak terduga muncul dalam pesan galat
      var safeErrMsg = String(fetchErr.message || fetchErr).replace(new RegExp(config.token, "g"), "[REDACTED_BOT_TOKEN]");
      console.error("[Telegram Error] Gagal melakukan request HTTP: " + safeErrMsg);
    }
  }

  return allSuccess;
}

/**
 * Format satu item kegiatan menjadi blok teks HTML Telegram
 */
function telegramFormatEventBlock_(ev, index) {
  var jamRange = (ev.jam_mulai ? ev.jam_mulai : "-") + " - " + (ev.jam_selesai ? ev.jam_selesai : "-") + " WITA";
  var isBersama = !ev.unit || String(ev.unit).trim().toLowerCase() === "bersama";

  var block = (index + 1) + ". <b>" + escapeHtml(ev.judul) + "</b>\n";
  if (isBersama) {
    block += "   🤝 <i>Bersama (Ikhwan & Akhwat)</i>\n";
  }
  block += "   ⏰ " + escapeHtml(jamRange) + "\n";
  block += "   🏢 " + escapeHtml(ev.lokasi || "-") + "\n";
  if (ev.petugas) {
    block += "   👤 " + escapeHtml(ev.petugas) + "\n";
  }
  block += "   🏷 " + escapeHtml(ev.divisi || "-") + "\n";
  if (ev.deskripsi) {
    block += "   📝 <i>" + escapeHtml(ev.deskripsi) + "</i>\n";
  }
  return block;
}

/**
 * Mengirim digest harian ke satu target (Ikhwan atau Akhwat).
 * Memecah pesan pada batas kegiatan jika panjang total melebihi 4096 karakter.
 */
function telegramSendDigestForUnit_(target, unitName, events, todayFormatted) {
  var header = "📋 <b>AGENDA HARI INI - " + unitName.toUpperCase() + "</b>\n" +
    "🗓 <i>" + todayFormatted + " (WITA)</i>\n" +
    "Jumlah Agenda: " + events.length + " Kegiatan\n" +
    "────────────────────\n\n";
  var footer = "\n────────────────────\n🌐 <a href=\"" + escapeHtml(SITE_URL) + "\">Buka Kalender Proker OSIS</a>";

  var eventBlocks = [];
  for (var i = 0; i < events.length; i++) {
    eventBlocks.push(telegramFormatEventBlock_(events[i], i));
  }

  var messages = [];
  var currentContent = header;

  for (var j = 0; j < eventBlocks.length; j++) {
    var block = eventBlocks[j];
    // Cek apakah menambahkan blok ini dan footer akan melebihi batas 4096 karakter
    if ((currentContent + block + footer).length <= 4096) {
      currentContent += block + "\n";
    } else {
      messages.push(currentContent.trim() + footer);
      currentContent = "📋 <b>AGENDA HARI INI - " + unitName.toUpperCase() + " (Lanjutan)</b>\n" +
        "────────────────────\n\n" + block + "\n";
    }
  }

  if (currentContent.trim().length > 0) {
    messages.push(currentContent.trim() + footer);
  }

  for (var m = 0; m < messages.length; m++) {
    telegramSendMessage_(target, messages[m]);
  }
}

/**
 * Fungsi Pemicu Harian (Time-driven Trigger): sendTelegramDailyDigest
 * Menjalankan ringkasan agenda kegiatan hari ini ke grup Telegram Ikhwan dan Akhwat secara TERPISAH.
 * - Menggunakan aturan "aktif hari ini" yang sama dengan sendDailyReminderEmails.
 * - Routing berdasarkan unit:
 *   * Ikhwan  -> Hanya dikirim ke target Ikhwan
 *   * Akhwat  -> Hanya dikirim ke target Akhwat
 *   * Bersama -> Dikirim ke KEDUA target
 * - Jika suatu unit tidak memiliki agenda hari ini, tidak ada pesan yang dikirimkan untuk unit tersebut (no empty digests).
 */
function sendTelegramDailyDigest() {
  if (!TELEGRAM_NOTIFY_ENABLED) {
    console.log("Notifikasi Telegram dinonaktifkan (TELEGRAM_NOTIFY_ENABLED = false).");
    return;
  }

  try {
    var config = telegramGetConfig_();
    if (!config.token) {
      console.warn("TELEGRAM_BOT_TOKEN belum disetel di Script Properties. Digest Telegram harian dibatalkan.");
      return;
    }

    if (!config.targets.Ikhwan.chatId && !config.targets.Akhwat.chatId) {
      console.warn("Chat ID Telegram Ikhwan maupun Akhwat belum disetel di Script Properties. Digest dibatalkan.");
      return;
    }

    var todayStr = Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd");
    var parts = todayStr.split("-");
    var yr = parseInt(parts[0], 10);
    var mo = parseInt(parts[1], 10) - 1;
    var dy = parseInt(parts[2], 10);
    var dObj = new Date(Date.UTC(yr, mo, dy, 4, 0, 0));

    var HARI_INDO = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    var BULAN_INDO = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    var todayFormatted = HARI_INDO[dObj.getUTCDay()] + ", " + dy + " " + BULAN_INDO[mo] + " " + yr;

    // 1. Ambil data kegiatan dari sheet
    var sheet = getOrCreateSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      console.log("Tidak ada data kegiatan di database. Digest Telegram dilewati.");
      return;
    }

    var values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getDisplayValues();
    var ikhwanEvents = [];
    var akhwatEvents = [];

    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      if (!row[0]) continue;
      var evt = rowToObject(row);

      var start = evt.tanggal_mulai;
      var end = evt.tanggal_selesai || evt.tanggal_mulai;

      // Filter: kegiatan yang aktif pada hari ini (WITA)
      if (start && end && start <= todayStr && end >= todayStr) {
        var unitClean = String(evt.unit || "Bersama").trim().toLowerCase();
        if (unitClean === "ikhwan") {
          ikhwanEvents.push(evt);
        } else if (unitClean === "akhwat") {
          akhwatEvents.push(evt);
        } else {
          // Bersama atau tidak diketahui -> masuk ke kedua target
          ikhwanEvents.push(evt);
          akhwatEvents.push(evt);
        }
      }
    }

    // Urutkan kegiatan berdasarkan jam mulai secara numerik
    ikhwanEvents.sort(function (a, b) {
      return parseTimeToMinutes_(a.jam_mulai) - parseTimeToMinutes_(b.jam_mulai);
    });
    akhwatEvents.sort(function (a, b) {
      return parseTimeToMinutes_(a.jam_mulai) - parseTimeToMinutes_(b.jam_mulai);
    });

    // 2. Kirim digest untuk Ikhwan (jika ada kegiatan)
    if (ikhwanEvents.length > 0) {
      if (config.targets.Ikhwan.chatId) {
        telegramSendDigestForUnit_(config.targets.Ikhwan, "Ikhwan", ikhwanEvents, todayFormatted);
        console.log("Telegram digest Ikhwan berhasil dikirim (" + ikhwanEvents.length + " kegiatan).");
      } else {
        console.warn("TELEGRAM_CHAT_ID_IKHWAN belum disetel. Melewati digest Ikhwan.");
      }
    } else {
      console.log("Tidak ada agenda kegiatan hari ini untuk Ikhwan. Digest Ikhwan tidak dikirim (no empty digest).");
    }

    // 3. Kirim digest untuk Akhwat (jika ada kegiatan)
    if (akhwatEvents.length > 0) {
      if (config.targets.Akhwat.chatId) {
        telegramSendDigestForUnit_(config.targets.Akhwat, "Akhwat", akhwatEvents, todayFormatted);
        console.log("Telegram digest Akhwat berhasil dikirim (" + akhwatEvents.length + " kegiatan).");
      } else {
        console.warn("TELEGRAM_CHAT_ID_AKHWAT belum disetel. Melewati digest Akhwat.");
      }
    } else {
      console.log("Tidak ada agenda kegiatan hari ini untuk Akhwat. Digest Akhwat tidak dikirim (no empty digest).");
    }

  } catch (err) {
    console.error("Kesalahan saat menjalankan sendTelegramDailyDigest:", err);
  }
}

/**
 * Fungsi Pemicu Berkala (Setiap 10 Menit): sendTelegramReminders
 * Mengirimkan pengingat instan ~30 menit sebelum kegiatan dimulai.
 * - Menggunakan LockService.tryLock(...) agar proses tidak pernah tumpang tindih.
 * - Menghitung waktu mulai dalam WITA persis seperti archiveExpiredEvents.
 * - Logika "di dalam rentang + deduplikasi" (0 < minutesUntilStart <= TELEGRAM_REMINDER_MINUTES_BEFORE).
 * - Melewati kegiatan tanpa jam_mulai atau kegiatan yang sudah lewat.
 * - Menyimpan riwayat pengingat di Script Properties dengan format kunci 'tgrem_<id>_<tgl>_<jam>_<unit>'.
 * - Membersihkan (pruning) kunci pengingat yang berumur lebih dari 2 hari di akhir run tanpa menyentuh properti lain.
 */
function sendTelegramReminders() {
  if (!TELEGRAM_NOTIFY_ENABLED) {
    console.log("Notifikasi Telegram dinonaktifkan (TELEGRAM_NOTIFY_ENABLED = false).");
    return;
  }

  var lock = LockService.getScriptLock();
  var hasLock = false;
  try {
    hasLock = lock.tryLock(10000);
  } catch (lockErr) {
    console.warn("Gagal mencoba lock untuk sendTelegramReminders:", lockErr);
    return;
  }
  if (!hasLock) {
    console.log("sendTelegramReminders sedang berjalan di proses lain. Melewati run ini.");
    return;
  }

  try {
    var config = telegramGetConfig_();
    if (!config.token) {
      console.warn("TELEGRAM_BOT_TOKEN belum disetel di Script Properties. Reminder Telegram dilewati.");
      return;
    }

    var sheet = getOrCreateSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return;
    }

    var values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getDisplayValues();
    var props = PropertiesService.getScriptProperties();
    var allProps = props.getProperties();
    var nowMs = new Date().getTime();

    var sentRemindersCount = 0;

    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      if (!row[0]) continue;
      var evt = rowToObject(row);

      var startDateStr = String(evt.tanggal_mulai || "").trim();
      var startTimeStr = String(evt.jam_mulai || "").trim();

      // Lewati kegiatan tanpa tanggal mulai yang valid atau tanpa jam mulai
      if (!startDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(startDateStr) || !startTimeStr) {
        continue;
      }

      var timeParts = startTimeStr.split(":");
      if (timeParts.length < 2) continue;
      var hour = parseInt(timeParts[0], 10);
      var min = parseInt(timeParts[1], 10);
      if (isNaN(hour) || isNaN(min)) continue;

      var dateParts = startDateStr.split("-");
      var yr = parseInt(dateParts[0], 10);
      var mo = parseInt(dateParts[1], 10);
      var dy = parseInt(dateParts[2], 10);

      // Hitung timestamp mulai dalam zona waktu Asia/Makassar (WITA, UTC+8) seperti archiveExpiredEvents
      var startDateTimeMs = Date.UTC(yr, mo - 1, dy, hour - 8, min, 0);

      var diffMs = startDateTimeMs - nowMs;
      var minutesUntilStart = Math.ceil(diffMs / (60 * 1000));

      // Lewati kegiatan yang sudah dimulai (diffMs <= 0 atau minutesUntilStart <= 0)
      if (minutesUntilStart <= 0) {
        continue;
      }

      // Lewati kegiatan yang masih lebih dari jendela pengingat (30 menit)
      if (minutesUntilStart > TELEGRAM_REMINDER_MINUTES_BEFORE) {
        continue;
      }

      // Tentukan target pengiriman sesuai unit
      var targets = [];
      var cleanUnit = String(evt.unit || "Bersama").trim().toLowerCase();
      if (cleanUnit === "ikhwan") {
        if (config.targets.Ikhwan.chatId) targets.push(config.targets.Ikhwan);
      } else if (cleanUnit === "akhwat") {
        if (config.targets.Akhwat.chatId) targets.push(config.targets.Akhwat);
      } else {
        // Bersama atau tidak diketahui -> kirim ke kedua target
        if (config.targets.Ikhwan.chatId) targets.push(config.targets.Ikhwan);
        if (config.targets.Akhwat.chatId) targets.push(config.targets.Akhwat);
      }

      if (targets.length === 0) {
        continue;
      }

      // Kunci deduplikasi berbasis ID kegiatan, tanggal mulai, jam mulai, dan unit target
      // Format: tgrem_<eventId>_<startDate>_<startTime>_<unit>
      var baseDedupeKey = "tgrem_" + evt.id + "_" + startDateStr + "_" + startTimeStr.replace(/:/g, "");

      // Lewati jika semua target untuk kegiatan ini sudah pernah terkirim
      var hasPendingTarget = false;
      for (var t = 0; t < targets.length; t++) {
        var checkKey = baseDedupeKey + "_" + (targets[t].unit || "Unknown");
        if (!allProps[checkKey]) {
          hasPendingTarget = true;
          break;
        }
      }
      if (!hasPendingTarget) {
        continue;
      }

      var jamRange = (evt.jam_mulai || "-") + " - " + (evt.jam_selesai || "-") + " WITA";
      var isBersama = cleanUnit === "bersama";

      var reminderText = "⏰ <b>PENGINGAT KEGIATAN (Dimulai ± " + minutesUntilStart + " menit lagi)</b>\n\n" +
        "📌 <b>" + escapeHtml(evt.judul) + "</b>\n";
      if (isBersama) {
        reminderText += "🤝 <i>Bersama (Ikhwan & Akhwat)</i>\n";
      }
      reminderText += "⏰ Waktu  : " + escapeHtml(jamRange) + "\n" +
        "🏢 Lokasi : " + escapeHtml(evt.lokasi || "-") + "\n";
      if (evt.petugas) {
        reminderText += "👤 Petugas: " + escapeHtml(evt.petugas) + "\n";
      }
      reminderText += "🏷 Divisi : " + escapeHtml(evt.divisi || "-") + "\n";
      if (evt.deskripsi) {
        reminderText += "📝 Catatan: <i>" + escapeHtml(evt.deskripsi) + "</i>\n";
      }
      reminderText += "\n🌐 <a href=\"" + escapeHtml(SITE_URL) + "\">Buka Kalender Proker OSIS</a>";

      for (var t = 0; t < targets.length; t++) {
        var target = targets[t];
        var dedupeKey = baseDedupeKey + "_" + (target.unit || "Unknown");
        if (allProps[dedupeKey]) {
          // Pengingat untuk target ini sudah pernah terkirim
          continue;
        }

        var sendSuccess = telegramSendMessage_(target, reminderText);
        if (sendSuccess) {
          // Catat pengingat terkirim ke Script Properties HANYA jika telegramSendMessage_ mengembalikan true
          props.setProperty(dedupeKey, String(startDateTimeMs));
          allProps[dedupeKey] = String(startDateTimeMs);
          sentRemindersCount++;
        }
      }
    }

    if (sentRemindersCount > 0) {
      console.log("sendTelegramReminders selesai: " + sentRemindersCount + " pengingat berhasil dikirim.");
    }

    // Pembersihan (Pruning) dedupe keys yang sudah lebih dari 2 hari
    // KRUSIAL: Hanya hapus properti yang diawali "tgrem_" dan bernilai timestamp > 2 hari
    var TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
    var currentProps = props.getProperties();
    var keysToPrune = [];
    for (var k in currentProps) {
      if (currentProps.hasOwnProperty(k) && k.indexOf("tgrem_") === 0) {
        var storedTs = parseInt(currentProps[k], 10);
        if (!isNaN(storedTs) && (nowMs - storedTs > TWO_DAYS_MS)) {
          keysToPrune.push(k);
        }
      }
    }
    for (var p = 0; p < keysToPrune.length; p++) {
      props.deleteProperty(keysToPrune[p]);
    }
    if (keysToPrune.length > 0) {
      console.log("Pruning berhasil: Menghapus " + keysToPrune.length + " kunci deduplikasi lama (> 2 hari).");
    }

  } catch (err) {
    console.error("Kesalahan saat menjalankan sendTelegramReminders:", err);
  } finally {
    if (hasLock) {
      try {
        lock.releaseLock();
      } catch (lockReleaseErr) {}
    }
  }
}

/**
 * Fungsi Pengujian Manual: testTelegramConnection
 * Mengirim pesan tes "Tes koneksi Jadwal Proker OSIS" ke setiap target yang terkonfigurasi.
 * Mencatat di konsol log per unit apakah berhasil dan apakah topic ID digunakan.
 */
function testTelegramConnection() {
  console.log("=== Memulai Pengujian Koneksi Telegram Bot Jadwal Proker OSIS ===");
  var config = telegramGetConfig_();

  if (!config.token) {
    console.warn("[Gagal] TELEGRAM_BOT_TOKEN belum disetel di Script Properties.");
    return;
  }
  console.log("[Info] TELEGRAM_BOT_TOKEN terdeteksi.");

  var units = ["Ikhwan", "Akhwat"];
  for (var i = 0; i < units.length; i++) {
    var unit = units[i];
    var target = config.targets[unit];

    if (!target.chatId) {
      console.warn("[Lewati] TELEGRAM_CHAT_ID_" + unit.toUpperCase() + " belum disetel di Script Properties.");
      continue;
    }

    var topicUsed = Boolean(target.topicId && /^-?\d+$/.test(String(target.topicId).trim()));
    var topicDesc = topicUsed
      ? (" (Topic ID: " + target.topicId + ")")
      : " (Tanpa Topic ID / Direct Group/Channel)";

    var testHtml = "🔔 <b>Tes koneksi Jadwal Proker OSIS</b>\n\n" +
      "Pesan uji coba integrasi Telegram untuk unit <b>" + unit + "</b>" + topicDesc + " berhasil terhubung!\n\n" +
      "🌐 <a href=\"" + escapeHtml(SITE_URL) + "\">Kunjungi Website</a>";

    var success = telegramSendMessage_(target, testHtml);
    if (success) {
      console.log("[Sukses] Unit " + unit + ": Pesan berhasil terkirim. Menggunakan Topic ID: " + (topicUsed ? target.topicId : "Tidak"));
    } else {
      console.warn("[Gagal] Unit " + unit + ": Gagal mengirim pesan. Menggunakan Topic ID: " + (topicUsed ? target.topicId : "Tidak"));
    }
  }
  console.log("=== Pengujian Koneksi Telegram Selesai ===");
}

