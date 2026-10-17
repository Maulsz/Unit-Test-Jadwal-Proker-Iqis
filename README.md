# 📅 Jadwal Proker OSIS

Aplikasi web modern **Jadwal Proker OSIS** dengan manajemen kegiatan lengkap, sistem otentikasi Password Administrator berkeamanan token HMAC, notifikasi agenda harian via email otomatis (*daily email digest*), serta riwayat dan evaluasi pelaksanaan program kerja (*auto-archive & evaluation*).

Dibangun menggunakan **HTML5 semantik, Vanilla CSS3 murni, dan Vanilla JavaScript** di sisi frontend (tanpa framework, tanpa build tools) dan **Google Apps Script Web App** dengan database terstruktur **Google Sheets** di sisi backend.

---

## 📑 Daftar Isi
1. [✨ Fitur Utama](#-fitur-utama)
2. [📂 Struktur File Proyek](#-struktur-file-proyek)
3. [🔐 Arsitektur Hak Akses (Publik vs Administrator)](#-arsitektur-hak-akses-publik-vs-administrator)
4. [🚀 Panduan Backend: Google Apps Script & Google Sheets](#-panduan-backend-google-apps-script--google-sheets)
   - [Langkah 1: Siapkan Google Sheet & Salin Spreadsheet ID](#langkah-1-siapkan-google-sheet--salin-spreadsheet-id)
   - [Langkah 2: Salin Kode Backend & Konfigurasi Konstanta](#langkah-2-salin-kode-backend--konfigurasi-konstanta)
   - [Langkah 3: Konfigurasi Script Properties (ADMIN_PASSWORD)](#langkah-3-konfigurasi-script-properties-admin_password)
   - [Langkah 4: Setel Zona Waktu Proyek (Asia/Makassar - WITA)](#langkah-4-setel-zona-waktu-proyek-asiamakassar---wita)
   - [Langkah 5: Jalankan Setup Database Awal (setupAll)](#langkah-5-jalankan-setup-database-awal-setupall)
   - [Langkah 6: Publikasikan Web App & Pembaruan Versi](#langkah-6-publikasikan-web-app--pembaruan-versi)
   - [Langkah 7: Konfigurasi Pemicu Otomatis (Triggers Setup)](#langkah-7-konfigurasi-pemicu-otomatis-triggers-setup)
5. [🔗 Menghubungkan Backend ke Frontend](#-menghubungkan-backend-ke-frontend)
6. [💻 Menjalankan di Komputer Lokal](#-menjalankan-di-komputer-lokal)
7. [🌐 Panduan Deploy ke Vercel](#-panduan-deploy-ke-vercel)
8. [📊 Struktur Model Data Spreadsheet](#-struktur-model-data-spreadsheet)
   - [1. Tab 'Kegiatan' (Data Kegiatan Aktif - 12 Kolom)](#1-tab-kegiatan-data-kegiatan-aktif---12-kolom)
   - [2. Tab 'Subscribers' (Langganan Email - 4 Kolom)](#2-tab-subscribers-langganan-email---4-kolom)
   - [3. Tab 'Arsip' (Riwayat & Evaluasi - 14 Kolom)](#3-tab-arsip-riwayat--evaluasi---14-kolom)
9. [💡 Tips & Troubleshooting](#-tips--troubleshooting)

---

## ✨ Fitur Utama

- **🗓️ Kalender Bulanan Interaktif & Responsif**:
  - Navigasi bulan (Sebelumnya, Selanjutnya, dan tombol pintas *Hari Ini*).
  - Indikator kegiatan (*badge count* & dot indikator) pada setiap sel tanggal.
  - Penanda tanggal hari ini dan penyorotan tanggal aktif yang dipilih.
  - Kompatibel penuh untuk desktop, tablet, dan smartphone (termasuk tombol FAB pada perangkat seluler).

- **📋 Agenda Kegiatan & Tampilan Bersih**:
  - Panel agenda khusus menampilkan seluruh kegiatan pada tanggal terpilih secara terperinci.
  - Menampilkan Nama Program Kerja / Kegiatan, Divisi Penanggung Jawab, Petugas Pelaksana, Rentang Tanggal, Waktu Pelaksanaan (WITA), dan Lokasi Kegiatan tanpa redundansi teks.
  - Status kegiatan: **Terkonfirmasi (*Confirmed*)** dan **Rencana (*Tentative*)** dengan pembeda visual (garis putus-putus dan badge warna).

- **🔍 Modal Rincian Detail Kegiatan (*Event Detail Modal*)**:
  - Mengklik kartu kegiatan (`.event-card`) pada panel agenda langsung membuka modal popup interaktif terperinci (`#eventDetailModal`).
  - Menampilkan nama program kerja lengkap, badge divisi dengan kode warna tematik, status kegiatan, rentang hari & tanggal, jam pelaksanaan WITA, lokasi, deskripsi/agenda lengkap, dan daftar petugas pelaksana.
  - Menyediakan tombol aksi cepat (*Edit* dan *Hapus*) yang otomatis muncul ketika administrator sedang dalam sesi login aktif.

- **📝 Formulir Tambah/Edit Terpadu (*Merged Proker Field*)**:
  - Menggabungkan *Judul Kegiatan* dan *Program Kerja* menjadi satu kolom input intuitif berlabel **"Nama Program Kerja / Kegiatan"** pada modal form (`#eventForm`).
  - Secara otomatis mengisi dan menyinkronkan nilai ke kedua properti database (`judul` dan `proker`) saat form dikirimkan, menjaga kompatibilitas penuh dengan struktur spreadsheet backend.
  - Saat mengedit data lama yang memiliki nilai judul dan proker berbeda, form menggunakan nilai `judul` sebagai sumber kebenaran (*source of truth*) tanpa mengubah data di database sampai pengguna menyimpan form kembali.

- **👥 Multi-Petugas / Penanggung Jawab Dinamis**:
  - Input petugas yang fleksibel dengan fitur tambah/hapus baris nama dinamis (*dynamic multi-entry inputs*).
  - Nama-nama petugas digabungkan otomatis menjadi daftar terpisah koma (*comma-separated*) saat disimpan ke spreadsheet, dan diurai kembali menjadi baris-baris input individual saat form edit dibuka.
  - Tetap mendukung penulisan label *"Bersama"* untuk program kerja kolektif yang dijalankan oleh seluruh anggota divisi/pengurus.

- **⏳ Widget Kegiatan Mendatang (*Upcoming Events*)**:
  - Menampilkan ringkasan agenda terdekat yang diurutkan secara kronologis.
  - Dilengkapi pill tanggal dan *countdown timer* interaktif yang menghitung mundur waktu menuju kegiatan.
  - Opsi perluasan (*Lihat Lainnya / Tampilkan Lebih Sedikit*).

- **🎨 Sistem Warna & Badge Berbasis Divisi**:
  - Pengelompokan visual terstandarisasi untuk 5 divisi tetap OSIS dan opsi kustom/lainnya:
    1. **Keislaman dan Pembinaan Karakter** (Warna Amber / Emas)
    2. **Kepemimpinan dan Kebahasaan** (Warna Violet / Ungu)
    3. **Komunikasi Media Kreatif** (Warna Rose / Merah Muda)
    4. **Kewirausahaan dan Sosial Lingkungan** (Warna Cyan / Biru Laut)
    5. **Bersama / Proker Bersama** (Warna Stone / Abu Hangat)
    6. **Lainnya / Divisi Khusus** (Warna Slate / Abu Netral)
  - Seluruh kartu agenda (`.event-card`) dan item kegiatan mendatang (`.upcoming-item`) memiliki border samping berkode warna sesuai divisi, baik pada kondisi normal maupun saat kursor diarahkan (*hover*).

- **🌓 Dukungan Tema Gelap & Terang (*Dark / Light Mode*)**:
  - Toggle tema instan dengan transisi halus.
  - Preferensi tema tersimpan otomatis di `localStorage` peramban.

- **🏷️ Filter Tab Unit Satuan Eksklusif (Semua, Ikhwan, Akhwat, Bersama)**:
  - Bilah filter interaktif di atas kalender dengan 4 tab: **Semua Unit**, **Ikhwan** (`fa-user`), **Akhwat** (`fa-user`), dan **Bersama** (`fa-people-group`).
  - Menghitung jumlah kegiatan secara eksklusif dan presisi pada badge angka setiap tab.
  - Memfilter secara sinkron pada Kalender, Panel Agenda, Widget Kegiatan Mendatang, serta Riwayat Arsip & Evaluasi.

- **🔐 Keamanan & Otentikasi Administrator Berbasis Password**:
  - Akses publik bersifat *Read-Only* (pengunjung umum hanya dapat melihat kalender, membuka detail kegiatan, dan mendaftar notifikasi email).
  - Operasi manipulasi data (Tambah, Edit, Hapus Kegiatan, serta Evaluasi Arsip) diproteksi oleh **Password Admin**.
  - Password disimpan secara aman di **Script Properties** Google Apps Script (tidak terekspos di frontend maupun Google Sheets).
  - Otentikasi menghasilkan token sesi sementara yang ditandatangani dengan algoritma **HMAC-SHA256** dan memiliki masa berlaku 1 jam (3600 detik).
  - Mendukung verifikasi token otomatis (`verifySession`) dan pencabutan sesi saat keluar (`logout`).

- **📧 Notifikasi Agenda Harian via Email (*Daily Email Digest*)**:
  - Fitur langganan email mandiri bagi siswa, guru, dan pengurus tanpa perlu login.
  - Modal pendaftaran dengan validasi alamat email, pengecekan status langganan aktif, dan opsi berhenti berlangganan (*unsubscribe* / soft delete).
  - Pengiriman email otomatis terjadwal setiap pagi berisi ringkasan agenda kegiatan yang berlangsung pada hari tersebut dengan template HTML responsif yang bersih dan bebas duplikasi informasi.

- **📦 Riwayat & Evaluasi Pelaksanaan Kegiatan (*Auto-Archive & Evaluation*)**:
  - Kegiatan yang telah selesai lebih dari 24 jam otomatis dipindahkan dari tab `Kegiatan` ke tab `Arsip` oleh pemicu latar belakang.
  - Modal khusus administrator untuk meninjau seluruh riwayat program kerja yang telah lampau.
  - Administrator dapat menilai **Status Pelaksanaan** (*Belum Dinilai*, *Terlaksana*, *Tidak Terlaksana*) serta menambahkan **Keterangan / Catatan Evaluasi Kendala**.

- **🛡️ Bebas Masalah CORS & Mode Demo Lokal**:
  - Menggunakan payload `text/plain;charset=utf-8` untuk transmisi data ke Google Apps Script sehingga terhindar dari pemblokiran *CORS preflight (OPTIONS)*.
  - Jika `APPS_SCRIPT_URL` belum diisi, aplikasi otomatis berjalan dalam **Mode Demo Lokal** (*localStorage* & *mock data*) untuk keperluan demonstrasi dan pengujian UI.

---

## 📂 Struktur File Proyek

```text
jadwal-proker-OSIS-IQIS/
├── Code.gs          # Backend: Google Apps Script (CRUD, Otentikasi Password, Email Digest, Auto-Archive)
├── index.html       # Frontend: Struktur antarmuka web semantik dan modal dialog
├── style.css        # Styling: Sistem desain modern, tema Emerald Green, Dark/Light mode, responsif
├── script.js        # Frontend Logic: Kalender, manajemen state, otentikasi admin, modal & komunikasi API
├── favicon.svg      # Aset: Ikon favicon kalender berformat SVG vektor
└── README.md        # Dokumentasi lengkap arsitektur, konfigurasi, dan panduan deployment
```

---

## 🔐 Arsitektur Hak Akses (Publik vs Administrator)

Sistem membedakan hak akses pengguna secara tegas demi keamanan data:

| Fitur / Aksi | Akses Publik (Tamu / Siswa) | Akses Administrator | Kebutuhan Otorisasi |
| :--- | :---: | :---: | :--- |
| **Melihat Kalender & Agenda** | ✅ Ya | ✅ Ya | Terbuka untuk umum |
| **Membuka Rincian Detail Kegiatan** | ✅ Ya | ✅ Ya | Terbuka untuk umum |
| **Melihat Kegiatan Mendatang** | ✅ Ya | ✅ Ya | Terbuka untuk umum |
| **Berlangganan / Berhenti Email** | ✅ Ya | ✅ Ya | Terbuka untuk umum |
| **Tambah Kegiatan Baru** | ❌ Tidak | ✅ Ya | Wajib Token Sesi Admin Valid |
| **Edit / Perbarui Kegiatan** | ❌ Tidak | ✅ Ya | Wajib Token Sesi Admin Valid |
| **Hapus Kegiatan** | ❌ Tidak | ✅ Ya | Wajib Token Sesi Admin Valid |
| **Buka Modal Riwayat & Evaluasi** | ❌ Tidak | ✅ Ya | Wajib Token Sesi Admin Valid |
| **Simpan Status & Catatan Evaluasi**| ❌ Tidak | ✅ Ya | Wajib Token Sesi Admin Valid |

---

## 🚀 Panduan Backend: Google Apps Script & Google Sheets

Ikuti langkah-langkah berikut secara berurutan untuk menyiapkan backend di akun Google Anda:

### Langkah 1: Siapkan Google Sheet & Salin Spreadsheet ID
1. Buat Google Sheet baru di [Google Spreadsheet](https://sheets.new) atau buka spreadsheet yang sudah Anda miliki.
2. Beri nama spreadsheet Anda, misalnya `Database Jadwal Proker OSIS`.
3. Perhatikan URL Google Sheet Anda pada bilah alamat browser:
   ```text
   https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890abcd/edit
   ```
4. Salin string karakter yang terletak di antara `/d/` dan `/edit`. String tersebut adalah **SPREADSHEET_ID** unik milik Anda.
   > ⚠️ **PERINGATAN PENTING**: Salin ID dari Google Sheet Anda sendiri. **JANGAN** menggunakan ID contoh dari dokumentasi atau repositori orang lain, karena data Anda tidak akan tersimpan ke spreadsheet Anda.

### Langkah 2: Salin Kode Backend & Konfigurasi Konstanta
1. Pada menu Google Sheet Anda, klik **Extensions** (Ekstensi) > **Apps Script**.
2. Hapus semua kode bawaan di file `Code.gs`.
3. Buka file [`Code.gs`](./Code.gs) di repositori ini, salin seluruh kodenya, lalu tempelkan ke editor Apps Script.
4. Sesuaikan konfigurasi konstanta di bagian atas file `Code.gs`:
   ```javascript
   // Tempelkan SPREADSHEET_ID milik Google Sheet Anda sendiri di sini:
   var SPREADSHEET_ID = "MASUKKAN_SPREADSHEET_ID_ANDA_DI_SINI";

   // Masukkan domain website hosting produksi Anda (misal domain Vercel Anda):
   var SITE_URL = "https://nama-proyek-anda.vercel.app";
   ```
   > 💡 **Catatan SITE_URL**: Gunakan domain produksi utama Anda (bukan preview URL commit sementara), karena URL ini akan disematkan sebagai tautan di footer email notifikasi harian.

5. Simpan file dengan menekan `Ctrl + S` (`Cmd + S` di Mac).

### Langkah 3: Konfigurasi Script Properties (ADMIN_PASSWORD)
Password Administrator tidak boleh ditulis di dalam kode sumber. Password disimpan pada fitur rahasia *Script Properties*:
1. Di sidebar sebelah kiri editor Apps Script, klik ikon roda gigi ⚙️ **Project Settings** (Setelan Proyek).
2. Gulir ke bawah hingga bagian **Script Properties** (Properti Skrip).
3. Klik tombol **Add script property** (Tambahkan properti skrip).
4. Masukkan rincian berikut:
   - **Property**: `ADMIN_PASSWORD_IKHWAN`
   - **Value**: Masukkan password rahasia untuk unit Ikhwan (contoh: `Ikhwan#2026!` atau teks alfanumerik pilihan Anda).
   - Klik **Add script property** lagi.
   - **Property**: `ADMIN_PASSWORD_AKHWAT`
   - **Value**: Masukkan password rahasia untuk unit Akhwat (contoh: `Akhwat#2026!` atau teks alfanumerik pilihan Anda).
5. Klik **Save script properties**.

> 🔒 **Keamanan**: Properti `SESSION_SECRET` (kunci enkripsi HMAC) akan dibuat otomatis oleh skrip saat pertama kali dijalankan. Anda tidak perlu membuat `SESSION_SECRET` secara manual.

### Langkah 4: Setel Zona Waktu Proyek (Asia/Makassar - WITA)
Perhitungan tanggal, jam selesai, filter notifikasi email, dan batas arsip 24 jam mengacu pada Waktu Indonesia Tengah (WITA, UTC+8):
1. Masih pada menu ⚙️ **Project Settings** (Setelan Proyek).
2. Periksa bagian **Time zone** (Zona Waktu).
3. Pastikan zona waktu disetel ke `(GMT+08:00) Asia/Makassar` atau `(GMT+08:00) Makassar`.
4. Jika sebelumnya belum sesuai, ubah ke Makassar lalu simpan.

### Langkah 5: Jalankan Setup Database Awal (setupAll)
Fungsi `setupAll` akan secara otomatis membuat tab `Kegiatan`, `Subscribers`, dan `Arsip` dengan format header dan lebar kolom yang presisi:
1. Kembali ke editor kode (`Code.gs`).
2. Pada dropdown pilihan fungsi di toolbar atas, pilih fungsi **`setupAll`**.
3. Klik tombol **Run** (Jalankan).
4. Google akan meminta persetujuan otorisasi (*Authorization Required*):
   - Klik **Review permissions** (Tinjau izin).
   - Pilih akun Google Anda.
   - Jika muncul peringatan *"Google hasn’t verified this app"*, klik tautan **Advanced** (Lanjutan) di kiri bawah > klik **Go to [Nama Proyek] (unsafe)**.
   - Klik **Allow** (Izinkan).
5. Buka kembali Google Sheet Anda. Pastikan 3 tab berikut telah terbentuk sempurna:
   - Tab `Kegiatan` (12 kolom header hijau)
   - Tab `Subscribers` (4 kolom header hijau)
   - Tab `Arsip` (14 kolom header hijau)

### Langkah 6: Publikasikan Web App & Pembaruan Versi

#### A. Menerapkan Pertama Kali (New Deployment)
1. Klik tombol biru **Deploy** di pojok kanan atas > pilih **New deployment**.
2. Klik ikon gerigi ⚙️ di sebelah *"Select type"* > pilih **Web app**.
3. Konfigurasikan:
   - **Description**: `Jadwal Proker OSIS v1.0`
   - **Execute as**: `Me (email-anda@gmail.com)` *(Wajib: Me)*
   - **Who has access**: `Anyone` *(Wajib: Anyone agar dapat diakses publik tanpa login Google)*
4. Klik **Deploy**.
5. Salin **Web app URL** yang muncul (format: `https://script.google.com/macros/s/AKfycb.../exec`).

#### B. Memperbarui Deployment Setelah Ada Perubahan Kode (Update Deployment)
Jika Anda mengedit `Code.gs` di kemudian hari, perbarui deployment yang sudah ada agar URL tidak berubah:
1. Klik tombol **Deploy** > pilih **Manage deployments** (Kelola penerapan).
2. Pilih deployment aktif di daftar sebelah kiri.
3. Klik ikon pensil ✏️ (**Edit**) di kanan atas modal.
4. Pada dropdown **Version**, pilih **New version** (Versi baru).
5. Klik **Deploy**.
   > ✅ **PENTING**: Melalui cara ini, URL Web App Anda **TIDAK AKAN BERUBAH**, sehingga Anda tidak perlu memperbarui `script.js` lagi di frontend.

### Langkah 7: Konfigurasi Pemicu Otomatis (Triggers Setup)
Aplikasi membutuhkan **2 pemicu waktu (Time-driven Triggers)** agar fitur email harian dan auto-arsip berjalan otomatis di server Google:

1. Di sidebar sebelah kiri editor Apps Script, klik ikon jam ⏰ **Triggers** (Pemicu).
2. Tambahkan **Trigger 1: Notifikasi Email Harian**:
   - Klik tombol **+ Add Trigger** di kanan bawah.
   - *Choose which function to run*: `sendDailyReminderEmails`
   - *Choose which deployment*: `Head`
   - *Select event source*: `Time-driven`
   - *Select type of time based trigger*: `Day timer`
   - *Select time of day*: Pilih jendela waktu pagi hari, misal `06:00 to 07:00`.
   - Klik **Save**.
   > ⚠️ *Jika trigger ini tidak dipasang*: Sistem tidak akan mengirimkan email ringkasan agenda pagi ke pelanggan.

3. Tambahkan **Trigger 2: Pemindahan Arsip Otomatis**:
   - Klik tombol **+ Add Trigger** lagi.
   - *Choose which function to run*: `archiveExpiredEvents`
   - *Choose which deployment*: `Head`
   - *Select event source*: `Time-driven`
   - *Select type of time based trigger*: `Hour timer`
   - *Select hour interval*: `Every hour` (Setiap jam).
   - Klik **Save**.
   > ⚠️ *Jika trigger ini tidak dipasang*: Kegiatan yang sudah lewat 24 jam tidak akan pernah berpindah ke tab `Arsip`, dan modal riwayat evaluasi akan tetap kosong.

---

## 🔗 Menghubungkan Backend ke Frontend

1. Buka file [`script.js`](./script.js) di editor kode Anda.
2. Pada baris ke-16, temukan variabel `APPS_SCRIPT_URL`:
   ```javascript
   // Ganti dengan Web App URL yang Anda salin pada Langkah 6:
   const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxAbCdEfGhIjKlMnOpQrStUvWxYz1234567890_contoh/exec";
   ```
   > ⚠️ **PERINGATAN PENTING**: Nilai URL di atas hanyalah contoh placeholder format URL Web App Google. Pastikan Anda menempelkan URL hasil deployment Web App milik Anda sendiri dari Langkah 6.

3. Simpan file `script.js`. Frontend kini telah terhubung secara langsung dan aman ke Google Sheets Anda!

---

## 💻 Menjalankan di Komputer Lokal

Karena proyek ini menggunakan Vanilla JavaScript standar tanpa proses *compilation* / *build*, Anda dapat menjalankannya secara instan:

### Opsi A: Menggunakan VS Code Live Server (Direkomendasikan)
1. Buka folder proyek ini di VS Code.
2. Pasang ekstensi **Live Server** (oleh Ritwick Dey) jika belum terpasang.
3. Klik kanan pada file `index.html` > pilih **Open with Live Server**.
4. Aplikasi akan otomatis terbuka pada peramban di alamat `http://127.0.0.1:5500/index.html`.

### Opsi B: Menggunakan Web Server Sederhana (Python / Node.js)
Jalankan perintah berikut pada terminal di folder proyek:
```bash
# Menggunakan Python 3:
python -m http.server 3000

# Atau menggunakan Node npx:
npx serve . -p 3000
```
Buka peramban dan akses `http://localhost:3000`.

---

## 🌐 Panduan Deploy ke Vercel

Aplikasi ini dapat di-hosting secara gratis dan cepat di [Vercel](https://vercel.com):

### Cara 1: Menggunakan Vercel CLI
1. Buka terminal di folder proyek.
2. Jalankan:
   ```bash
   npx vercel
   ```
3. Ikuti petunjuk interaktif di terminal (pilih direktori `./`, biarkan konfigurasi default).
4. Untuk deploy langsung ke domain produksi:
   ```bash
   npx vercel --prod
   ```

### Cara 2: Menghubungkan Repositori GitHub ke Dashboard Vercel
1. Unggah (*push*) kode proyek Anda ke repositori GitHub.
2. Buka [Vercel Dashboard](https://vercel.com/dashboard) dan klik **Add New...** > **Project**.
3. Pilih repositori GitHub proyek Jadwal Proker OSIS Anda.
4. Pada bagian **Build and Output Settings**, biarkan kosong (Vercel otomatis mendeteksi situs statis).
5. Klik **Deploy**. Website Anda langsung aktif dan dapat diakses dari seluruh dunia dengan sertifikat SSL (HTTPS) gratis.

---

## 📊 Struktur Model Data Spreadsheet

Database spreadsheet terdiri dari 3 sheet tab dengan skema kolom terstruktur:

### 1. Tab 'Kegiatan' (Data Kegiatan Aktif - 12 Kolom)
Menyimpan seluruh agenda kegiatan yang sedang berlangsung atau yang akan datang.

| No | Nama Kolom (`HEADERS`) | Tipe Data | Keterangan & Aturan Validasi | Contoh Nilai |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `id` | String | ID unik kegiatan (dibuat otomatis oleh backend) | `evt_1726588800123_456` |
| 2 | `judul` | String | Nama program kerja / kegiatan (Wajib, diisi melalui input tunggal form UI dan disinkronkan ke kolom `proker`) | `Latihan Dasar Kepemimpinan (LDKS)` |
| 3 | `deskripsi` | String | Catatan atau rincian agenda kegiatan | `Pelatihan kepemimpinan calon pengurus OSIS` |
| 4 | `lokasi` | String | Tempat pelaksanaan kegiatan | `Aula Graha Bhakti` |
| 5 | `divisi` | String | Divisi penanggung jawab (Wajib) | `Kepemimpinan dan Kebahasaan` |
| 6 | `proker` | String | Nama program kerja (Diisi otomatis sama dengan `judul` oleh form UI untuk menjaga kompatibilitas data backend) | `Latihan Dasar Kepemimpinan (LDKS)` |
| 7 | `petugas` | String | Nama panitia / petugas pelaksana (Mendukung banyak nama dipisahkan koma, atau 'Bersama' untuk proker kolektif) | `Ahmad Fauzi, Siti Rahma, BPH OSIS` |
| 8 | `tanggal_mulai` | String | Tanggal mulai dengan format `YYYY-MM-DD` (Wajib) | `2026-09-20` |
| 9 | `tanggal_selesai` | String | Tanggal selesai format `YYYY-MM-DD` (Wajib) | `2026-09-21` |
| 10 | `jam_mulai` | String | Waktu mulai format `HH:MM` (WITA) | `08:30` |
| 11 | `jam_selesai` | String | Waktu selesai format `HH:MM` (WITA) | `15:00` |
| 12 | `status` | String | Status konfirmasi: `confirmed` atau `tentative` | `confirmed` |

---

### 2. Tab 'Subscribers' (Langganan Email - 4 Kolom)
Menyimpan daftar alamat email untuk pengiriman notifikasi agenda harian.

| No | Nama Kolom | Tipe Data | Keterangan & Status | Contoh Nilai |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `email` | String | Alamat email terdaftar (huruf kecil) | `siswa@sekolah.sch.id` |
| 2 | `subscribed_at` | String | Waktu saat email didaftarkan | `2026-09-27 08:15:30 WITA` |
| 3 | `status` | String | Status langganan: `subscribed` atau `unsubscribed` | `subscribed` |
| 4 | `unsubscribed_at`| String | Waktu saat pengguna berhenti berlangganan | `2026-09-30 10:00:12 WITA` |

---

### 3. Tab 'Arsip' (Riwayat & Evaluasi - 14 Kolom)
Menyimpan kegiatan lampau (lebih dari 24 jam setelah waktu selesai) beserta evaluasi pelaksanaannya.

| No | Nama Kolom | Tipe Data | Keterangan | Contoh Nilai |
| :---: | :--- | :--- | :--- | :--- |
| 1–12 | *(Kolom 1–12)* | Beragam | Sama persis dengan 12 kolom pada tab `Kegiatan` | *(Data kegiatan awal)* |
| 13 | `status_pelaksanaan` | String | Status evaluasi: `Belum Dinilai`, `Terlaksana`, atau `Tidak Terlaksana` | `Terlaksana` |
| 14 | `keterangan_pelaksanaan` | String | Catatan evaluasi kendala / capaian kegiatan | `Berjalan lancar, dihadiri 120 peserta.` |

---

## 💡 Tips & Troubleshooting

### 1. Fungsi `setupAll` Sukses tetapi Tab Baru Tidak Muncul di Google Sheet Anda?
- **Penyebab**: Konstanta `SPREADSHEET_ID` di file `Code.gs` masih berisi ID contoh lama atau ID spreadsheet lain.
- **Solusi**: Buka Google Sheet Anda, salin ID dari URL (antara `/d/` dan `/edit`), tempelkan ke variabel `var SPREADSHEET_ID = "..."` di `Code.gs`, simpan (`Ctrl+S`), lalu jalankan kembali fungsi `setupAll`.

### 2. Muncul Pesan "ADMIN_PASSWORD_IKHWAN atau ADMIN_PASSWORD_AKHWAT belum disetel di Script Properties"?
- **Penyebab**: Properti skrip `ADMIN_PASSWORD_IKHWAN` atau `ADMIN_PASSWORD_AKHWAT` belum dibuat di setelan Apps Script.
- **Solusi**: Di editor Apps Script, buka ⚙️ **Project Settings** > scroll ke **Script Properties** > klik **Add script property** > masukkan Property: `ADMIN_PASSWORD_IKHWAN` dan `ADMIN_PASSWORD_AKHWAT` beserta password rahasia masing-masing > klik **Save**.

### 3. Batas Kuota Email Harian Google (Daily Email Quota)
- Google membatasi pengiriman email harian:
  - Akun Gmail Pribadi (`@gmail.com`): **~100 penerima / hari**.
  - Akun Google Workspace Institusi / Sekolah: **~1.500 penerima / hari**.
- Fungsi `sendDailyReminderEmails` dilengkapi pengecekan `MailApp.getRemainingDailyQuota()`. Jika kuota harian habis, sistem mencatat peringatan di log dan tidak akan menyebabkan eksekusi skrip mengalami *crash*.

### 4. Mengapa Perubahan di `Code.gs` Belum Terlihat di Website?
- Google Apps Script menggunakan sistem versi penerapan. Jika Anda mengubah kode di `Code.gs`, lakukan pembaruan versi:
  1. Klik **Deploy** > **Manage deployments**.
  2. Klik ikon pensil ✏️ (**Edit**).
  3. Ubah dropdown **Version** menjadi **New version**.
  4. Klik **Deploy**.

### 5. Mengapa Tidak Ada Kendala CORS Saat Mengirim Data dari Frontend?
- Google Apps Script Web App secara teknis tidak mendukung metode HTTP `OPTIONS` (*CORS preflight*) yang dikirimkan peramban jika request ber-header `application/json`.
- Aplikasi ini mengatasinya dengan mengirimkan data menggunakan header `text/plain;charset=utf-8` dan mengurai `JSON.parse(e.postData.contents)` di backend, sehingga komunikasi data berjalan lancar tanpa kendala CORS.
