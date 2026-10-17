/**
 * ============================================================================
 * JADWAL PROKER OSIS - FRONTEND LOGIC (Vanilla JavaScript)
 * ============================================================================
 * Aplikasi Jadwal Proker OSIS dengan fitur CRUD lengkap.
 * Terhubung langsung ke Google Apps Script Web App (Database: Google Sheets).
 *
 * INSTRUKSI KONFIGURASI:
 * 1. Deploy Code.gs di Google Apps Script sebagai Web App.
 * 2. Salin URL Web App yang dihasilkan (format: https://script.google.com/macros/s/.../exec).
 * 3. Tempelkan URL tersebut ke variabel APPS_SCRIPT_URL di bawah ini:
 * ============================================================================
 */

// >>> TEMPELKAN WEB APP URL GOOGLE APPS SCRIPT ANDA DI SINI <<<
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxFOPlodNxu0JSQkpDGnZ4wd89ryTAWjA8geQvBOGduYeLJUjc4va9e7iXDfNoaWAam/exec";

// Contoh: "https://script.google.com/macros/s/AKfycbxAbCdEfGhIjKlMnOpQrStUvWxYz/exec"

/**
 * Helper untuk sanitasi teks HTML guna mencegah XSS
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
 * Pilihan Unit Satuan OSIS IQIS
 */
const UNIT_OPTIONS = [
  { name: "Ikhwan", key: "ikhwan", icon: "fa-solid fa-user", color: "#0284c7" },
  { name: "Akhwat", key: "akhwat", icon: "fa-solid fa-user", color: "#db2777" },
  { name: "Bersama", key: "bersama", icon: "fa-solid fa-people-group", color: "#0f766e" }
];

/**
 * Helper untuk info Unit Satuan
 */
function getUnitInfo(unitName) {
  const clean = String(unitName || "Bersama").trim().toLowerCase();
  if (clean === "ikhwan") return UNIT_OPTIONS[0];
  if (clean === "akhwat") return UNIT_OPTIONS[1];
  return UNIT_OPTIONS[2];
}

/**
 * Helper otorisasi: Memeriksa apakah Admin aktif berhak membuat/mengubah/menghapus/menilai kegiatan unit ini
 */
function canAdminManageUnit(targetUnit) {
  if (!AuthState.isAdmin) return false;
  if (!AuthState.unit) return true; // Fallback jika tidak ada unit spesifik
  const unit = String(targetUnit || "Bersama").trim();
  if (unit.toLowerCase() === "bersama") return true;
  return unit.toLowerCase() === AuthState.unit.toLowerCase();
}

/**
 * Helper filter: Memeriksa apakah kegiatan cocok dengan unit tab filter yang sedang aktif
 */
function matchesUnitFilter(eventUnit, activeFilter = null) {
  const filter = (activeFilter || AppState.unitFilter || "Semua").trim();
  if (filter === "Semua") return true;
  const unit = String(eventUnit || "Bersama").trim();
  return unit.toLowerCase() === filter.toLowerCase();
}

/**
 * Pilihan Divisi Penanggung Jawab Program Kerja OSIS (Font Awesome Icons & Color Map)
 */
const DIVISI_OPTIONS = [
  { name: "Keislaman dan Pembinaan Karakter", key: "islam", icon: "fa-solid fa-mosque", color: "#d97706" },
  { name: "Kepemimpinan dan Kebahasaan", key: "kepemimpinan", icon: "fa-solid fa-language", color: "#7c3aed" },
  { name: "Komunikasi Media Kreatif", key: "media", icon: "fa-solid fa-photo-film", color: "#e11d48" },
  { name: "Kewirausahaan dan Sosial Lingkungan", key: "wirausaha", icon: "fa-solid fa-seedling", color: "#0891b2" },
  { name: "Bersama / Proker Bersama", key: "bersama", icon: "fa-solid fa-people-group", color: "#0f766e" },
  { name: "Lainnya", key: "lainnya", icon: "fa-solid fa-ellipsis", color: "var(--text-muted)" }
];

/**
 * Helper untuk mendapatkan detail info divisi (key, icon, color, isCustom)
 */
function getDivisiInfo(name) {
  if (!name) return null;
  const clean = String(name).trim();
  if (clean.toLowerCase() === "bersama" || clean.toLowerCase() === "bersama / proker bersama") {
    return DIVISI_OPTIONS.find(d => d.key === "bersama");
  }
  const found = DIVISI_OPTIONS.find(d => d.name.toLowerCase() === clean.toLowerCase() && d.key !== "lainnya");
  if (found) return found;

  // Jika tidak cocok dengan 5 divisi tetap, dianggap opsi "Lainnya" (Custom)
  return {
    name: clean,
    key: "lainnya",
    icon: "fa-solid fa-ellipsis",
    color: "var(--text-muted)",
    isCustom: true
  };
}

/**
 * Helper untuk mendapatkan key CSS divisi berdasarkan nama divisi
 */
function getDivisiKey(name) {
  const info = getDivisiInfo(name);
  return info ? info.key : "";
}

/**
 * Data awal (Seed / Mock Data)
 */
const SEED_EVENTS = [
  {
    id: "evt_demo_1",
    judul: "Kajian Rutin & Pembinaan Karakter Ikhwan",
    deskripsi: "Kajian keislaman mingguan dan pembinaan akhlak santri muslim di masjid sekolah.",
    lokasi: "Masjid Pendidikan IQIS",
    unit: "Ikhwan",
    divisi: "Keislaman dan Pembinaan Karakter",
    proker: "Kajian Pekanan & Tahsin",
    petugas: "Ahmad Fauzi & Tim Keislaman",
    tanggal_mulai: "2026-09-17",
    tanggal_selesai: "2026-09-17",
    jam_mulai: "08:30",
    jam_selesai: "11:30",
    status: "confirmed"
  },
  {
    id: "evt_demo_2",
    judul: "Latihan Dasar Kepemimpinan Siswa (LDKS) Akhwat",
    deskripsi: "Pelatihan kepemimpinan dan public speaking untuk calon pengurus OSIS Akhwat.",
    lokasi: "Sekolah (SMKIT IBNUL QAYYIM MAKASSAR)",
    unit: "Akhwat",
    divisi: "Kepemimpinan dan Kebahasaan",
    proker: "LDKS & English Club",
    petugas: "Siti Rahma & BPH OSIS",
    tanggal_mulai: "2026-09-20",
    tanggal_selesai: "2026-09-21",
    jam_mulai: "09:00",
    jam_selesai: "15:00",
    status: "confirmed"
  },
  {
    id: "evt_demo_3",
    judul: "Liputan Dokumentasi & Podcast OSIS",
    deskripsi: "Produksi konten podcast sekolah dan publikasi dokumentasi kegiatan di media sosial.",
    lokasi: "Sekolah (SMKIT IBNUL QAYYIM MAKASSAR)",
    unit: "Bersama",
    divisi: "Komunikasi Media Kreatif",
    proker: "Podcast Edukasi & Konten Kreatif",
    petugas: "Rian Hidayat & Tim Media",
    tanggal_mulai: "2026-09-25",
    tanggal_selesai: "2026-09-25",
    jam_mulai: "07:00",
    jam_selesai: "08:00",
    status: "tentative"
  },
  {
    id: "evt_demo_4",
    judul: "Bazar Kewirausahaan & Aksi Peduli Lingkungan",
    deskripsi: "Pameran produk kreativitas santri dan aksi bersih lingkungan bersama komite sekolah.",
    lokasi: "Sekolah (SMKIT IBNUL QAYYIM MAKASSAR)",
    unit: "Ikhwan",
    divisi: "Kewirausahaan dan Sosial Lingkungan",
    proker: "Bazar Sekolah Hijau",
    petugas: "Nurul Aini & Div. Wirausaha",
    tanggal_mulai: "2026-09-28",
    tanggal_selesai: "2026-09-28",
    jam_mulai: "08:00",
    jam_selesai: "14:00",
    status: "confirmed"
  },
  {
    id: "evt_demo_5",
    judul: "Rapat Pleno & Evaluasi Program Kerja Gabungan",
    deskripsi: "Evaluasi bulanan program kerja seluruh divisi OSIS bersama Pembina OSIS.",
    lokasi: "Masjid Pendidikan IQIS",
    unit: "Bersama",
    divisi: "Bersama / Proker Bersama",
    proker: "Rapat Pleno Bulanan",
    petugas: "Ketua OSIS & Sekbid",
    tanggal_mulai: "2026-09-30",
    tanggal_selesai: "2026-09-30",
    jam_mulai: "13:00",
    jam_selesai: "16:00",
    status: "confirmed"
  }
];

// ==========================================================================
// STATE MANAGEMENT APLIKASI
// ==========================================================================
const AppState = {
  events: [],               // Daftar semua kegiatan
  selectedDate: null,       // Tanggal aktif terpilih (format: YYYY-MM-DD)
  viewYear: 2026,           // Tahun tampilan kalender
  viewMonth: 8,             // Bulan tampilan kalender (0 = Jan, 8 = Sep)
  unitFilter: "Semua",      // Filter Unit Aktif: "Semua" | "Ikhwan" | "Akhwat" | "Bersama"
  isLoading: false,         // Status pemanggilan API
  isLiveMode: false,        // True jika menggunakan Google Apps Script aktif
  showAllUpcoming: false,   // Toggle melihat semua kegiatan mendatang
  eventToDelete: null       // Referensi kegiatan yang akan dihapus
};

// ==========================================================================
// STATE MANAGEMENT OTENTIKASI & OTORISASI ADMIN
// ==========================================================================
const AuthState = {
  isAdmin: false,                     // Mode Tamu (Guest) secara default
  unit: null,                         // "Ikhwan" | "Akhwat" | null
  token: null,                        // Token sesi admin sementara (HMAC-SHA256)
  expiresAt: null,                    // Waktu kedaluwarsa sesi (timestamp ms)
  SESSION_KEY: "osis_admin_session"   // Kunci penyimpanan sesi di sessionStorage
};

// ==========================================================================
// HELPER FORMAT TANGGAL & WAKTU (BAHASA INDONESIA)
// ==========================================================================
const DateHelper = {
  BULAN_PANJANG: [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ],

  BULAN_PENDEK: [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agt", "Sep", "Okt", "Nov", "Des"
  ],

  HARI_PANJANG: [
    "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"
  ],

  /**
   * Mengubah objek Date menjadi format string YYYY-MM-DD
   */
  toDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  },

  /**
   * Parse string YYYY-MM-DD menjadi objek Date lokal (menghindari selisih timezone UTC)
   */
  parseLocalDate(dateStr) {
    if (!dateStr) return new Date();
    const parts = dateStr.split("-");
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  },

  /**
   * Format tanggal lengkap Bahasa Indonesia: "Kamis, 17 September 2026"
   */
  formatIndoFull(dateStr) {
    if (!dateStr) return "-";
    const date = this.parseLocalDate(dateStr);
    const dayName = this.HARI_PANJANG[date.getDay()];
    const dayNum = date.getDate();
    const monthName = this.BULAN_PANJANG[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName}, ${dayNum} ${monthName} ${year}`;
  },

  /**
   * Format rentang tanggal: "17 Sep 2026" atau "17 - 18 Sep 2026"
   */
  formatDateRange(startStr, endStr) {
    if (!startStr) return "-";
    if (!endStr || startStr === endStr) {
      const d = this.parseLocalDate(startStr);
      return `${d.getDate()} ${this.BULAN_PENDEK[d.getMonth()]} ${d.getFullYear()}`;
    }

    const d1 = this.parseLocalDate(startStr);
    const d2 = this.parseLocalDate(endStr);

    if (d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth()) {
      return `${d1.getDate()} - ${d2.getDate()} ${this.BULAN_PENDEK[d1.getMonth()]} ${d1.getFullYear()}`;
    }

    return `${d1.getDate()} ${this.BULAN_PENDEK[d1.getMonth()]} - ${d2.getDate()} ${this.BULAN_PENDEK[d2.getMonth()]} ${d2.getFullYear()}`;
  },

  /**
   * Cek apakah sebuah tanggal berada dalam rentang tanggal kegiatan
   */
  isDateInRange(dateStr, startStr, endStr) {
    return dateStr >= startStr && dateStr <= endStr;
  },

  /**
   * Parse tanggal (YYYY-MM-DD) dan jam (HH:mm) dalam konteks zona waktu Asia/Makassar (WITA, UTC+8)
   */
  parseEventDateTime(dateStr, timeStr) {
    if (!dateStr) return null;
    const t = (timeStr && /^\d{1,2}:\d{2}$/.test(timeStr.trim())) ? timeStr.trim() : "00:00";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const timeParts = t.split(":");
    const hour = parseInt(timeParts[0], 10);
    const min = parseInt(timeParts[1], 10);
    // Asia/Makassar selalu UTC+8 konstan
    return new Date(Date.UTC(year, month - 1, day, hour - 8, min, 0));
  },

  /**
   * Menghitung status countdown relatif terhadap waktu sekarang (Asia/Makassar)
   */
  getEventCountdown(event) {
    if (!event || !event.tanggal_mulai) return null;
    const start = this.parseEventDateTime(event.tanggal_mulai, event.jam_mulai);
    if (!start) return null;

    const end = this.parseEventDateTime(
      event.tanggal_selesai || event.tanggal_mulai,
      event.jam_selesai || "23:59"
    );

    const now = new Date();

    // 1. Sedang berlangsung (antara jam mulai dan jam selesai)
    if (end && now >= start && now <= end) {
      return {
        text: "Berlangsung sekarang",
        isLive: true,
        isPast: false,
        minutesUntilStart: 0
      };
    }

    // 2. Sudah lewat jam selesai
    if (end && now > end) {
      return {
        text: "Selesai",
        isLive: false,
        isPast: true,
        minutesUntilStart: -1
      };
    }

    // 3. Belum mulai - hitung selisih waktu
    const diffMs = start.getTime() - now.getTime();
    if (diffMs <= 0) {
      return {
        text: "Berlangsung sekarang",
        isLive: true,
        isPast: false,
        minutesUntilStart: 0
      };
    }

    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    // Bandingkan tanggal dalam zona waktu Asia/Makassar
    const nowMakassarStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Makassar" });
    const isSameDay = event.tanggal_mulai === nowMakassarStr;

    if (!isSameDay) {
      const dStart = this.parseLocalDate(event.tanggal_mulai);
      const dToday = this.parseLocalDate(nowMakassarStr);
      const dayDiff = Math.max(1, Math.round((dStart - dToday) / (1000 * 60 * 60 * 24)));
      return {
        text: `${dayDiff} hari lagi`,
        isLive: false,
        isPast: false,
        minutesUntilStart: diffMinutes
      };
    }

    // Hari yang sama (Same day)
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours >= 1) {
      return {
        text: `${diffHours} jam lagi`,
        isLive: false,
        isPast: false,
        minutesUntilStart: diffMinutes
      };
    } else {
      const mins = Math.max(1, diffMinutes);
      return {
        text: `${mins} menit lagi`,
        isLive: false,
        isPast: false,
        minutesUntilStart: diffMinutes
      };
    }
  }
};

// ==========================================================================
// COUNTDOWN MANAGER KEGIATAN MENDATANG
// ==========================================================================
const UpcomingCountdown = {
  intervalId: null,

  updateCountdowns() {
    // 1. Eksekusi pengecekan notifikasi peramban untuk seluruh kegiatan (independen dari DOM)
    if (typeof NotificationManager !== "undefined" && typeof NotificationManager.checkUpcoming === "function") {
      NotificationManager.checkUpcoming();
    }

    const listContainer = document.getElementById("upcomingList");
    if (!listContainer) return;

    const countdownEls = listContainer.querySelectorAll(".upcoming-countdown");
    countdownEls.forEach(el => {
      const eventId = el.getAttribute("data-event-id");
      if (!eventId) return;
      const event = AppState.events.find(e => e.id === eventId);
      if (!event) return;

      const countdown = DateHelper.getEventCountdown(event);
      if (!countdown) return;

      const textEl = el.querySelector(".countdown-text");
      if (textEl) {
        textEl.textContent = countdown.text;
      } else {
        el.textContent = countdown.text;
      }

      if (countdown.isLive) {
        el.classList.add("countdown-live");
      } else {
        el.classList.remove("countdown-live");
      }
    });
  },

  init() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => this.updateCountdowns(), 30000); // Sinkronisasi tiap 30 detik
  }
};

// ==========================================================================
// JAM REAL-TIME MAKASSAR (WITA)
// ==========================================================================
const MakassarClock = {
  intervalId: null,

  update() {
    const timeEl = document.getElementById("makassarTime");
    const dateEl = document.getElementById("makassarDate");
    if (!timeEl || !dateEl) return;

    const now = new Date();

    const timeStr = now.toLocaleTimeString("id-ID", {
      timeZone: "Asia/Makassar",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });

    const dateStr = now.toLocaleDateString("id-ID", {
      timeZone: "Asia/Makassar",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    timeEl.textContent = timeStr;
    dateEl.textContent = dateStr;
  },

  init() {
    this.update();
    this.intervalId = setInterval(() => this.update(), 1000);
  }
};

// ==========================================================================
// API CLIENT (KOMUNIKASI DENGAN GOOGLE APPS SCRIPT / LOCALSTORAGE)
// ==========================================================================
const ApiClient = {
  /**
   * Memeriksa apakah URL Apps Script telah dikonfigurasi oleh pengguna
   */
  hasConfiguredUrl() {
    return typeof APPS_SCRIPT_URL === "string" &&
      APPS_SCRIPT_URL.trim() !== "" &&
      APPS_SCRIPT_URL.includes("script.google.com");
  },

  /**
   * 1. GET: Ambil semua kegiatan
   */
  async getAllEvents() {
    if (!this.hasConfiguredUrl()) {
      // Ambil dari LocalStorage untuk mode Demo
      const cached = localStorage.getItem("kalender_kegiatan_data");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            // Normalisasi field default jika ada data lama yang belum memiliki field divisi/proker/petugas/status
            return parsed.map(item => ({
              ...item,
              divisi: item.divisi || "",
              proker: item.proker || "",
              petugas: item.petugas || "",
              status: item.status || "confirmed"
            }));
          }
        } catch (e) {
          console.warn("Gagal parse cache lokal, memuat seed data:", e);
        }
      }
      localStorage.setItem("kalender_kegiatan_data", JSON.stringify(SEED_EVENTS));
      return SEED_EVENTS;
    }

    // Pemanggilan nyata ke Google Apps Script Web App
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "GET",
      mode: "cors"
    });

    if (!response.ok) {
      throw new Error(`Gagal menghubungi server (${response.status} ${response.statusText})`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Gagal memuat data dari spreadsheet");
    }

    const rawData = Array.isArray(result.data) ? result.data : [];
    return rawData.map(item => ({
      ...item,
      lokasi: item.lokasi || "",
      unit: item.unit || "Bersama",
      divisi: item.divisi || "",
      proker: item.proker || "",
      petugas: item.petugas || "",
      status: item.status || "confirmed"
    }));
  },

  /**
   * 2. Login Admin menggunakan Password
   * Mengirimkan password ke Google Apps Script backend untuk divalidasi dengan Script Properties
   */
  async login(pin) {
    if (!this.hasConfiguredUrl()) {
      // Mode Demo / Lokal: Validasi password demo
      const cleanPin = String(pin || "").trim();
      if (!cleanPin) {
        throw new Error("Password Admin tidak boleh kosong.");
      }
      const demoToken = "demo_token_" + Date.now();
      const expiresAt = Date.now() + (3600 * 1000);
      const demoUnit = cleanPin.toLowerCase().includes("akhwat") || cleanPin.startsWith("2") ? "Akhwat" : "Ikhwan";
      return {
        success: true,
        message: `Login admin ${demoUnit} berhasil (Mode Demo Lokal)`,
        token: demoToken,
        expiresAt: expiresAt,
        unit: demoUnit
      };
    }

    // Pemanggilan nyata ke Google Apps Script Web App
    const payload = JSON.stringify({
      action: "login",
      data: {
        pin: String(pin).trim(),
        password: String(pin).trim()
      }
    });

    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: payload
    });

    if (!response.ok) {
      throw new Error(`Respon server bermasalah (${response.status} ${response.statusText})`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Login gagal. Periksa kembali Password Anda.");
    }

    return result;
  },

  /**
   * 3. Verifikasi Token Sesi Admin
   * Memastikan token sesi yang ada di sessionStorage masih valid di backend
   */
  async verifySession(token) {
    if (!token) return false;

    if (!this.hasConfiguredUrl()) {
      return String(token).startsWith("demo_token_");
    }

    try {
      const payload = JSON.stringify({
        action: "verifySession",
        token: token
      });

      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: payload
      });

      if (!response.ok) return false;
      const result = await response.json();
      if (result.success && result.valid) {
        return { valid: true, unit: result.unit || "Ikhwan" };
      }
      return false;
    } catch (e) {
      console.warn("Gagal verifikasi sesi admin ke server:", e);
      return false;
    }
  },

  /**
   * 4. Logout Admin (Pencabutan Token di Backend)
   */
  async logout(token) {
    if (!token) return;

    if (!this.hasConfiguredUrl()) {
      return;
    }

    try {
      const payload = JSON.stringify({
        action: "logout",
        token: token
      });

      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: payload
      });
    } catch (e) {
      console.warn("Peringatan saat logout server:", e);
    }
  },

  /**
   * 5. POST: Mengirim permintaan aksi CRUD (create, update, delete)
   * Menyertakan token sesi admin untuk otorisasi di Google Apps Script
   */
  async postAction(action, data) {
    if (!this.hasConfiguredUrl()) {
      // Simulasi CRUD pada LocalStorage (Hanya jika admin atau demo)
      let events = await this.getAllEvents();

      if (action === "create") {
        const newEvent = {
          ...data,
          unit: data.unit || "Bersama",
          id: "evt_" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000)
        };
        events.push(newEvent);
        localStorage.setItem("kalender_kegiatan_data", JSON.stringify(events));
        return { success: true, message: "Kegiatan berhasil ditambahkan (Mode Demo)", data: newEvent };
      }

      if (action === "update") {
        const index = events.findIndex(item => item.id === data.id);
        if (index === -1) {
          throw new Error("Kegiatan tidak ditemukan di database lokal.");
        }
        events[index] = { ...data, unit: data.unit || events[index].unit || "Bersama" };
        localStorage.setItem("kalender_kegiatan_data", JSON.stringify(events));
        return { success: true, message: "Kegiatan berhasil diperbarui (Mode Demo)", data: events[index] };
      }

      if (action === "delete") {
        events = events.filter(item => item.id !== data.id);
        localStorage.setItem("kalender_kegiatan_data", JSON.stringify(events));
        return { success: true, message: "Kegiatan berhasil dihapus (Mode Demo)", data: { id: data.id } };
      }
    }

    // Pemanggilan nyata ke Google Apps Script
    const payload = JSON.stringify({
      action: action,
      token: AuthState.token, // Mengirim token sesi admin untuk otorisasi backend
      data: data
    });

    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: payload
    });

    if (!response.ok) {
      throw new Error(`Respon server bermasalah (${response.status})`);
    }

    const result = await response.json();
    if (!result.success) {
      // Jika error otorisasi dari backend (token tidak valid / expired), logout otomatis
      if (result.unauthorized) {
        Auth.handleSessionExpired();
      }
      throw new Error(result.error || `Gagal menjalankan aksi ${action}`);
    }

    return result;
  },

  /**
   * 6. GET: Ambil semua data kegiatan arsip (Hanya Admin)
   */
  async getArchiveEvents() {
    if (!this.hasConfiguredUrl()) {
      const cached = localStorage.getItem("kalender_kegiatan_arsip");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) { }
      }
      const demoArchive = [
        {
          id: "arc_demo_1",
          judul: "Penyuluhan Bahaya Narkoba & Kenakalan Remaja",
          deskripsi: "Sosialisasi bersama BNN dan pihak kepolisian untuk seluruh siswa kelas X dan XI.",
          lokasi: "Sekolah (SMKIT IBNUL QAYYIM MAKASSAR)",
          unit: "Ikhwan",
          divisi: "Keislaman dan Pembinaan Karakter",
          proker: "Penyuluhan Karakter Remaja",
          petugas: "Divisi Keislaman",
          tanggal_mulai: "2026-08-10",
          tanggal_selesai: "2026-08-10",
          jam_mulai: "08:00",
          jam_selesai: "11:00",
          status: "confirmed",
          status_pelaksanaan: "Terlaksana",
          keterangan_pelaksanaan: "Kegiatan berjalan lancar dihadiri 250 siswa dan pemateri dari BNN."
        },
        {
          id: "arc_demo_2",
          judul: "Lomba Pidato Bahasa Arab & Inggris Antar Kelas",
          deskripsi: "Kompetisi kebahasaan dalam rangka memperingati Bulan Bahasa sekolah.",
          lokasi: "Sekolah (SMKIT IBNUL QAYYIM MAKASSAR)",
          unit: "Akhwat",
          divisi: "Kepemimpinan dan Kebahasaan",
          proker: "Bulan Bahasa OSIS",
          petugas: "Divisi Kebahasaan",
          tanggal_mulai: "2026-08-18",
          tanggal_selesai: "2026-08-19",
          jam_mulai: "08:30",
          jam_selesai: "14:00",
          status: "confirmed",
          status_pelaksanaan: "Belum Dinilai",
          keterangan_pelaksanaan: ""
        }
      ];
      localStorage.setItem("kalender_kegiatan_arsip", JSON.stringify(demoArchive));
      return demoArchive;
    }

    if (!AuthState.token) {
      throw new Error("Sesi admin tidak ditemukan. Silakan login sebagai admin.");
    }

    const url = `${APPS_SCRIPT_URL}?action=archive&token=${encodeURIComponent(AuthState.token)}`;
    const response = await fetch(url, {
      method: "GET",
      mode: "cors"
    });

    if (!response.ok) {
      throw new Error(`Gagal memuat riwayat arsip (${response.status} ${response.statusText})`);
    }

    const result = await response.json();
    if (!result.success) {
      if (result.unauthorized) {
        Auth.handleSessionExpired();
      }
      throw new Error(result.error || "Gagal memuat riwayat kegiatan dari Arsip.");
    }

    const rawArchive = Array.isArray(result.data) ? result.data : [];
    return rawArchive.map(item => ({
      ...item,
      unit: item.unit || "Bersama"
    }));
  },

  /**
   * 7. POST: Perbarui status & catatan pelaksanaan kegiatan di Arsip (Hanya Admin)
   */
  async updateArchiveStatus(id, statusPelaksanaan, keteranganPelaksanaan) {
    if (!this.hasConfiguredUrl()) {
      let archives = await this.getArchiveEvents();
      const index = archives.findIndex(item => item.id === id);
      if (index === -1) {
        throw new Error("Data arsip tidak ditemukan di database lokal.");
      }
      archives[index].status_pelaksanaan = statusPelaksanaan;
      archives[index].keterangan_pelaksanaan = keteranganPelaksanaan;
      localStorage.setItem("kalender_kegiatan_arsip", JSON.stringify(archives));
      return { success: true, message: "Status pelaksanaan berhasil diperbarui (Mode Demo)", data: archives[index] };
    }

    const payload = JSON.stringify({
      action: "updateArchiveStatus",
      token: AuthState.token,
      data: {
        id: id,
        status_pelaksanaan: statusPelaksanaan,
        keterangan_pelaksanaan: keteranganPelaksanaan
      }
    });

    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: payload
    });

    if (!response.ok) {
      throw new Error(`Respon server bermasalah (${response.status})`);
    }

    const result = await response.json();
    if (!result.success) {
      if (result.unauthorized) {
        Auth.handleSessionExpired();
      }
      throw new Error(result.error || "Gagal memperbarui status pelaksanaan arsip.");
    }

    return result;
  }
};

// ==========================================================================
// TOAST NOTIFIKASI
// ==========================================================================
const Toast = {
  show(message, type = "success", duration = 3500) {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconSvg = "";
    if (type === "success") {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else if (type === "error") {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("toast-hiding");
      setTimeout(() => {
        toast.remove();
      }, 250);
    }, duration);
  }
};

// Helper sanitasi HTML sederhana untuk keamanan XSS
function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ==========================================================================
// RENDERER KALENDER & KOMPONEN UI
// ==========================================================================
const UI = {
  /**
   * Update status badge koneksi (Live vs Demo)
   */
  updateConnectionBadge() {
    const badge = document.getElementById("connectionBadge");
    if (!badge) return;

    const isLive = ApiClient.hasConfiguredUrl();
    AppState.isLiveMode = isLive;

    if (AppState.isLoading) {
      badge.className = "badge-status status-loading";
      badge.innerHTML = `<span class="status-dot"></span><span class="status-text">Menyinkronkan...</span>`;
      return;
    }

    if (isLive) {
      badge.className = "badge-status status-live";
      badge.innerHTML = `<span class="status-dot"></span><span class="status-text">Aktif</span>`;
      badge.title = "Terhubung dengan Google Apps Script Web App";
    } else {
      badge.className = "badge-status status-demo";
      badge.innerHTML = `<span class="status-dot"></span><span class="status-text">Lokal</span>`;
      badge.title = "APPS_SCRIPT_URL belum disetel di script.js. Menggunakan penyimpanan browser.";
    }
  },

  /**
   * Update tampilan elemen UI berdasarkan status otentikasi (Mode Tamu vs Mode Admin)
   */
  updateAuthUI() {
    const isAdmin = AuthState.isAdmin;
    const body = document.body;

    if (isAdmin) {
      body.classList.add("is-admin");
    } else {
      body.classList.remove("is-admin");
    }

    // 1. Tombol Login Admin vs Indikator Admin & Logout di Header
    const loginBtn = document.getElementById("adminLoginBtn");
    const indicatorWrap = document.getElementById("adminIndicatorWrap");

    if (loginBtn) {
      if (isAdmin) loginBtn.classList.add("hidden");
      else loginBtn.classList.remove("hidden");
    }

    if (indicatorWrap) {
      if (isAdmin) {
        indicatorWrap.classList.remove("hidden");
        const badgeAdmin = indicatorWrap.querySelector(".badge-admin");
        if (badgeAdmin) {
          const roleUnit = AuthState.unit || "OSIS";
          badgeAdmin.className = `badge-admin admin-role-pill role-${(AuthState.unit || 'ikhwan').toLowerCase()}`;
          badgeAdmin.innerHTML = `
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span>Admin ${escapeHtml(roleUnit)}</span>
          `;
        }
      } else {
        indicatorWrap.classList.add("hidden");
      }
    }

    // 2. Tombol Riwayat / Arsip Kegiatan di Header
    const openArchiveBtn = document.getElementById("openArchiveModalBtn");
    if (openArchiveBtn) {
      if (isAdmin) openArchiveBtn.classList.remove("hidden");
      else openArchiveBtn.classList.add("hidden");
    }

    // 3. Tombol Tambah Kegiatan di Header
    const openAddBtn = document.getElementById("openAddModalBtn");
    if (openAddBtn) {
      if (isAdmin) openAddBtn.classList.remove("hidden");
      else openAddBtn.classList.add("hidden");
    }

    // 4. Tombol Quick Add di Header Agenda Tanggal Terpilih
    const quickAddBtn = document.getElementById("quickAddBtn");
    if (quickAddBtn) {
      if (isAdmin) quickAddBtn.classList.remove("hidden");
      else quickAddBtn.classList.add("hidden");
    }

    // 5. Tombol Add di Empty State Agenda
    const emptyStateAddBtn = document.getElementById("emptyStateAddBtn");
    if (emptyStateAddBtn) {
      if (isAdmin) emptyStateAddBtn.classList.remove("hidden");
      else emptyStateAddBtn.classList.add("hidden");
    }

    // 6. Tombol Mobile FAB (Floating Action Button)
    const mobileFabBtn = document.getElementById("mobileFabBtn");
    if (mobileFabBtn) {
      if (isAdmin) mobileFabBtn.classList.remove("hidden");
      else mobileFabBtn.classList.add("hidden");
    }
  },

  /**
   * Render grid kalender bulanan
   */
  renderCalendar() {
    const monthYearTitle = document.getElementById("calendarMonthYear");
    const calendarDays = document.getElementById("calendarDays");
    if (!monthYearTitle || !calendarDays) return;

    const year = AppState.viewYear;
    const month = AppState.viewMonth;

    // Set judul bulan & tahun (misal: "September 2026")
    monthYearTitle.textContent = `${DateHelper.BULAN_PANJANG[month]} ${year}`;

    // Perhitungan hari dalam bulan
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Minggu, 1 = Senin, dst
    const totalDaysCurrentMonth = new Date(year, month + 1, 0).getDate();
    const totalDaysPrevMonth = new Date(year, month, 0).getDate();

    const todayStr = DateHelper.toDateString(new Date());

    let html = "";

    // 1. Hari-hari sisa dari bulan sebelumnya
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = totalDaysPrevMonth - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateStr = DateHelper.toDateString(prevDate);
      html += this.buildDayCellHtml(dateStr, dayNum, true, todayStr);
    }

    // 2. Hari-hari di bulan yang sedang ditampilkan
    for (let dayNum = 1; dayNum <= totalDaysCurrentMonth; dayNum++) {
      const currDate = new Date(year, month, dayNum);
      const dateStr = DateHelper.toDateString(currDate);
      html += this.buildDayCellHtml(dateStr, dayNum, false, todayStr);
    }

    // 3. Hari-hari sisa untuk melengkapi grid 7 kolom
    const totalRendered = firstDayIndex + totalDaysCurrentMonth;
    const remainingDays = (7 - (totalRendered % 7)) % 7;
    for (let dayNum = 1; dayNum <= remainingDays; dayNum++) {
      const nextDate = new Date(year, month + 1, dayNum);
      const dateStr = DateHelper.toDateString(nextDate);
      html += this.buildDayCellHtml(dateStr, dayNum, true, todayStr);
    }

    calendarDays.innerHTML = html;

    // Pasang listener klik pada setiap kotak hari
    const dayCells = calendarDays.querySelectorAll(".day-cell");
    dayCells.forEach(cell => {
      cell.addEventListener("click", () => {
        const selectedDate = cell.getAttribute("data-date");
        if (selectedDate) {
          AppState.selectedDate = selectedDate;
          this.renderCalendar();
          this.renderSelectedDateAgenda();
        }
      });
    });

    if (typeof UnitFilterManager !== "undefined") {
      UnitFilterManager.updateCounts();
    }
  },

  /**
   * Membangun string HTML untuk satu kotak hari pada kalender
   */
  buildDayCellHtml(dateStr, dayNum, isOtherMonth, todayStr) {
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === AppState.selectedDate;

    // Cari kegiatan yang berlangsung pada tanggal ini dan sesuai filter unit aktif
    const dayEvents = AppState.events.filter(e =>
      DateHelper.isDateInRange(dateStr, e.tanggal_mulai, e.tanggal_selesai) &&
      matchesUnitFilter(e.unit, AppState.unitFilter)
    );
    const hasEvents = dayEvents.length > 0;

    const classNames = ["day-cell"];
    if (isOtherMonth) classNames.push("other-month");
    if (isToday) classNames.push("today");
    if (isSelected) classNames.push("selected");
    if (hasEvents) classNames.push("has-events");

    // Indikator titik kegiatan (maksimal 3 titik)
    let indicatorsHtml = "";
    if (hasEvents) {
      let dots = "";
      const maxDots = 3;
      const count = Math.min(dayEvents.length, maxDots);

      for (let k = 0; k < count; k++) {
        const ev = dayEvents[k];
        const isTentative = (ev.status || "confirmed").toLowerCase() === "tentative";
        const divKey = getDivisiKey(ev.divisi) || "bersama";
        dots += `<span class="event-dot divisi-${divKey}${isTentative ? " dot-tentative" : ""}"></span>`;
      }
      indicatorsHtml = `<div class="day-indicators">${dots}</div>`;
    }

    return `
      <div class="${classNames.join(" ")}" data-date="${dateStr}" title="${hasEvents ? dayEvents.length + ' Kegiatan' : ''}">
        <span class="day-number">${dayNum}</span>
        ${indicatorsHtml}
      </div>
    `;
  },

  /**
   * Render agenda untuk tanggal yang sedang dipilih
   */
  renderSelectedDateAgenda() {
    const dateTitle = document.getElementById("selectedDateTitle");
    const countBadge = document.getElementById("selectedDateBadge");
    const container = document.getElementById("selectedDateList");
    const emptyState = document.getElementById("emptyAgendaState");

    if (!dateTitle || !container || !emptyState) return;

    const selectedDate = AppState.selectedDate;
    dateTitle.textContent = DateHelper.formatIndoFull(selectedDate);

    // Ambil kegiatan pada tanggal terpilih yang sesuai filter unit aktif
    const matchingEvents = AppState.events.filter(e =>
      DateHelper.isDateInRange(selectedDate, e.tanggal_mulai, e.tanggal_selesai) &&
      matchesUnitFilter(e.unit, AppState.unitFilter)
    );

    countBadge.textContent = `${matchingEvents.length} Kegiatan`;

    if (matchingEvents.length === 0) {
      container.innerHTML = "";
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");

    // Urutkan kegiatan berdasarkan jam mulai
    matchingEvents.sort((a, b) => (a.jam_mulai || "").localeCompare(b.jam_mulai || ""));

    container.innerHTML = matchingEvents.map(event => {
      const isTentative = (event.status || "confirmed").toLowerCase() === "tentative";
      const statusBadge = isTentative
        ? `<span class="status-badge status-badge-tentative">Rencana</span>`
        : `<span class="status-badge status-badge-confirmed">Terkonfirmasi</span>`;

      const unitInfo = getUnitInfo(event.unit);
      const unitBadge = `<span class="unit-badge unit-badge-${unitInfo.key}"><i class="${unitInfo.icon}"></i> <span>${escapeHtml(unitInfo.name)}</span></span>`;

      const divInfo = getDivisiInfo(event.divisi);
      const borderClass = divInfo ? ` border-divisi-${divInfo.key}` : "";
      const divisiBadge = divInfo
        ? `<span class="divisi-badge divisi-${divInfo.key}"><i class="${divInfo.icon}"></i> <span>${escapeHtml(divInfo.name)}</span></span>`
        : "";

      // Kontrol aksi (Edit & Hapus) hanya dirender jika admin memiliki hak akses ke Unit ini
      const isPermitted = canAdminManageUnit(event.unit);
      const adminActionsHtml = (AuthState.isAdmin && isPermitted) ? `
          <div class="event-actions">
            <button class="action-btn edit-btn" data-id="${event.id}" title="Edit Kegiatan" aria-label="Edit kegiatan ${escapeHtml(event.judul)}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="action-btn delete-btn" data-id="${event.id}" title="Hapus Kegiatan" aria-label="Hapus kegiatan ${escapeHtml(event.judul)}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
      ` : "";

      return `
      <div class="event-card${borderClass}${isTentative ? " status-tentative" : ""}" data-id="${event.id}" tabindex="0" role="button" aria-label="Detail kegiatan ${escapeHtml(event.judul)}">
        <div class="event-card-header">
          <div style="display: flex; flex-direction: column; gap: 0.35rem; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap;">
              <h4 class="event-title">${escapeHtml(event.judul)}</h4>
              ${statusBadge}
              ${unitBadge}
              ${divisiBadge}
            </div>
          </div>
          ${adminActionsHtml}
        </div>

        ${event.deskripsi ? `<p class="event-description">${escapeHtml(event.deskripsi)}</p>` : ""}

        <div class="event-meta-grid">
          <div class="meta-item" title="Waktu Pelaksanaan">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>${escapeHtml(event.jam_mulai || "-")} - ${escapeHtml(event.jam_selesai || "-")} WITA</span>
          </div>

          <div class="meta-item" title="Rentang Tanggal">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>${DateHelper.formatDateRange(event.tanggal_mulai, event.tanggal_selesai)}</span>
          </div>

          <div class="meta-item" title="Lokasi Kegiatan">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>${escapeHtml(event.lokasi || "Lokasi belum ditentukan")}</span>
          </div>

          ${event.petugas ? `
            <div class="meta-item" title="Petugas / Penanggung Jawab">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>${escapeHtml(event.petugas)}</span>
            </div>
          ` : ""}
        </div>
      </div>
    `;
    }).join("");

    // Pasang listener klik dan keyboard pada kartu kegiatan untuk membuka modal detail
    container.querySelectorAll(".event-card").forEach(card => {
      const id = card.getAttribute("data-id");
      card.addEventListener("click", (e) => {
        if (e.target.closest(".action-btn")) return;
        if (typeof EventDetailModal !== "undefined") {
          EventDetailModal.open(id, card);
        }
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          if (e.target.closest(".action-btn")) return;
          e.preventDefault();
          if (typeof EventDetailModal !== "undefined") {
            EventDetailModal.open(id, card);
          }
        }
      });
    });

    // Pasang listener pada tombol aksi Edit & Delete jika ada
    container.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        Modal.openEditModal(id);
      });
    });

    container.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        Modal.openDeleteModal(id);
      });
    });
  },

  /**
   * Render daftar kegiatan mendatang (Upcoming Events)
   */
  renderUpcomingEvents() {
    const listContainer = document.getElementById("upcomingList");
    const countBadge = document.getElementById("upcomingBadge");
    const toggleBtn = document.getElementById("toggleUpcomingBtn");
    if (!listContainer || !countBadge) return;

    const todayStr = DateHelper.toDateString(new Date());

    // Ambil kegiatan yang tanggal selesainya hari ini atau setelah hari ini dan sesuai filter unit
    const upcomingEvents = AppState.events
      .filter(e => (e.tanggal_selesai || e.tanggal_mulai) >= todayStr && matchesUnitFilter(e.unit, AppState.unitFilter))
      .sort((a, b) => {
        const dateCompare = (a.tanggal_mulai || "").localeCompare(b.tanggal_mulai || "");
        if (dateCompare !== 0) return dateCompare;
        return (a.jam_mulai || "").localeCompare(b.jam_mulai || "");
      });

    countBadge.textContent = `${upcomingEvents.length} Kegiatan`;

    if (upcomingEvents.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.875rem;">
          Tidak ada kegiatan mendatang yang dijadwalkan.
        </div>
      `;
      if (toggleBtn) toggleBtn.classList.add("hidden");
      return;
    }

    const maxDefault = 4;
    const isExpanded = AppState.showAllUpcoming;
    const displayedEvents = isExpanded ? upcomingEvents : upcomingEvents.slice(0, maxDefault);

    listContainer.innerHTML = displayedEvents.map(event => {
      const startDate = DateHelper.parseLocalDate(event.tanggal_mulai);
      const dayNum = startDate.getDate();
      const monthShort = DateHelper.BULAN_PENDEK[startDate.getMonth()];
      const isTentative = (event.status || "confirmed").toLowerCase() === "tentative";
      const countdown = DateHelper.getEventCountdown(event);
      const divInfo = getDivisiInfo(event.divisi);
      const borderClass = divInfo ? ` border-divisi-${divInfo.key}` : "";

      const unitInfo = getUnitInfo(event.unit);
      const unitBadge = `<span class="unit-badge unit-badge-${unitInfo.key}"><i class="${unitInfo.icon}"></i> <span>${escapeHtml(unitInfo.name)}</span></span>`;
      const divisiBadge = divInfo
        ? `<span class="divisi-badge divisi-${divInfo.key}" title="Divisi: ${escapeHtml(divInfo.name)}"><i class="${divInfo.icon}"></i> <span>${escapeHtml(divInfo.name)}</span></span>`
        : "";

      return `
        <div class="upcoming-item${borderClass}${isTentative ? " status-tentative" : ""}" data-date="${event.tanggal_mulai}" title="Klik untuk membuka tanggal kegiatan">
          <div class="upcoming-item-left">
            <div class="date-pill">
              <span class="date-pill-day">${dayNum}</span>
              <span class="date-pill-month">${monthShort}</span>
            </div>
            <div class="upcoming-item-info">
              <div style="display: flex; align-items: center; gap: 0.4rem; min-width: 0; width: 100%; flex-wrap: wrap;">
                <div class="upcoming-item-title">${escapeHtml(event.judul)}</div>
                ${isTentative ? `<span class="status-badge status-badge-tentative" style="padding: 0.05rem 0.4rem; font-size: 0.625rem; flex-shrink: 0;">Rencana</span>` : ""}
                ${unitBadge}
              </div>
              <div class="upcoming-item-meta">
                <div class="meta-item" title="Waktu Pelaksanaan">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>${escapeHtml(event.jam_mulai || "-")} WITA</span>
                </div>
                ${divisiBadge}
                <div class="meta-item" title="Lokasi Kegiatan">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>${escapeHtml(event.lokasi || "-")}</span>
                </div>
                ${countdown ? `
                  <span class="upcoming-countdown${countdown.isLive ? " countdown-live" : ""}" data-event-id="${event.id}">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M5 22h14"></path>
                      <path d="M5 2h14"></path>
                      <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"></path>
                      <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"></path>
                    </svg>
                    <span class="countdown-text">${escapeHtml(countdown.text)}</span>
                  </span>` : ""}
              </div>
            </div>
          </div>
          <div style="color: var(--text-light); font-size: 1rem; flex-shrink: 0;">›</div>
        </div>
      `;
    }).join("");

    // Tombol toggle lihat selengkapnya
    if (toggleBtn) {
      if (upcomingEvents.length > maxDefault) {
        toggleBtn.classList.remove("hidden");
        toggleBtn.textContent = isExpanded ? "Tampilkan Lebih Sedikit" : `Lihat Lainnya (${upcomingEvents.length - maxDefault})`;
      } else {
        toggleBtn.classList.add("hidden");
      }
    }

    // Klik item kegiatan mendatang untuk langsung berpindah ke tanggal tersebut
    listContainer.querySelectorAll(".upcoming-item").forEach(item => {
      item.addEventListener("click", () => {
        const dateStr = item.getAttribute("data-date");
        if (dateStr) {
          const targetDate = DateHelper.parseLocalDate(dateStr);
          AppState.viewYear = targetDate.getFullYear();
          AppState.viewMonth = targetDate.getMonth();
          AppState.selectedDate = dateStr;
          this.renderCalendar();
          this.renderSelectedDateAgenda();
        }
      });
    });
  }
};

// ==========================================================================
// CONTROLLER FILTER UNIT (IKHWAN / AKHWAT / SEMUA)
// ==========================================================================
const UnitFilterManager = {
  STORAGE_KEY: "osis_unit_filter",

  init() {
    // Read preference
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved && (saved === "Semua" || saved === "Ikhwan" || saved === "Akhwat" || saved === "Bersama")) {
        AppState.unitFilter = saved;
      }
    } catch (e) {
      AppState.unitFilter = "Semua";
    }

    this.updateButtonsUI();

    const buttons = document.querySelectorAll(".unit-filter-btn");
    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        const unit = btn.getAttribute("data-unit") || "Semua";
        this.setFilter(unit);
      });
    });
  },

  setFilter(unit) {
    AppState.unitFilter = unit;
    try {
      localStorage.setItem(this.STORAGE_KEY, unit);
    } catch (e) { }

    this.updateButtonsUI();
    UI.renderCalendar();
    UI.renderSelectedDateAgenda();
    UI.renderUpcomingEvents();

    if (typeof ArchiveModal !== "undefined" && ArchiveModal.cachedItems) {
      ArchiveModal.renderList(ArchiveModal.cachedItems);
    }
  },

  updateButtonsUI() {
    const current = AppState.unitFilter || "Semua";
    const buttons = document.querySelectorAll(".unit-filter-btn");
    buttons.forEach(btn => {
      const u = btn.getAttribute("data-unit");
      const isMatch = (u === current);
      btn.classList.toggle("active", isMatch);
      btn.setAttribute("aria-selected", isMatch ? "true" : "false");
    });
  },

  updateCounts() {
    const countSemua = document.getElementById("badgeCountSemua");
    const countIkhwan = document.getElementById("badgeCountIkhwan");
    const countAkhwat = document.getElementById("badgeCountAkhwat");
    const countBersama = document.getElementById("badgeCountBersama");

    if (!countSemua) return;

    const events = AppState.events || [];
    const totalSemua = events.length;
    let totalIkhwan = 0;
    let totalAkhwat = 0;
    let totalBersama = 0;

    events.forEach(e => {
      const u = String(e.unit || "Bersama").trim().toLowerCase();
      if (u === "ikhwan") {
        totalIkhwan++;
      } else if (u === "akhwat") {
        totalAkhwat++;
      } else {
        totalBersama++;
      }
    });

    if (countSemua) countSemua.textContent = String(totalSemua);
    if (countIkhwan) countIkhwan.textContent = String(totalIkhwan);
    if (countAkhwat) countAkhwat.textContent = String(totalAkhwat);
    if (countBersama) countBersama.textContent = String(totalBersama);
  }
};

// ==========================================================================
// CUSTOM DROPDOWN CONTROLLER (STATUS KEGIATAN)
// ==========================================================================
const StatusDropdown = {
  wrap: null,
  trigger: null,
  optionsList: null,
  hiddenInput: null,
  isOpen: false,

  init() {
    this.wrap = document.getElementById("customStatusDropdown");
    this.trigger = document.getElementById("customStatusTrigger");
    this.optionsList = document.getElementById("customStatusOptions");
    this.hiddenInput = document.getElementById("eventStatus");

    if (!this.wrap || !this.trigger || !this.optionsList || !this.hiddenInput) return;

    // Toggle dropdown open/close on trigger click
    this.trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggle();
    });

    // Keyboard support on trigger
    this.trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        this.open();
        const firstOption = this.optionsList.querySelector(".custom-select-option");
        if (firstOption) firstOption.focus();
      }
    });

    // Option clicks & keyboard selection
    this.optionsList.querySelectorAll(".custom-select-option").forEach(opt => {
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        const val = opt.getAttribute("data-value");
        this.setValue(val);
        this.close();
        this.trigger.focus();
      });

      opt.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const val = opt.getAttribute("data-value");
          this.setValue(val);
          this.close();
          this.trigger.focus();
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          const next = opt.nextElementSibling;
          if (next) next.focus();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          const prev = opt.previousElementSibling;
          if (prev) prev.focus();
        } else if (e.key === "Escape") {
          this.close();
          this.trigger.focus();
        }
      });
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (this.isOpen && !this.wrap.contains(e.target)) {
        this.close();
      }
    });
  },

  open() {
    if (typeof DivisiDropdown !== "undefined" && DivisiDropdown.isOpen) {
      DivisiDropdown.close();
    }
    if (typeof LokasiDropdown !== "undefined" && LokasiDropdown.isOpen) {
      LokasiDropdown.close();
    }
    if (typeof UnitDropdown !== "undefined" && UnitDropdown.isOpen) {
      UnitDropdown.close();
    }
    this.isOpen = true;
    this.wrap.classList.add("open");
    this.optionsList.classList.remove("hidden");
    this.trigger.setAttribute("aria-expanded", "true");
    this.trigger.classList.add("active");
  },

  close() {
    this.isOpen = false;
    this.wrap.classList.remove("open");
    this.optionsList.classList.add("hidden");
    this.trigger.setAttribute("aria-expanded", "false");
    this.trigger.classList.remove("active");
  },

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  },

  setValue(val = "confirmed") {
    if (!this.hiddenInput) return;
    const cleanVal = (val === "tentative") ? "tentative" : "confirmed";
    this.hiddenInput.value = cleanVal;

    // Update selected item in options list
    if (this.optionsList) {
      this.optionsList.querySelectorAll(".custom-select-option").forEach(opt => {
        const isMatch = opt.getAttribute("data-value") === cleanVal;
        opt.classList.toggle("selected", isMatch);
        opt.setAttribute("aria-selected", isMatch ? "true" : "false");
      });
    }

    // Update trigger button UI
    if (this.trigger) {
      const valWrap = this.trigger.querySelector(".custom-select-value");
      if (valWrap) {
        if (cleanVal === "tentative") {
          valWrap.innerHTML = `<span class="status-option-badge status-badge-tentative">Rencana (Tentatif)</span>`;
        } else {
          valWrap.innerHTML = `<span class="status-option-badge status-badge-confirmed">Terkonfirmasi (Pasti)</span>`;
        }
      }
    }
  },

  getValue() {
    return this.hiddenInput ? this.hiddenInput.value : "confirmed";
  }
};

// ==========================================================================
// CUSTOM DROPDOWN CONTROLLER (DIVISI PENANGGUNG JAWAB)
// ==========================================================================
const DivisiDropdown = {
  wrap: null,
  trigger: null,
  optionsList: null,
  hiddenInput: null,
  lainnyaWrap: null,
  lainnyaInput: null,
  isOpen: false,

  init() {
    this.wrap = document.getElementById("customDivisiDropdown");
    this.trigger = document.getElementById("customDivisiTrigger");
    this.optionsList = document.getElementById("customDivisiOptions");
    this.hiddenInput = document.getElementById("eventDivisi");
    this.lainnyaWrap = document.getElementById("divisiLainnyaWrap");
    this.lainnyaInput = document.getElementById("eventDivisiLainnya");

    if (!this.wrap || !this.trigger || !this.optionsList || !this.hiddenInput) return;

    // Toggle dropdown open/close on trigger click
    this.trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggle();
    });

    // Keyboard support on trigger
    this.trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        this.open();
        const firstOption = this.optionsList.querySelector(".custom-select-option");
        if (firstOption) firstOption.focus();
      }
    });

    // Listen to input on custom lainnya text input
    if (this.lainnyaInput) {
      this.lainnyaInput.addEventListener("input", () => {
        if (this.hiddenInput && this.hiddenInput.value === "Lainnya") {
          this.updateTriggerDisplay(this.lainnyaInput.value.trim() || "Lainnya", true);
        }
      });
    }

    // Option clicks & keyboard selection (single-select: closes dropdown on selection)
    this.optionsList.querySelectorAll(".custom-select-option").forEach(opt => {
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        const val = opt.getAttribute("data-value");
        this.setValue(val);
        this.close();
        this.trigger.focus();
      });

      opt.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const val = opt.getAttribute("data-value");
          this.setValue(val);
          this.close();
          this.trigger.focus();
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          const next = opt.nextElementSibling;
          if (next) next.focus();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          const prev = opt.previousElementSibling;
          if (prev) prev.focus();
        } else if (e.key === "Escape") {
          this.close();
          this.trigger.focus();
        } else if (e.key === "Tab") {
          this.close();
        }
      });
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (this.isOpen && !this.wrap.contains(e.target) && (!this.lainnyaWrap || !this.lainnyaWrap.contains(e.target))) {
        this.close();
      }
    });
  },

  open() {
    if (typeof StatusDropdown !== "undefined" && StatusDropdown.isOpen) StatusDropdown.close();
    if (typeof LokasiDropdown !== "undefined" && LokasiDropdown.isOpen) LokasiDropdown.close();
    if (typeof UnitDropdown !== "undefined" && UnitDropdown.isOpen) UnitDropdown.close();
    this.isOpen = true;
    this.wrap.classList.add("open");
    this.optionsList.classList.remove("hidden");
    this.trigger.setAttribute("aria-expanded", "true");
    this.trigger.classList.add("active");
  },

  close() {
    this.isOpen = false;
    this.wrap.classList.remove("open");
    this.optionsList.classList.add("hidden");
    this.trigger.setAttribute("aria-expanded", "false");
    this.trigger.classList.remove("active");
  },

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  },

  updateTriggerDisplay(displayText, isCustom = false, info = null) {
    if (!this.trigger) return;
    const valWrap = this.trigger.querySelector(".custom-select-value");
    if (!valWrap) return;

    if (!displayText) {
      valWrap.innerHTML = `<span class="divisi-placeholder" style="color: var(--text-muted);">Pilih Divisi Penanggung Jawab</span>`;
      return;
    }

    if (isCustom) {
      valWrap.innerHTML = `
        <div class="divisi-selected-display">
          <span class="divisi-option-icon icon-divisi-lainnya"><i class="fa-solid fa-ellipsis"></i></span>
          <span class="divisi-name-text">${escapeHtml(displayText)}</span>
        </div>
      `;
      return;
    }

    const key = info ? info.key : "bersama";
    const icon = info ? info.icon : "fa-solid fa-people-group";
    valWrap.innerHTML = `
      <div class="divisi-selected-display">
        <span class="divisi-option-icon icon-divisi-${key}"><i class="${icon}"></i></span>
        <span class="divisi-name-text">${escapeHtml(displayText)}</span>
      </div>
    `;
  },

  setValue(val = "") {
    if (!this.hiddenInput) return;
    const cleanVal = (val || "").trim();

    if (!cleanVal) {
      this.hiddenInput.value = "";
      if (this.lainnyaWrap) this.lainnyaWrap.classList.add("hidden");
      if (this.lainnyaInput) {
        this.lainnyaInput.value = "";
        this.lainnyaInput.removeAttribute("required");
      }
      if (this.optionsList) {
        this.optionsList.querySelectorAll(".custom-select-option").forEach(opt => {
          opt.classList.remove("selected");
          opt.setAttribute("aria-selected", "false");
        });
      }
      this.updateTriggerDisplay("");
      return;
    }

    // Check fixed 5 options (Keislaman, Kepemimpinan, Media, Kewirausahaan, Bersama)
    let fixed = null;
    if (cleanVal.toLowerCase() === "bersama" || cleanVal.toLowerCase() === "bersama / proker bersama") {
      fixed = DIVISI_OPTIONS.find(d => d.key === "bersama");
    } else {
      fixed = DIVISI_OPTIONS.find(d => d.name.toLowerCase() === cleanVal.toLowerCase() && d.key !== "lainnya");
    }

    if (fixed) {
      // One of the fixed options
      this.hiddenInput.value = fixed.name;
      if (this.lainnyaWrap) this.lainnyaWrap.classList.add("hidden");
      if (this.lainnyaInput) {
        this.lainnyaInput.value = "";
        this.lainnyaInput.removeAttribute("required");
      }
      if (this.optionsList) {
        this.optionsList.querySelectorAll(".custom-select-option").forEach(opt => {
          const isMatch = opt.getAttribute("data-value") === fixed.name;
          opt.classList.toggle("selected", isMatch);
          opt.setAttribute("aria-selected", isMatch ? "true" : "false");
        });
      }
      this.updateTriggerDisplay(fixed.name, false, fixed);
    } else {
      // Option "Lainnya" / Custom / Legacy comma-joined multi-divisi text
      this.hiddenInput.value = "Lainnya";
      if (this.lainnyaWrap) this.lainnyaWrap.classList.remove("hidden");
      if (this.lainnyaInput) {
        this.lainnyaInput.setAttribute("required", "required");
        if (cleanVal !== "Lainnya") {
          this.lainnyaInput.value = cleanVal;
        }
        setTimeout(() => {
          if (cleanVal === "Lainnya") this.lainnyaInput.focus();
        }, 100);
      }
      if (this.optionsList) {
        this.optionsList.querySelectorAll(".custom-select-option").forEach(opt => {
          const isMatch = opt.getAttribute("data-value") === "Lainnya";
          opt.classList.toggle("selected", isMatch);
          opt.setAttribute("aria-selected", isMatch ? "true" : "false");
        });
      }
      const displayText = (cleanVal !== "Lainnya" && cleanVal.length > 0) ? cleanVal : "Lainnya";
      this.updateTriggerDisplay(displayText, true);
    }
  },

  getValue() {
    if (!this.hiddenInput) return "";
    if (this.hiddenInput.value === "Lainnya") {
      return this.lainnyaInput ? this.lainnyaInput.value.trim() : "";
    }
    return this.hiddenInput.value;
  },

  reset() {
    this.setValue("");
  }
};

// ==========================================================================
// CUSTOM DROPDOWN CONTROLLER (LOKASI KEGIATAN)
// ==========================================================================
const LokasiDropdown = {
  wrap: null,
  trigger: null,
  optionsList: null,
  hiddenInput: null,
  lainnyaWrap: null,
  lainnyaInput: null,
  isOpen: false,

  FIXED_OPTIONS: [
    { name: "Sekolah (SMKIT IBNUL QAYYIM MAKASSAR)", icon: "fa-solid fa-school", class: "icon-lokasi-sekolah" },
    { name: "Masjid Pendidikan IQIS", icon: "fa-solid fa-mosque", class: "icon-lokasi-masjid" }
  ],

  init() {
    this.wrap = document.getElementById("customLokasiDropdown");
    this.trigger = document.getElementById("customLokasiTrigger");
    this.optionsList = document.getElementById("customLokasiOptions");
    this.hiddenInput = document.getElementById("eventLokasi");
    this.lainnyaWrap = document.getElementById("lokasiLainnyaWrap");
    this.lainnyaInput = document.getElementById("eventLokasiLainnya");

    if (!this.wrap || !this.trigger || !this.optionsList || !this.hiddenInput) return;

    // Toggle dropdown open/close on trigger click
    this.trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggle();
    });

    // Keyboard support on trigger
    this.trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        this.open();
        const firstOption = this.optionsList.querySelector(".custom-select-option");
        if (firstOption) firstOption.focus();
      }
    });

    // Option clicks & keyboard selection (single-select: closes dropdown on selection)
    this.optionsList.querySelectorAll(".custom-select-option").forEach(opt => {
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        const val = opt.getAttribute("data-value");
        this.setValue(val);
        this.close();
        this.trigger.focus();
      });

      opt.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const val = opt.getAttribute("data-value");
          this.setValue(val);
          this.close();
          this.trigger.focus();
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          const next = opt.nextElementSibling;
          if (next) next.focus();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          const prev = opt.previousElementSibling;
          if (prev) prev.focus();
        } else if (e.key === "Escape") {
          this.close();
          this.trigger.focus();
        }
      });
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (this.isOpen && !this.wrap.contains(e.target)) {
        this.close();
      }
    });
  },

  open() {
    if (typeof StatusDropdown !== "undefined" && StatusDropdown.isOpen) StatusDropdown.close();
    if (typeof DivisiDropdown !== "undefined" && DivisiDropdown.isOpen) DivisiDropdown.close();
    if (typeof UnitDropdown !== "undefined" && UnitDropdown.isOpen) UnitDropdown.close();
    this.isOpen = true;
    this.wrap.classList.add("open");
    this.optionsList.classList.remove("hidden");
    this.trigger.setAttribute("aria-expanded", "true");
    this.trigger.classList.add("active");
  },

  close() {
    this.isOpen = false;
    this.wrap.classList.remove("open");
    this.optionsList.classList.add("hidden");
    this.trigger.setAttribute("aria-expanded", "false");
    this.trigger.classList.remove("active");
  },

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  },

  setValue(val = "") {
    if (!this.hiddenInput) return;
    const cleanVal = (val || "").trim();

    if (!cleanVal) {
      // Reset / Kosong
      this.hiddenInput.value = "";
      if (this.lainnyaWrap) this.lainnyaWrap.classList.add("hidden");
      if (this.lainnyaInput) {
        this.lainnyaInput.value = "";
        this.lainnyaInput.removeAttribute("required");
      }
      if (this.optionsList) {
        this.optionsList.querySelectorAll(".custom-select-option").forEach(opt => {
          opt.classList.remove("selected");
          opt.setAttribute("aria-selected", "false");
        });
      }
      if (this.trigger) {
        const valWrap = this.trigger.querySelector(".custom-select-value");
        if (valWrap) {
          valWrap.innerHTML = `<span class="lokasi-placeholder" style="color: var(--text-muted);">Pilih Lokasi Kegiatan</span>`;
        }
      }
      return;
    }

    const fixed = this.FIXED_OPTIONS.find(f => f.name.toLowerCase() === cleanVal.toLowerCase());
    if (fixed) {
      // Salah satu dari 2 opsi tetap
      this.hiddenInput.value = fixed.name;
      if (this.lainnyaWrap) this.lainnyaWrap.classList.add("hidden");
      if (this.lainnyaInput) {
        this.lainnyaInput.value = "";
        this.lainnyaInput.removeAttribute("required");
      }
      if (this.optionsList) {
        this.optionsList.querySelectorAll(".custom-select-option").forEach(opt => {
          const isMatch = opt.getAttribute("data-value") === fixed.name;
          opt.classList.toggle("selected", isMatch);
          opt.setAttribute("aria-selected", isMatch ? "true" : "false");
        });
      }
      if (this.trigger) {
        const valWrap = this.trigger.querySelector(".custom-select-value");
        if (valWrap) {
          valWrap.innerHTML = `
            <div class="lokasi-selected-display">
              <span class="lokasi-option-icon ${fixed.class}"><i class="${fixed.icon}"></i></span>
              <span class="lokasi-name-text">${escapeHtml(fixed.name)}</span>
            </div>
          `;
        }
      }
    } else {
      // Opsi "Lainnya" / Lokasi Kustom Bebas (Termasuk data lama/legacy & multi-lokasi)
      this.hiddenInput.value = "Lainnya";
      if (this.lainnyaWrap) this.lainnyaWrap.classList.remove("hidden");
      if (this.lainnyaInput) {
        this.lainnyaInput.setAttribute("required", "required");
        if (cleanVal !== "Lainnya") {
          this.lainnyaInput.value = cleanVal;
        }
        setTimeout(() => {
          if (cleanVal === "Lainnya") this.lainnyaInput.focus();
        }, 100);
      }
      if (this.optionsList) {
        this.optionsList.querySelectorAll(".custom-select-option").forEach(opt => {
          const isMatch = opt.getAttribute("data-value") === "Lainnya";
          opt.classList.toggle("selected", isMatch);
          opt.setAttribute("aria-selected", isMatch ? "true" : "false");
        });
      }
      if (this.trigger) {
        const valWrap = this.trigger.querySelector(".custom-select-value");
        if (valWrap) {
          valWrap.innerHTML = `
            <div class="lokasi-selected-display">
              <span class="lokasi-option-icon icon-lokasi-lainnya"><i class="fa-solid fa-location-dot"></i></span>
              <span class="lokasi-name-text">${cleanVal !== "Lainnya" ? escapeHtml(cleanVal) : "Lainnya"}</span>
            </div>
          `;
        }
      }
    }
  },

  getValue() {
    if (!this.hiddenInput) return "";
    if (this.hiddenInput.value === "Lainnya") {
      return this.lainnyaInput ? this.lainnyaInput.value.trim() : "";
    }
    return this.hiddenInput.value;
  },

  reset() {
    this.setValue("");
  }
};

// ==========================================================================
// CUSTOM DROPDOWN CONTROLLER (UNIT SATUAN)
// ==========================================================================
const UnitDropdown = {
  wrap: null,
  trigger: null,
  optionsList: null,
  hiddenInput: null,
  isOpen: false,

  init() {
    this.wrap = document.getElementById("customUnitDropdown");
    this.trigger = document.getElementById("customUnitTrigger");
    this.optionsList = document.getElementById("customUnitOptions");
    this.hiddenInput = document.getElementById("eventUnit");

    if (!this.wrap || !this.trigger || !this.optionsList || !this.hiddenInput) return;

    // Toggle dropdown open/close on trigger click
    this.trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggle();
    });

    // Keyboard support on trigger
    this.trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        this.open();
        const firstOption = this.optionsList.querySelector(".custom-select-option");
        if (firstOption) firstOption.focus();
      }
    });

    // Option clicks & keyboard selection
    this.optionsList.querySelectorAll(".custom-select-option").forEach(opt => {
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        const val = opt.getAttribute("data-value");
        this.setValue(val);
        this.close();
        this.trigger.focus();
      });

      opt.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const val = opt.getAttribute("data-value");
          this.setValue(val);
          this.close();
          this.trigger.focus();
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          const next = opt.nextElementSibling;
          if (next) next.focus();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          const prev = opt.previousElementSibling;
          if (prev) prev.focus();
        } else if (e.key === "Escape") {
          this.close();
          this.trigger.focus();
        }
      });
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (this.isOpen && !this.wrap.contains(e.target)) {
        this.close();
      }
    });
  },

  open() {
    if (typeof StatusDropdown !== "undefined" && StatusDropdown.isOpen) StatusDropdown.close();
    if (typeof DivisiDropdown !== "undefined" && DivisiDropdown.isOpen) DivisiDropdown.close();
    if (typeof LokasiDropdown !== "undefined" && LokasiDropdown.isOpen) LokasiDropdown.close();
    this.isOpen = true;
    this.wrap.classList.add("open");
    this.optionsList.classList.remove("hidden");
    this.trigger.setAttribute("aria-expanded", "true");
    this.trigger.classList.add("active");
  },

  close() {
    this.isOpen = false;
    this.wrap.classList.remove("open");
    this.optionsList.classList.add("hidden");
    this.trigger.setAttribute("aria-expanded", "false");
    this.trigger.classList.remove("active");
  },

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  },

  setValue(val = "") {
    if (!this.hiddenInput) return;
    const cleanVal = (val || "").trim();

    if (!cleanVal) {
      this.hiddenInput.value = "";
      if (this.optionsList) {
        this.optionsList.querySelectorAll(".custom-select-option").forEach(opt => {
          opt.classList.remove("selected");
          opt.setAttribute("aria-selected", "false");
        });
      }
      if (this.trigger) {
        const valWrap = this.trigger.querySelector(".custom-select-value");
        if (valWrap) {
          valWrap.innerHTML = `<span class="unit-placeholder" style="color: var(--text-muted);">Pilih Unit Satuan</span>`;
        }
      }
      return;
    }

    const unitInfo = getUnitInfo(cleanVal);
    this.hiddenInput.value = unitInfo.name;

    if (this.optionsList) {
      this.optionsList.querySelectorAll(".custom-select-option").forEach(opt => {
        const isMatch = opt.getAttribute("data-value").toLowerCase() === unitInfo.name.toLowerCase();
        opt.classList.toggle("selected", isMatch);
        opt.setAttribute("aria-selected", isMatch ? "true" : "false");
      });
    }

    if (this.trigger) {
      const valWrap = this.trigger.querySelector(".custom-select-value");
      if (valWrap) {
        valWrap.innerHTML = `
          <div class="unit-selected-display">
            <span class="unit-option-icon icon-unit-${unitInfo.key}"><i class="${unitInfo.icon}"></i></span>
            <span class="unit-name-text">${escapeHtml(unitInfo.name)}</span>
          </div>
        `;
      }
    }
  },

  getValue() {
    return this.hiddenInput ? this.hiddenInput.value.trim() : "";
  },

  reset() {
    this.setValue("");
  }
};

// ==========================================================================
// MULTI-PETUGAS DYNAMIC LIST MANAGER
// ==========================================================================
const PetugasInputManager = {
  container: null,
  addBtn: null,

  init() {
    this.container = document.getElementById("petugasListContainer");
    this.addBtn = document.getElementById("addPetugasBtn");

    if (this.addBtn) {
      this.addBtn.addEventListener("click", () => {
        this.addRow("");
        const inputs = this.container.querySelectorAll(".event-petugas-input");
        if (inputs.length > 0) {
          inputs[inputs.length - 1].focus();
        }
      });
    }

    if (this.container) {
      this.container.addEventListener("click", (e) => {
        const removeBtn = e.target.closest(".btn-remove-petugas");
        if (!removeBtn) return;

        const row = removeBtn.closest(".petugas-row");
        const allRows = this.container.querySelectorAll(".petugas-row");

        if (allRows.length <= 1) {
          // Hanya tersisa 1 baris: bersihkan nilai teks (pertahankan minimal 1 baris)
          const input = row.querySelector(".event-petugas-input");
          if (input) {
            input.value = "";
            input.focus();
          }
        } else {
          // Hapus baris petugas
          row.remove();
          this.refreshPlaceholders();
        }
      });
    }
  },

  createRow(value = "", isFirst = false) {
    const row = document.createElement("div");
    row.className = "petugas-row";

    const placeholder = isFirst
      ? "Nama petugas, atau tulis 'Bersama' untuk proker kolektif"
      : "Nama petugas tambahan / penanggung jawab...";

    row.innerHTML = `
      <div class="input-icon-wrap">
        <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <input type="text" class="form-control with-icon event-petugas-input"
          placeholder="${placeholder}" maxlength="100" value="${escapeHtml(value)}">
      </div>
      <button type="button" class="btn-remove-petugas" title="Hapus / bersihkan baris petugas" aria-label="Hapus petugas">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;

    return row;
  },

  addRow(value = "") {
    if (!this.container) return;
    const isFirst = this.container.children.length === 0;
    const row = this.createRow(value, isFirst);
    this.container.appendChild(row);
    this.refreshPlaceholders();
  },

  setValues(petugasStr = "") {
    if (!this.container) return;
    this.container.innerHTML = "";

    if (!petugasStr || !petugasStr.trim()) {
      this.addRow("");
      return;
    }

    const items = petugasStr
      .split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (items.length === 0) {
      this.addRow("");
    } else {
      items.forEach((val, idx) => {
        const row = this.createRow(val, idx === 0);
        this.container.appendChild(row);
      });
    }
    this.refreshPlaceholders();
  },

  getValue() {
    if (!this.container) return "";
    const inputs = this.container.querySelectorAll(".event-petugas-input");
    const values = [];
    inputs.forEach(inp => {
      const val = inp.value.trim();
      if (val) {
        values.push(val);
      }
    });
    return values.join(", ");
  },

  reset() {
    this.setValues("");
  },

  refreshPlaceholders() {
    if (!this.container) return;
    const rows = this.container.querySelectorAll(".petugas-row");
    rows.forEach((r, idx) => {
      const inp = r.querySelector(".event-petugas-input");
      if (inp) {
        inp.placeholder = idx === 0
          ? "Nama petugas, atau tulis 'Bersama' untuk proker kolektif"
          : "Nama petugas tambahan / penanggung jawab...";
      }
      const btn = r.querySelector(".btn-remove-petugas");
      if (btn) {
        btn.title = rows.length === 1 ? "Bersihkan teks petugas" : "Hapus baris petugas";
      }
    });
  }
};

// ==========================================================================
// PROKER AUTOCOMPLETE / DATALIST MANAGER
// ==========================================================================
const ProkerSuggestionsManager = {
  updateDatalist() {
    const datalist = document.getElementById("eventProkerList");
    if (!datalist || !Array.isArray(AppState.events)) return;

    const uniqueProkers = new Set();
    AppState.events.forEach(ev => {
      if (ev.proker && ev.proker.trim()) {
        uniqueProkers.add(ev.proker.trim());
      }
    });

    datalist.innerHTML = Array.from(uniqueProkers)
      .sort((a, b) => a.localeCompare(b))
      .map(p => `<option value="${escapeHtml(p)}"></option>`)
      .join("");
  }
};

// ==========================================================================
// FLATPICKR CONTROLLER (PICKER TANGGAL & JAM)
// ==========================================================================
const FormPickers = {
  fpTanggalMulai: null,
  fpTanggalSelesai: null,
  fpJamMulai: null,
  fpJamSelesai: null,

  init() {
    if (typeof flatpickr !== "undefined") {
      const localeId = (flatpickr.l10ns && flatpickr.l10ns.id) ? flatpickr.l10ns.id : "default";

      // Helper untuk onOpen reposisi dan scroll into view
      const handleOpen = (selectedDates, dateStr, instance) => {
        if (instance.element) {
          instance.element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        const reposition = () => {
          if (instance.isOpen && typeof instance._positionCalendar === "function") {
            instance._positionCalendar();
          }
        };
        requestAnimationFrame(reposition);
        setTimeout(reposition, 80);
        setTimeout(reposition, 200);
        setTimeout(reposition, 350);
      };

      // 1. Tanggal Mulai
      const inputTglMulai = document.getElementById("eventTanggalMulai");
      if (inputTglMulai) {
        this.fpTanggalMulai = flatpickr(inputTglMulai, {
          dateFormat: "Y-m-d",
          locale: localeId,
          monthSelectorType: "static",
          disableMobile: "true",
          allowInput: false,
          onOpen: handleOpen,
          onChange: (selectedDates, dateStr) => {
            if (!dateStr) return;
            // Sinkronisasi otomatis: Jika tanggal selesai kosong atau lebih awal dari tanggal mulai
            if (this.fpTanggalSelesai) {
              const endDateVal = document.getElementById("eventTanggalSelesai").value;
              if (!endDateVal || endDateVal < dateStr) {
                this.fpTanggalSelesai.setDate(dateStr, true);
              }
              // Update batasan minimal tanggal selesai
              this.fpTanggalSelesai.set("minDate", dateStr);
            }
          }
        });
      }

      // 2. Tanggal Selesai
      const inputTglSelesai = document.getElementById("eventTanggalSelesai");
      if (inputTglSelesai) {
        this.fpTanggalSelesai = flatpickr(inputTglSelesai, {
          dateFormat: "Y-m-d",
          locale: localeId,
          monthSelectorType: "static",
          disableMobile: "true",
          allowInput: false,
          onOpen: handleOpen
        });
      }

      // 3. Jam Mulai
      const inputJamMulai = document.getElementById("eventJamMulai");
      if (inputJamMulai) {
        this.fpJamMulai = flatpickr(inputJamMulai, {
          enableTime: true,
          noCalendar: true,
          dateFormat: "H:i",
          time_24hr: true,
          disableMobile: "true",
          allowInput: false,
          onOpen: handleOpen
        });
      }

      // 4. Jam Selesai
      const inputJamSelesai = document.getElementById("eventJamSelesai");
      if (inputJamSelesai) {
        this.fpJamSelesai = flatpickr(inputJamSelesai, {
          enableTime: true,
          noCalendar: true,
          dateFormat: "H:i",
          time_24hr: true,
          disableMobile: "true",
          allowInput: false,
          onOpen: handleOpen
        });
      }

      // Reposisi otomatis Flatpickr yang sedang terbuka saat modal-body di-scroll
      const modalBody = document.querySelector("#eventModal .modal-body");
      if (modalBody && !modalBody.dataset.fpScrollBound) {
        modalBody.dataset.fpScrollBound = "true";
        modalBody.addEventListener("scroll", () => {
          [this.fpTanggalMulai, this.fpTanggalSelesai, this.fpJamMulai, this.fpJamSelesai].forEach(fp => {
            if (fp && fp.isOpen && typeof fp._positionCalendar === "function") {
              fp._positionCalendar();
            }
          });
        }, { passive: true });
      }
    }
  },

  setDateMulai(val) {
    if (this.fpTanggalMulai) {
      this.fpTanggalMulai.setDate(val, true);
    } else {
      const el = document.getElementById("eventTanggalMulai");
      if (el) el.value = val;
    }
  },

  setDateSelesai(val) {
    if (this.fpTanggalSelesai) {
      this.fpTanggalSelesai.setDate(val, true);
    } else {
      const el = document.getElementById("eventTanggalSelesai");
      if (el) el.value = val;
    }
  },

  setJamMulai(val) {
    const timeVal = val || "08:00";
    if (this.fpJamMulai) {
      this.fpJamMulai.setDate(timeVal, true, "H:i");
    } else {
      const el = document.getElementById("eventJamMulai");
      if (el) el.value = timeVal;
    }
  },

  setJamSelesai(val) {
    const timeVal = val || "10:00";
    if (this.fpJamSelesai) {
      this.fpJamSelesai.setDate(timeVal, true, "H:i");
    } else {
      const el = document.getElementById("eventJamSelesai");
      if (el) el.value = timeVal;
    }
  }
};

// ==========================================================================
// PENGATURAN MODAL FORM (TAMBAH, EDIT, HAPUS)
// ==========================================================================
const Modal = {
  /**
   * Mengunci scrolling pada halaman latar belakang tanpa menghilangkan scrollbar
   */
  lockScroll() {
    document.body.classList.add("modal-open");
  },

  /**
   * Mengembalikan scrolling pada halaman latar belakang jika semua modal tertutup
   */
  unlockScroll() {
    const eventModal = document.getElementById("eventModal");
    const deleteModal = document.getElementById("deleteModal");
    const adminLoginModal = document.getElementById("adminLoginModal");
    const emailSubscribeModal = document.getElementById("emailSubscribeModal");
    const archiveModal = document.getElementById("archiveModal");
    const eventDetailModal = document.getElementById("eventDetailModal");
    const isEventOpen = eventModal && !eventModal.classList.contains("hidden");
    const isDeleteOpen = deleteModal && !deleteModal.classList.contains("hidden");
    const isAdminLoginOpen = adminLoginModal && !adminLoginModal.classList.contains("hidden");
    const isEmailOpen = emailSubscribeModal && !emailSubscribeModal.classList.contains("hidden");
    const isArchiveOpen = archiveModal && !archiveModal.classList.contains("hidden");
    const isDetailOpen = eventDetailModal && !eventDetailModal.classList.contains("hidden");
    if (!isEventOpen && !isDeleteOpen && !isAdminLoginOpen && !isEmailOpen && !isArchiveOpen && !isDetailOpen) {
      document.body.classList.remove("modal-open");
    }
  },

  /**
   * Membuka modal detail kegiatan
   */
  openDetailModal(id, triggerEl = null) {
    if (typeof EventDetailModal !== "undefined") {
      EventDetailModal.open(id, triggerEl);
    }
  },

  /**
   * Menutup modal detail kegiatan
   */
  closeDetailModal() {
    if (typeof EventDetailModal !== "undefined") {
      EventDetailModal.close();
    }
  },

  /**
   * Membuka modal form dalam mode TAMBAH
   */
  openAddModal(defaultDate = null) {
    if (!AuthState.isAdmin) {
      Toast.show("Fitur ini memerlukan hak akses Administrator. Silakan masukkan Password Admin.", "warning");
      AdminLoginModal.open();
      return;
    }

    const modal = document.getElementById("eventModal");
    const form = document.getElementById("eventForm");
    const modalTitle = document.getElementById("modalTitle");
    const formAlert = document.getElementById("formAlert");
    if (!modal || !form) return;

    form.reset();
    document.getElementById("eventId").value = "";
    modalTitle.textContent = "Tambah Kegiatan Baru";
    formAlert.classList.add("hidden");

    // Reset status, lokasi, unit, divisi custom dropdowns
    StatusDropdown.setValue("confirmed");
    LokasiDropdown.reset();
    DivisiDropdown.reset();

    // Default Unit selector based on admin role
    if (AuthState.unit === "Ikhwan" || AuthState.unit === "Akhwat") {
      UnitDropdown.setValue(AuthState.unit);
    } else {
      UnitDropdown.reset();
    }

    PetugasInputManager.reset();

    // Isi otomatis tanggal mulai & selesai dengan tanggal yang sedang dipilih
    const targetDate = defaultDate || AppState.selectedDate || DateHelper.toDateString(new Date());
    FormPickers.setDateMulai(targetDate);
    FormPickers.setDateSelesai(targetDate);

    // Set nilai default jam mulai & selesai
    FormPickers.setJamMulai("08:00");
    FormPickers.setJamSelesai("10:00");

    modal.classList.remove("hidden");
    this.lockScroll();
    document.getElementById("eventJudul").focus();
  },

  /**
   * Membuka modal form dalam mode EDIT
   */
  openEditModal(id) {
    if (!AuthState.isAdmin) {
      Toast.show("Fitur ini memerlukan hak akses Administrator. Silakan masukkan Password Admin.", "warning");
      AdminLoginModal.open();
      return;
    }

    const event = AppState.events.find(e => e.id === id);
    if (!event) {
      Toast.show("Data kegiatan tidak ditemukan", "error");
      return;
    }

    // Periksa otorisasi unit
    if (!canAdminManageUnit(event.unit)) {
      Toast.show(`Akses ditolak: Anda login sebagai admin ${AuthState.unit} dan tidak dapat mengubah kegiatan unit ${event.unit}.`, "warning");
      return;
    }

    const modal = document.getElementById("eventModal");
    const modalTitle = document.getElementById("modalTitle");
    const formAlert = document.getElementById("formAlert");
    if (!modal) return;

    formAlert.classList.add("hidden");
    modalTitle.textContent = "Edit Kegiatan";

    document.getElementById("eventId").value = event.id;
    document.getElementById("eventJudul").value = event.judul || "";
    document.getElementById("eventDeskripsi").value = event.deskripsi || "";

    // Set nilai custom dropdown & input divisi/petugas/lokasi/unit
    StatusDropdown.setValue(event.status || "confirmed");
    LokasiDropdown.setValue(event.lokasi || "");
    UnitDropdown.setValue(event.unit || "Bersama");
    DivisiDropdown.setValue(event.divisi || "");

    PetugasInputManager.setValues(event.petugas || "");

    // Set tanggal & jam via Flatpickr
    FormPickers.setDateMulai(event.tanggal_mulai || "");
    FormPickers.setDateSelesai(event.tanggal_selesai || "");
    FormPickers.setJamMulai(event.jam_mulai || "08:00");
    FormPickers.setJamSelesai(event.jam_selesai || "10:00");

    modal.classList.remove("hidden");
    this.lockScroll();
    document.getElementById("eventJudul").focus();
  },

  /**
   * Menutup modal form tambah/edit
   */
  closeModal() {
    if (FormPickers.fpTanggalMulai) FormPickers.fpTanggalMulai.close();
    if (FormPickers.fpTanggalSelesai) FormPickers.fpTanggalSelesai.close();
    if (FormPickers.fpJamMulai) FormPickers.fpJamMulai.close();
    if (FormPickers.fpJamSelesai) FormPickers.fpJamSelesai.close();

    const modal = document.getElementById("eventModal");
    if (modal) modal.classList.add("hidden");
    StatusDropdown.close();
    LokasiDropdown.close();
    UnitDropdown.close();
    DivisiDropdown.close();
    this.unlockScroll();
  },

  /**
   * Membuka modal konfirmasi hapus
   */
  openDeleteModal(id) {
    if (!AuthState.isAdmin) {
      Toast.show("Fitur ini memerlukan hak akses Administrator. Silakan masukkan Password Admin.", "warning");
      AdminLoginModal.open();
      return;
    }

    const event = AppState.events.find(e => e.id === id);
    if (!event) return;

    if (!canAdminManageUnit(event.unit)) {
      Toast.show(`Akses ditolak: Anda login sebagai admin ${AuthState.unit} dan tidak dapat menghapus kegiatan unit ${event.unit}.`, "warning");
      return;
    }

    AppState.eventToDelete = event;

    const modal = document.getElementById("deleteModal");
    const titleEl = document.getElementById("deleteTargetTitle");
    const dateEl = document.getElementById("deleteTargetDate");

    if (titleEl) titleEl.textContent = event.judul;
    if (dateEl) dateEl.textContent = `${DateHelper.formatIndoFull(event.tanggal_mulai)} (${event.jam_mulai} - ${event.jam_selesai} WITA)`;

    if (modal) modal.classList.remove("hidden");
    this.lockScroll();
  },

  /**
   * Menutup modal konfirmasi hapus
   */
  closeDeleteModal() {
    const modal = document.getElementById("deleteModal");
    if (modal) modal.classList.add("hidden");
    AppState.eventToDelete = null;
    this.unlockScroll();
  }
};

// ==========================================================================
// LOGIKA BISNIS & HANDLER CRUD
// ==========================================================================
async function loadEventsData(isSilent = false) {
  try {
    if (!isSilent) {
      AppState.isLoading = true;
      UI.updateConnectionBadge();
    }

    const data = await ApiClient.getAllEvents();
    AppState.events = Array.isArray(data) ? data : [];

    // Render ulang tampilan dengan tetap mempertahankan AppState (selectedDate, viewYear, viewMonth)
    UI.renderCalendar();
    UI.renderSelectedDateAgenda();
    UI.renderUpcomingEvents();
    ProkerSuggestionsManager.updateDatalist();
    UnitFilterManager.updateCounts();

    if (typeof EventDetailModal !== "undefined" && EventDetailModal.isOpen) {
      EventDetailModal.sync();
    }

    if (isSilent) {
      UI.updateConnectionBadge();
    }
  } catch (error) {
    console.error("Gagal memuat kegiatan:", error);
    if (isSilent) {
      const badge = document.getElementById("connectionBadge");
      if (badge) {
        badge.className = "badge-status status-error";
        badge.innerHTML = `<span class="status-dot"></span><span class="status-text">Offline</span>`;
        badge.title = "Gagal memperbarui data kegiatan otomatis di latar belakang.";
      }
    } else {
      Toast.show(error.message || "Gagal mengambil data kegiatan", "error");
    }
  } finally {
    if (!isSilent) {
      AppState.isLoading = false;
      UI.updateConnectionBadge();
    }
  }
}

/**
 * Validasi form tambah / edit
 */
function validateEventForm(formData) {
  if (!formData.judul || formData.judul.trim() === "") {
    return "Nama program kerja / kegiatan wajib diisi.";
  }

  if (!formData.lokasi || formData.lokasi.trim() === "") {
    return "Lokasi kegiatan wajib dipilih / diisi.";
  }

  if (!formData.unit || formData.unit.trim() === "") {
    return "Unit Satuan wajib dipilih (Ikhwan / Akhwat / Bersama).";
  }

  // Validasi otorisasi unit
  if (!canAdminManageUnit(formData.unit)) {
    return `Akses ditolak: Anda login sebagai admin ${AuthState.unit} dan tidak dapat membuat/mengubah kegiatan unit ${formData.unit}.`;
  }

  if (!formData.divisi || formData.divisi.trim() === "") {
    return "Divisi Penanggung Jawab wajib dipilih / diisi.";
  }

  if (!formData.tanggal_mulai) {
    return "Tanggal mulai wajib diisi.";
  }

  if (!formData.tanggal_selesai) {
    return "Tanggal selesai wajib diisi.";
  }

  // Validasi: tanggal selesai tidak boleh sebelum tanggal mulai
  if (formData.tanggal_selesai < formData.tanggal_mulai) {
    return "Tanggal selesai tidak boleh lebih awal dari tanggal mulai.";
  }

  if (!formData.jam_mulai || !formData.jam_selesai) {
    return "Jam mulai dan jam selesai wajib diisi.";
  }

  // Jika hari yang sama, jam selesai harus setelah jam mulai
  if (formData.tanggal_mulai === formData.tanggal_selesai) {
    if (formData.jam_selesai <= formData.jam_mulai) {
      return "Pada tanggal yang sama, jam selesai harus lebih besar dari jam mulai.";
    }
  }

  return null; // Validasi sukses
}

/**
 * Handle submit form tambah / edit
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("eventId").value;
  const statusEl = document.getElementById("eventStatus");
  const namaProkerKegiatan = document.getElementById("eventJudul").value.trim();

  const selectedLokasi = (typeof LokasiDropdown !== "undefined" && typeof LokasiDropdown.getValue === "function")
    ? LokasiDropdown.getValue()
    : (document.getElementById("eventLokasi") ? document.getElementById("eventLokasi").value.trim() : "");

  const selectedUnit = (typeof UnitDropdown !== "undefined" && typeof UnitDropdown.getValue === "function")
    ? UnitDropdown.getValue()
    : (document.getElementById("eventUnit") ? document.getElementById("eventUnit").value.trim() : "Bersama");

  const selectedDivisi = (typeof DivisiDropdown !== "undefined" && typeof DivisiDropdown.getValue === "function")
    ? DivisiDropdown.getValue()
    : (document.getElementById("eventDivisi") ? document.getElementById("eventDivisi").value.trim() : "");

  const petugasValue = (typeof PetugasInputManager !== "undefined" && typeof PetugasInputManager.getValue === "function")
    ? PetugasInputManager.getValue()
    : (document.getElementById("eventPetugas") ? document.getElementById("eventPetugas").value.trim() : "");

  const formData = {
    id: id || undefined,
    judul: namaProkerKegiatan,
    deskripsi: document.getElementById("eventDeskripsi").value.trim(),
    lokasi: selectedLokasi,
    unit: selectedUnit,
    divisi: selectedDivisi,
    proker: namaProkerKegiatan,
    petugas: petugasValue,
    status: statusEl ? statusEl.value : "confirmed",
    tanggal_mulai: document.getElementById("eventTanggalMulai").value,
    tanggal_selesai: document.getElementById("eventTanggalSelesai").value,
    jam_mulai: document.getElementById("eventJamMulai").value,
    jam_selesai: document.getElementById("eventJamSelesai").value
  };

  const formAlert = document.getElementById("formAlert");
  const formAlertText = document.getElementById("formAlertText");
  const saveBtn = document.getElementById("saveEventBtn");
  const btnSpinner = saveBtn.querySelector(".btn-spinner");
  const btnText = saveBtn.querySelector(".btn-text");

  // Jalankan validasi
  const validationError = validateEventForm(formData);
  if (validationError) {
    formAlertText.textContent = validationError;
    formAlert.classList.remove("hidden");
    formAlert.scrollIntoView({ behavior: "smooth", block: "nearest" });
    return;
  }

  formAlert.classList.add("hidden");

  try {
    // Tampilkan status loading pada tombol
    saveBtn.disabled = true;
    btnSpinner.classList.remove("hidden");
    btnText.textContent = "Menyimpan...";

    const action = id ? "update" : "create";
    const result = await ApiClient.postAction(action, formData);

    Toast.show(result.message || (id ? "Kegiatan berhasil diperbarui!" : "Kegiatan berhasil ditambahkan!"), "success");
    Modal.closeModal();

    // Perbarui tanggal tampilan agar mencakup tanggal kegiatan baru
    AppState.selectedDate = formData.tanggal_mulai;
    const d = DateHelper.parseLocalDate(formData.tanggal_mulai);
    AppState.viewYear = d.getFullYear();
    AppState.viewMonth = d.getMonth();

    // Muat ulang data terbaru
    await loadEventsData();

  } catch (error) {
    console.error("Gagal menyimpan kegiatan:", error);
    formAlertText.textContent = error.message || "Terjadi kesalahan saat menyimpan kegiatan.";
    formAlert.classList.remove("hidden");
    formAlert.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } finally {
    saveBtn.disabled = false;
    btnSpinner.classList.add("hidden");
    btnText.textContent = "Simpan Kegiatan";
  }
}

/**
 * Handle konfirmasi hapus kegiatan
 */
async function handleConfirmDelete() {
  if (!AppState.eventToDelete) return;

  const confirmBtn = document.getElementById("confirmDeleteBtn");
  const btnSpinner = confirmBtn.querySelector(".btn-spinner");
  const btnText = confirmBtn.querySelector(".btn-text");

  try {
    confirmBtn.disabled = true;
    btnSpinner.classList.remove("hidden");
    btnText.textContent = "Menghapus...";

    const result = await ApiClient.postAction("delete", { id: AppState.eventToDelete.id });

    Toast.show(result.message || "Kegiatan berhasil dihapus", "success");
    Modal.closeDeleteModal();

    await loadEventsData();
  } catch (error) {
    console.error("Gagal menghapus kegiatan:", error);
    Toast.show(error.message || "Gagal menghapus kegiatan", "error");
  } finally {
    confirmBtn.disabled = false;
    btnSpinner.classList.add("hidden");
    btnText.textContent = "Ya, Hapus";
  }
}
// ==========================================================================
// CONTROLLER OTENTIKASI & SESI ADMIN
// ==========================================================================
const Auth = {
  /**
   * Inisialisasi status sesi saat halaman dimuat.
   * Mode Tamu (Guest Mode) adalah default saat pertama kali dibuka.
   */
  async init() {
    AuthState.isAdmin = false;
    AuthState.unit = null;
    AuthState.token = null;
    AuthState.expiresAt = null;

    // Periksa apakah terdapat token tersimpan di sessionStorage
    const savedSession = sessionStorage.getItem(AuthState.SESSION_KEY);
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession);
        const now = Date.now();

        // 1. Validasi waktu kedaluwarsa lokal
        if (sessionData && sessionData.token && sessionData.expiresAt && now < sessionData.expiresAt) {
          // 2. Verifikasi token ke Google Apps Script backend sebelum mempercayai sesi
          const verified = await ApiClient.verifySession(sessionData.token);
          if (verified) {
            const resolvedUnit = (typeof verified === "object" && verified.unit) ? verified.unit : (sessionData.unit || "Ikhwan");
            this.setAdmin(sessionData.token, sessionData.expiresAt, resolvedUnit, false);
            return;
          }
        }
      } catch (err) {
        console.warn("Gagal membaca sesi admin:", err);
      }
      // Bersihkan jika sesi tidak valid atau kedaluwarsa
      sessionStorage.removeItem(AuthState.SESSION_KEY);
    }

    UI.updateAuthUI();
  },

  /**
   * Mengatur status ke Mode Admin
   */
  setAdmin(token, expiresAt, unit = "Ikhwan", isNewLogin = false) {
    AuthState.isAdmin = true;
    AuthState.unit = unit || "Ikhwan";
    AuthState.token = token;
    AuthState.expiresAt = expiresAt;

    // Simpan ke sessionStorage (HANYA token sementara, BUKAN PIN)
    try {
      sessionStorage.setItem(AuthState.SESSION_KEY, JSON.stringify({
        token: token,
        expiresAt: expiresAt,
        unit: AuthState.unit
      }));
    } catch (e) {
      console.warn("Gagal menyimpan sesi ke sessionStorage:", e);
    }

    UI.updateAuthUI();
    UI.renderSelectedDateAgenda(); // Render ulang kartu untuk memunculkan tombol Edit & Hapus sesuai otorisasi unit
    if (typeof EventDetailModal !== "undefined" && EventDetailModal.isOpen) {
      EventDetailModal.sync();
    }
  },

  /**
   * Logout dari Mode Admin dan kembali ke Mode Tamu
   */
  async logout(showToast = true) {
    const currentToken = AuthState.token;

    // Kembalikan state lokal ke Mode Tamu
    AuthState.isAdmin = false;
    AuthState.unit = null;
    AuthState.token = null;
    AuthState.expiresAt = null;

    // Hapus sesi dari sessionStorage
    try {
      sessionStorage.removeItem(AuthState.SESSION_KEY);
    } catch (e) { }

    // Revoke token di backend
    if (currentToken) {
      ApiClient.logout(currentToken);
    }

    UI.updateAuthUI();
    UI.renderSelectedDateAgenda(); // Sembunyikan tombol Edit & Hapus

    if (typeof EventDetailModal !== "undefined" && EventDetailModal.isOpen) {
      EventDetailModal.sync();
    }

    if (showToast) {
      Toast.show("Anda telah keluar dari Mode Admin. Mode Tamu aktif.", "info");
    }

    if (typeof ArchiveModal !== "undefined") {
      ArchiveModal.cachedItems = null;
    }
  },

  /**
   * Dipanggil saat token sesi kedaluwarsa saat permintaan API
   */
  handleSessionExpired() {
    this.logout(false);
    Modal.closeModal();
    Modal.closeDeleteModal();
    if (typeof EventDetailModal !== "undefined") {
      EventDetailModal.close();
    }
    Toast.show("Sesi admin telah kedaluwarsa. Silakan login kembali dengan Password Admin.", "error");
  }
};

// ==========================================================================
// CONTROLLER MODAL DETAIL KEGIATAN (READ-ONLY EVENT DETAIL)
// ==========================================================================
const EventDetailModal = {
  currentEventId: null,
  lastFocusedElement: null,

  get isOpen() {
    const modal = document.getElementById("eventDetailModal");
    return !!(modal && !modal.classList.contains("hidden"));
  },

  init() {
    const modalEl = document.getElementById("eventDetailModal");
    const closeBtn = document.getElementById("closeDetailModalBtn");
    const closeBottomBtn = document.getElementById("closeDetailBottomBtn");
    const editBtn = document.getElementById("detailEditBtn");
    const deleteBtn = document.getElementById("detailDeleteBtn");

    if (closeBtn) closeBtn.addEventListener("click", () => this.close());
    if (closeBottomBtn) closeBottomBtn.addEventListener("click", () => this.close());

    if (editBtn) {
      editBtn.addEventListener("click", () => {
        const id = this.currentEventId;
        this.close();
        if (id) Modal.openEditModal(id);
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => {
        const id = this.currentEventId;
        this.close();
        if (id) Modal.openDeleteModal(id);
      });
    }

    if (modalEl) {
      let isBackdropDown = false;
      modalEl.addEventListener("mousedown", (e) => {
        isBackdropDown = (e.target === modalEl);
      });
      modalEl.addEventListener("click", (e) => {
        if (isBackdropDown && e.target === modalEl) {
          this.close();
        }
        isBackdropDown = false;
      });
    }
  },

  open(id, triggerEl = null) {
    const event = AppState.events.find(e => e.id === id);
    if (!event) {
      Toast.show("Data kegiatan tidak ditemukan.", "error");
      return;
    }

    this.currentEventId = id;
    this.lastFocusedElement = triggerEl || document.activeElement;

    this.render(event);

    const modal = document.getElementById("eventDetailModal");
    if (modal) {
      modal.classList.remove("hidden");
      Modal.lockScroll();
      const closeBottomBtn = document.getElementById("closeDetailBottomBtn");
      if (closeBottomBtn) closeBottomBtn.focus();
    }
  },

  render(event) {
    const titleEl = document.getElementById("detailModalTitle");
    const statusBadgeEl = document.getElementById("detailStatusBadge");
    const divisiBadgeEl = document.getElementById("detailDivisiBadge");
    const unitBadgeEl = document.getElementById("detailUnitBadge");
    const descEl = document.getElementById("detailDescription");
    const tanggalEl = document.getElementById("detailTanggal");
    const waktuEl = document.getElementById("detailWaktu");
    const lokasiEl = document.getElementById("detailLokasi");
    const unitEl = document.getElementById("detailUnit");
    const unitIconEl = document.getElementById("detailUnitIcon");
    const divisiEl = document.getElementById("detailDivisi");
    const divisiIconEl = document.getElementById("detailDivisiIcon");

    const petugasItemEl = document.getElementById("detailPetugasItem");
    const petugasEl = document.getElementById("detailPetugas");
    const adminActionsEl = document.getElementById("detailAdminActions");
    const dialogEl = document.getElementById("eventDetailDialog");

    // Title
    if (titleEl) titleEl.textContent = event.judul || "-";

    // Status Badge
    const isTentative = (event.status || "confirmed").toLowerCase() === "tentative";
    if (statusBadgeEl) {
      statusBadgeEl.innerHTML = isTentative
        ? `<span class="status-badge status-badge-tentative">Rencana</span>`
        : `<span class="status-badge status-badge-confirmed">Terkonfirmasi</span>`;
    }

    // Unit Badge
    const unitInfo = getUnitInfo(event.unit);
    if (unitBadgeEl) {
      unitBadgeEl.innerHTML = `<span class="unit-badge unit-badge-${unitInfo.key}"><i class="${unitInfo.icon}"></i> <span>${escapeHtml(unitInfo.name)}</span></span>`;
    }

    // Divisi Info & Accent
    const divInfo = getDivisiInfo(event.divisi);
    if (divisiBadgeEl) {
      if (divInfo) {
        divisiBadgeEl.innerHTML = `<span class="divisi-badge divisi-${divInfo.key}"><i class="${divInfo.icon}"></i> <span>${escapeHtml(divInfo.name)}</span></span>`;
      } else {
        divisiBadgeEl.innerHTML = "";
      }
    }

    if (dialogEl) {
      // Remove previous border-divisi-* classes
      dialogEl.className = dialogEl.className.replace(/\bborder-divisi-\S+/g, "").trim();
      dialogEl.classList.remove("multi-divisi-modal");
      dialogEl.style.removeProperty("--multi-divisi-gradient-h");
      if (divInfo) {
        dialogEl.classList.add(`border-divisi-${divInfo.key}`);
      }
    }

    // Deskripsi
    if (descEl) {
      if (event.deskripsi && event.deskripsi.trim()) {
        descEl.textContent = event.deskripsi;
        descEl.classList.remove("detail-empty-text");
      } else {
        descEl.textContent = "Tidak ada deskripsi";
        descEl.classList.add("detail-empty-text");
      }
    }

    // Unit Satuan Row
    if (unitEl) {
      unitEl.textContent = event.unit || "Bersama";
    }
    if (unitIconEl && unitInfo) {
      unitIconEl.className = unitInfo.icon || "fa-solid fa-people-group";
    }

    // Tanggal
    if (tanggalEl) {
      let rangeText = DateHelper.formatDateRange(event.tanggal_mulai, event.tanggal_selesai);
      if (event.tanggal_mulai && event.tanggal_selesai && event.tanggal_mulai !== event.tanggal_selesai) {
        const d1 = DateHelper.parseLocalDate(event.tanggal_mulai);
        const d2 = DateHelper.parseLocalDate(event.tanggal_selesai);
        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
        if (diffDays > 1) {
          rangeText += ` (${diffDays} hari)`;
        }
      }
      tanggalEl.textContent = rangeText;
    }

    // Waktu
    if (waktuEl) {
      const start = event.jam_mulai ? event.jam_mulai : "-";
      const end = event.jam_selesai ? event.jam_selesai : "-";
      waktuEl.textContent = `${start} - ${end} WITA`;
    }

    // Lokasi
    if (lokasiEl) {
      lokasiEl.textContent = event.lokasi || "Lokasi belum ditentukan";
    }

    // Divisi Row
    if (divisiEl) {
      divisiEl.textContent = event.divisi || "-";
    }
    if (divisiIconEl) {
      divisiIconEl.className = divInfo ? (divInfo.icon || "fa-solid fa-layer-group") : "fa-solid fa-layer-group";
    }

    // Petugas Row
    if (petugasItemEl && petugasEl) {
      if (event.petugas && event.petugas.trim()) {
        petugasEl.textContent = event.petugas;
        petugasItemEl.classList.remove("hidden");
      } else {
        petugasItemEl.classList.add("hidden");
      }
    }

    // Admin Action Buttons (hanya jika admin berhak mengelola unit ini)
    if (adminActionsEl) {
      if (AuthState.isAdmin && canAdminManageUnit(event.unit)) {
        adminActionsEl.classList.remove("hidden");
      } else {
        adminActionsEl.classList.add("hidden");
      }
    }
  },

  close() {
    const modal = document.getElementById("eventDetailModal");
    if (modal) modal.classList.add("hidden");
    this.currentEventId = null;
    Modal.unlockScroll();

    if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === "function" && document.contains(this.lastFocusedElement)) {
      this.lastFocusedElement.focus();
    }
    this.lastFocusedElement = null;
  },

  sync() {
    if (!this.isOpen || !this.currentEventId) return;
    const event = AppState.events.find(e => e.id === this.currentEventId);
    if (event) {
      this.render(event);
    } else {
      this.close();
    }
  }
};

// ==========================================================================
// CONTROLLER MODAL LOGIN PIN ADMIN
// ==========================================================================
const AdminLoginModal = {
  open() {
    const modal = document.getElementById("adminLoginModal");
    const form = document.getElementById("adminLoginForm");
    const pinInput = document.getElementById("adminPinInput");
    const alertEl = document.getElementById("adminLoginAlert");
    if (!modal || !form || !pinInput) return;

    form.reset();
    pinInput.type = "password";
    this.updateEyeIcon(false);

    if (alertEl) alertEl.classList.add("hidden");

    modal.classList.remove("hidden");
    Modal.lockScroll();

    setTimeout(() => {
      pinInput.focus();
    }, 100);
  },

  close() {
    const modal = document.getElementById("adminLoginModal");
    if (modal) modal.classList.add("hidden");
    Modal.unlockScroll();
  },

  togglePinVisibility() {
    const pinInput = document.getElementById("adminPinInput");
    if (!pinInput) return;
    const isPassword = pinInput.type === "password";
    pinInput.type = isPassword ? "text" : "password";
    this.updateEyeIcon(!isPassword);
  },

  updateEyeIcon(isPassword) {
    const btn = document.getElementById("togglePinVisibilityBtn");
    if (!btn) return;
    const eyeIcon = btn.querySelector(".pin-icon-eye");
    const eyeOffIcon = btn.querySelector(".pin-icon-eye-off");

    if (isPassword) {
      if (eyeIcon) eyeIcon.classList.add("hidden");
      if (eyeOffIcon) eyeOffIcon.classList.remove("hidden");
      btn.title = "Sembunyikan Password";
      btn.setAttribute("aria-label", "Sembunyikan Password");
    } else {
      if (eyeIcon) eyeIcon.classList.remove("hidden");
      if (eyeOffIcon) eyeOffIcon.classList.add("hidden");
      btn.title = "Lihat Password";
      btn.setAttribute("aria-label", "Lihat Password");
    }
  }
};

/**
 * Handle submit formulir Password Admin
 */
async function handleAdminLoginSubmit(e) {
  e.preventDefault();

  const pinInput = document.getElementById("adminPinInput");
  const alertEl = document.getElementById("adminLoginAlert");
  const alertText = document.getElementById("adminLoginAlertText");
  const submitBtn = document.getElementById("submitAdminLoginBtn");
  const btnSpinner = submitBtn.querySelector(".btn-spinner");
  const btnText = submitBtn.querySelector(".btn-text");

  const pin = pinInput.value.trim();

  // Validasi Password lokal
  if (!pin) {
    alertText.textContent = "Password Admin tidak boleh kosong.";
    alertEl.classList.remove("hidden");
    pinInput.focus();
    return;
  }

  alertEl.classList.add("hidden");

  try {
    submitBtn.disabled = true;
    pinInput.disabled = true;
    btnSpinner.classList.remove("hidden");
    btnText.textContent = "Memverifikasi...";

    const result = await ApiClient.login(pin);

    Toast.show(result.message || `Login Admin ${result.unit || ''} berhasil!`, "success");
    Auth.setAdmin(result.token, result.expiresAt, result.unit, true);
    AdminLoginModal.close();

  } catch (error) {
    console.error("Gagal login admin:", error);
    alertText.textContent = error.message || "Password Admin salah. Silakan coba lagi.";
    alertEl.classList.remove("hidden");
    pinInput.select();
  } finally {
    submitBtn.disabled = false;
    pinInput.disabled = false;
    btnSpinner.classList.add("hidden");
    btnText.textContent = "Masuk";
  }
}

// ==========================================================================
// INISIALISASI EVENT LISTENERS
// ==========================================================================
function initializeEvents() {
  // Navigasi Bulan Kalender
  document.getElementById("prevMonthBtn").addEventListener("click", () => {
    AppState.viewMonth--;
    if (AppState.viewMonth < 0) {
      AppState.viewMonth = 11;
      AppState.viewYear--;
    }
    UI.renderCalendar();
  });

  document.getElementById("nextMonthBtn").addEventListener("click", () => {
    AppState.viewMonth++;
    if (AppState.viewMonth > 11) {
      AppState.viewMonth = 0;
      AppState.viewYear++;
    }
    UI.renderCalendar();
  });

  // Tombol pintas "Hari Ini"
  document.getElementById("todayBtn").addEventListener("click", () => {
    const now = new Date();
    AppState.viewYear = now.getFullYear();
    AppState.viewMonth = now.getMonth();
    AppState.selectedDate = DateHelper.toDateString(now);
    UI.renderCalendar();
    UI.renderSelectedDateAgenda();
  });

  // Tombol Segarkan Data
  document.getElementById("refreshBtn").addEventListener("click", async () => {
    const refreshBtn = document.getElementById("refreshBtn");
    refreshBtn.classList.add("btn-spinning");
    await loadEventsData();
    refreshBtn.classList.remove("btn-spinning");
    Toast.show("Data kegiatan berhasil disinkronkan", "info");
  });

  // Buka Modal Tambah Kegiatan (Dari Header, Agenda, Empty State, & FAB Mobile)
  document.getElementById("openAddModalBtn").addEventListener("click", () => Modal.openAddModal());
  document.getElementById("quickAddBtn").addEventListener("click", () => Modal.openAddModal());
  document.getElementById("emptyStateAddBtn").addEventListener("click", () => Modal.openAddModal());
  document.getElementById("mobileFabBtn").addEventListener("click", () => Modal.openAddModal());

  // Tutup Modal Form Tambah/Edit
  document.getElementById("closeModalBtn").addEventListener("click", () => Modal.closeModal());
  document.getElementById("cancelModalBtn").addEventListener("click", () => Modal.closeModal());

  // Tutup Modal Hapus
  document.getElementById("cancelDeleteBtn").addEventListener("click", () => Modal.closeDeleteModal());
  document.getElementById("confirmDeleteBtn").addEventListener("click", handleConfirmDelete);

  // Tutup Modal Form & Modal Hapus via Klik Backdrop
  let isEventBackdropDown = false;
  const eventModalEl = document.getElementById("eventModal");
  eventModalEl.addEventListener("mousedown", (e) => {
    isEventBackdropDown = (e.target === eventModalEl);
  });
  eventModalEl.addEventListener("click", (e) => {
    if (isEventBackdropDown && e.target === eventModalEl) {
      // Jangan tutup modal jika ada popup kalender Flatpickr yang sedang terbuka
      const activeFp = document.querySelector(".flatpickr-calendar.open");
      if (activeFp) {
        return;
      }
      Modal.closeModal();
    }
    isEventBackdropDown = false;
  });

  let isDeleteBackdropDown = false;
  const deleteModalEl = document.getElementById("deleteModal");
  deleteModalEl.addEventListener("mousedown", (e) => {
    isDeleteBackdropDown = (e.target === deleteModalEl);
  });
  deleteModalEl.addEventListener("click", (e) => {
    if (isDeleteBackdropDown && e.target === deleteModalEl) {
      Modal.closeDeleteModal();
    }
    isDeleteBackdropDown = false;
  });

  // Modal Login PIN Admin: Buka, Tutup, Toggle PIN, Submit, dan Klik Backdrop
  const adminLoginBtn = document.getElementById("adminLoginBtn");
  if (adminLoginBtn) {
    adminLoginBtn.addEventListener("click", () => AdminLoginModal.open());
  }

  const closeAdminLoginBtn = document.getElementById("closeAdminLoginBtn");
  if (closeAdminLoginBtn) {
    closeAdminLoginBtn.addEventListener("click", () => AdminLoginModal.close());
  }

  const cancelAdminLoginBtn = document.getElementById("cancelAdminLoginBtn");
  if (cancelAdminLoginBtn) {
    cancelAdminLoginBtn.addEventListener("click", () => AdminLoginModal.close());
  }

  const togglePinBtn = document.getElementById("togglePinVisibilityBtn");
  if (togglePinBtn) {
    togglePinBtn.addEventListener("click", () => AdminLoginModal.togglePinVisibility());
  }

  const adminLoginForm = document.getElementById("adminLoginForm");
  if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", handleAdminLoginSubmit);
  }

  const adminLogoutBtn = document.getElementById("adminLogoutBtn");
  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener("click", () => Auth.logout());
  }

  let isAdminLoginBackdropDown = false;
  const adminLoginModalEl = document.getElementById("adminLoginModal");
  if (adminLoginModalEl) {
    adminLoginModalEl.addEventListener("mousedown", (e) => {
      isAdminLoginBackdropDown = (e.target === adminLoginModalEl);
    });
    adminLoginModalEl.addEventListener("click", (e) => {
      if (isAdminLoginBackdropDown && e.target === adminLoginModalEl) {
        AdminLoginModal.close();
      }
      isAdminLoginBackdropDown = false;
    });
  }

  // Keyboard Escape untuk menutup modal / dropdown
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const activeFp = document.querySelector(".flatpickr-calendar.open");
      if (activeFp) {
        return;
      }
      if (NavbarManager.isOpen) {
        NavbarManager.close();
        return;
      }
      if (StatusDropdown.isOpen) {
        StatusDropdown.close();
        return;
      }
      if (typeof DivisiDropdown !== "undefined" && DivisiDropdown.isOpen) {
        DivisiDropdown.close();
        return;
      }
      if (typeof LokasiDropdown !== "undefined" && LokasiDropdown.isOpen) {
        LokasiDropdown.close();
        return;
      }
      if (typeof UnitDropdown !== "undefined" && UnitDropdown.isOpen) {
        UnitDropdown.close();
        return;
      }
      if (typeof EmailSubscribeModal !== "undefined") {
        EmailSubscribeModal.close();
      }
      if (typeof ArchiveModal !== "undefined") {
        ArchiveModal.close();
      }
      if (typeof EventDetailModal !== "undefined") {
        EventDetailModal.close();
      }
      AdminLoginModal.close();
      Modal.closeModal();
      Modal.closeDeleteModal();
    }
  });

  // Submit Form Tambah/Edit
  document.getElementById("eventForm").addEventListener("submit", handleFormSubmit);

  // Sinkronisasi otomatis tanggal selesai saat tanggal mulai diubah (jika tanggal selesai masih kosong/kurang)
  document.getElementById("eventTanggalMulai").addEventListener("change", (e) => {
    const startDateVal = e.target.value;
    const endDateInput = document.getElementById("eventTanggalSelesai");
    if (!endDateInput.value || endDateInput.value < startDateVal) {
      FormPickers.setDateSelesai(startDateVal);
    }
    if (FormPickers.fpTanggalSelesai) {
      FormPickers.fpTanggalSelesai.set("minDate", startDateVal);
    }
  });

  // Toggle Kegiatan Mendatang ("Lihat Lainnya")
  const toggleUpcomingBtn = document.getElementById("toggleUpcomingBtn");
  if (toggleUpcomingBtn) {
    toggleUpcomingBtn.addEventListener("click", () => {
      AppState.showAllUpcoming = !AppState.showAllUpcoming;
      UI.renderUpcomingEvents();
    });
  }
}

// ==========================================================================
// CONTROLLER NOTIFIKASI PERAMBAN (BROWSER NOTIFICATION)
// ==========================================================================
const NotificationManager = {
  STORAGE_KEY: "notification-preference",
  notifiedIds: new Set(),

  init() {
    const btn = document.getElementById("browserNotificationBtn");
    if (btn) {
      btn.addEventListener("click", () => this.toggle());
    }

    // Restore preference only if saved is "enabled" AND permission is already "granted"
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved === "enabled" && typeof Notification !== "undefined" && Notification.permission === "granted") {
        this.updateUI(true);
      } else {
        this.updateUI(false);
      }
    } catch (e) {
      this.updateUI(false);
    }
  },

  updateUI(isEnabled) {
    const btn = document.getElementById("browserNotificationBtn");
    const dot = document.getElementById("notificationDot");
    if (!btn) return;

    btn.classList.toggle("active", isEnabled);
    btn.setAttribute("aria-pressed", isEnabled ? "true" : "false");
    const label = isEnabled ? "Matikan Notifikasi Pengingat Kegiatan" : "Aktifkan Notifikasi Pengingat Kegiatan";
    btn.setAttribute("aria-label", label);
    btn.setAttribute("title", label);

    if (dot) {
      dot.classList.toggle("hidden", !isEnabled);
    }
  },

  async toggle() {
    if (!("Notification" in window)) {
      Toast.show("Peramban Anda tidak mendukung Web Notification API.", "info");
      return;
    }

    try {
      if (Notification.permission === "granted") {
        const isCurrentlyEnabled = localStorage.getItem(this.STORAGE_KEY) === "enabled";
        if (isCurrentlyEnabled) {
          localStorage.setItem(this.STORAGE_KEY, "disabled");
          this.updateUI(false);
          Toast.show("Notifikasi peramban dinonaktifkan.", "info");
        } else {
          localStorage.setItem(this.STORAGE_KEY, "enabled");
          this.updateUI(true);
          Toast.show("Notifikasi peramban diaktifkan!", "success");
          this.checkUpcoming();
        }
      } else if (Notification.permission === "default") {
        const perm = await Notification.requestPermission();
        if (perm === "granted") {
          localStorage.setItem(this.STORAGE_KEY, "enabled");
          this.updateUI(true);
          Toast.show("Notifikasi peramban berhasil diaktifkan!", "success");
          this.checkUpcoming();
        } else {
          localStorage.setItem(this.STORAGE_KEY, "disabled");
          this.updateUI(false);
          Toast.show("Izin notifikasi tidak diberikan.", "info");
        }
      } else if (Notification.permission === "denied") {
        Toast.show("Izin notifikasi diblokir di pengaturan peramban Anda. Silakan izinkan melalui setelan situs di peramban.", "warning");
      }
    } catch (e) {
      console.warn("Gagal meminta izin notifikasi:", e);
    }
  },

  checkUpcoming() {
    try {
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      if (localStorage.getItem(this.STORAGE_KEY) !== "enabled") return;

      if (!Array.isArray(AppState.events) || AppState.events.length === 0) return;

      AppState.events.forEach(event => {
        if (!event || !event.id || !event.jam_mulai || !event.tanggal_mulai) return;
        if (this.notifiedIds.has(event.id)) return;

        const countdown = DateHelper.getEventCountdown(event);
        if (countdown && typeof countdown.minutesUntilStart === "number" && countdown.minutesUntilStart > 0 && countdown.minutesUntilStart <= 15) {
          this.notifiedIds.add(event.id);
          const lokasiText = event.lokasi ? ` di ${event.lokasi}` : "";
          new Notification("Kegiatan akan dimulai", {
            body: `${event.judul} dimulai jam ${event.jam_mulai} WITA${lokasiText}`,
            icon: "favicon.svg"
          });
        }
      });
    } catch (e) {
      console.warn("Peringatan saat mengirim notifikasi peramban:", e);
    }
  }
};

// ==========================================================================
// ==========================================================================
// CONTROLLER MODAL LANGGANAN NOTIFIKASI EMAIL
// ==========================================================================
const EmailSubscribeModal = {
  mode: "subscribe", // "subscribe" | "subscribed" | "unsubscribe" | "check_status"
  currentEmail: "",

  init() {
    const openBtn = document.getElementById("emailSubscribeModalBtn");
    const closeBtn = document.getElementById("closeEmailModalBtn");
    const cancelBtn = document.getElementById("cancelEmailModalBtn");
    const toggleCheckBtn = document.getElementById("toggleCheckStatusModeBtn");
    const toggleUnsubBtn = document.getElementById("toggleUnsubscribeModeBtn");
    const switchOtherBtn = document.getElementById("switchOtherEmailBtn");
    const switchCheckOtherBtn = document.getElementById("switchCheckOtherStatusBtn");
    const form = document.getElementById("emailSubscribeForm");
    const modalEl = document.getElementById("emailSubscribeModal");

    if (openBtn) openBtn.addEventListener("click", () => this.open());
    if (closeBtn) closeBtn.addEventListener("click", () => this.close());
    if (cancelBtn) cancelBtn.addEventListener("click", () => this.close());

    if (toggleCheckBtn) {
      toggleCheckBtn.addEventListener("click", () => {
        if (this.mode === "check_status") {
          this.setMode("subscribe");
        } else {
          this.setMode("check_status");
        }
      });
    }

    if (toggleUnsubBtn) {
      toggleUnsubBtn.addEventListener("click", () => {
        if (this.mode === "unsubscribe") {
          this.setMode("subscribe");
        } else {
          this.setMode("unsubscribe");
        }
      });
    }

    if (switchOtherBtn) {
      switchOtherBtn.addEventListener("click", () => {
        this.setMode("subscribe", "");
      });
    }

    if (switchCheckOtherBtn) {
      switchCheckOtherBtn.addEventListener("click", () => {
        this.setMode("check_status", "");
      });
    }

    if (form) form.addEventListener("submit", (e) => this.handleSubmit(e));

    if (modalEl) {
      let isBackdropDown = false;
      modalEl.addEventListener("mousedown", (e) => {
        isBackdropDown = (e.target === modalEl);
      });
      modalEl.addEventListener("click", (e) => {
        if (isBackdropDown && e.target === modalEl) {
          this.close();
        }
        isBackdropDown = false;
      });
    }
  },

  open() {
    const modal = document.getElementById("emailSubscribeModal");
    if (!modal) return;

    const storedEmail = localStorage.getItem("subscribed_email");
    if (storedEmail && String(storedEmail).trim()) {
      this.setMode("subscribed", String(storedEmail).trim());
    } else {
      this.setMode("subscribe", "");
    }

    modal.classList.remove("hidden");
    Modal.lockScroll();

    setTimeout(() => {
      const input = document.getElementById("subscriberEmailInput");
      if (input && this.mode !== "subscribed") {
        input.focus();
      }
    }, 100);
  },

  close() {
    const modal = document.getElementById("emailSubscribeModal");
    if (modal) modal.classList.add("hidden");
    Modal.unlockScroll();
  },

  setMode(mode, prefillEmail = "") {
    this.mode = mode;
    const titleEl = document.getElementById("emailModalTitle");
    const descEl = document.getElementById("emailModalDesc");
    const labelEl = document.getElementById("subscriberEmailLabel");
    const input = document.getElementById("subscriberEmailInput");
    const submitBtn = document.getElementById("submitEmailSubscribeBtn");
    const cancelBtn = document.getElementById("cancelEmailModalBtn");
    const toggleCheckBtn = document.getElementById("toggleCheckStatusModeBtn");
    const toggleUnsubBtn = document.getElementById("toggleUnsubscribeModeBtn");
    const alertEl = document.getElementById("emailFormAlert");
    const formSection = document.getElementById("emailFormSection");
    const subscribedSection = document.getElementById("emailSubscribedSection");
    const subscribedEmailDisplay = document.getElementById("subscribedEmailDisplay");

    if (alertEl) {
      alertEl.className = "alert alert-danger hidden";
    }

    if (mode === "subscribed") {
      // TAMPILAN: SUDAH BERLANGGANAN (AKTIF)
      const storedEmail = prefillEmail || localStorage.getItem("subscribed_email") || "";
      this.currentEmail = storedEmail;

      if (formSection) formSection.classList.add("hidden");
      if (subscribedSection) subscribedSection.classList.remove("hidden");
      if (subscribedEmailDisplay) subscribedEmailDisplay.textContent = storedEmail || "-";

      if (titleEl) titleEl.textContent = "Status Langganan Email";
      if (cancelBtn) cancelBtn.textContent = "Tutup";

      if (submitBtn) {
        submitBtn.className = "btn btn-danger";
        const text = submitBtn.querySelector(".btn-text");
        if (text) text.textContent = "Berhenti Berlangganan";
      }
    } else {
      // TAMPILAN: FORM INPUT
      if (formSection) formSection.classList.remove("hidden");
      if (subscribedSection) subscribedSection.classList.add("hidden");
      if (cancelBtn) cancelBtn.textContent = "Batal";

      if (input) {
        input.value = prefillEmail || (mode === "subscribe" ? "" : input.value);
      }

      if (mode === "unsubscribe") {
        if (titleEl) titleEl.textContent = "Berhenti Berlangganan";
        if (descEl) descEl.textContent = "Masukkan alamat email Anda yang telah terdaftar untuk berhenti menerima pengingat email harian.";
        if (labelEl) labelEl.innerHTML = 'Alamat Email Terdaftar <span class="required">*</span>';
        if (toggleCheckBtn) {
          toggleCheckBtn.textContent = "Cek status pendaftaran email";
          toggleCheckBtn.classList.remove("hidden");
        }
        if (toggleUnsubBtn) {
          toggleUnsubBtn.textContent = "Kembali ke formulir pendaftaran";
          toggleUnsubBtn.style.color = "var(--primary)";
        }
        if (submitBtn) {
          submitBtn.className = "btn btn-danger";
          const text = submitBtn.querySelector(".btn-text");
          if (text) text.textContent = "Berhenti Berlangganan";
        }
      } else if (mode === "check_status") {
        if (titleEl) titleEl.textContent = "Cek Status Pendaftaran Email";
        if (descEl) descEl.textContent = "Periksa apakah alamat email Anda sudah terdaftar dalam sistem pengingat agenda kegiatan harian.";
        if (labelEl) labelEl.innerHTML = 'Alamat Email yang Ingin Dicek <span class="required">*</span>';
        if (toggleCheckBtn) {
          toggleCheckBtn.textContent = "Kembali ke formulir pendaftaran";
          toggleCheckBtn.classList.remove("hidden");
        }
        if (toggleUnsubBtn) {
          toggleUnsubBtn.textContent = "Berhenti berlangganan?";
          toggleUnsubBtn.style.color = "var(--text-muted)";
        }
        if (submitBtn) {
          submitBtn.className = "btn btn-primary";
          const text = submitBtn.querySelector(".btn-text");
          if (text) text.textContent = "Cek Status";
        }
      } else {
        // Mode "subscribe" (Pendaftaran Baru)
        if (titleEl) titleEl.textContent = "Langganan Notifikasi Email";
        if (descEl) descEl.textContent = "Dapatkan ringkasan agenda program kerja OSIS setiap pagi hari langsung ke email Anda.";
        if (labelEl) labelEl.innerHTML = 'Alamat Email Anda <span class="required">*</span>';
        if (toggleCheckBtn) {
          toggleCheckBtn.textContent = "Cek status pendaftaran email lain";
          toggleCheckBtn.classList.remove("hidden");
        }
        if (toggleUnsubBtn) {
          toggleUnsubBtn.textContent = "Berhenti berlangganan?";
          toggleUnsubBtn.style.color = "var(--text-muted)";
        }
        if (submitBtn) {
          submitBtn.className = "btn btn-primary";
          const text = submitBtn.querySelector(".btn-text");
          if (text) text.textContent = "Daftar";
        }
      }
    }
  },

  async handleSubmit(e) {
    e.preventDefault();

    const input = document.getElementById("subscriberEmailInput");
    const alertEl = document.getElementById("emailFormAlert");
    const alertText = document.getElementById("emailFormAlertText");
    const submitBtn = document.getElementById("submitEmailSubscribeBtn");
    const btnSpinner = submitBtn ? submitBtn.querySelector(".btn-spinner") : null;
    const btnText = submitBtn ? submitBtn.querySelector(".btn-text") : null;

    let targetEmail = "";
    if (this.mode === "subscribed") {
      targetEmail = this.currentEmail || localStorage.getItem("subscribed_email") || "";
    } else {
      targetEmail = input ? input.value.trim().toLowerCase() : "";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!targetEmail || !emailRegex.test(targetEmail)) {
      if (alertText) alertText.textContent = "Format alamat email tidak valid.";
      if (alertEl) {
        alertEl.className = "alert alert-danger";
        alertEl.classList.remove("hidden");
      }
      if (input && this.mode !== "subscribed") input.focus();
      return;
    }

    if (alertEl) alertEl.classList.add("hidden");

    if (!ApiClient.hasConfiguredUrl()) {
      Toast.show("Fitur langganan email memerlukan koneksi backend Google Apps Script aktif.", "info");
      return;
    }

    let action = "subscribeEmail";
    if (this.mode === "subscribed" || this.mode === "unsubscribe") {
      action = "unsubscribeEmail";
    } else if (this.mode === "check_status") {
      action = "checkSubscription";
    }

    try {
      if (submitBtn) submitBtn.disabled = true;
      if (input) input.disabled = true;
      if (btnSpinner) btnSpinner.classList.remove("hidden");
      if (btnText) btnText.textContent = "Memproses...";

      const payload = JSON.stringify({
        action: action,
        email: targetEmail
      });

      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: payload
      });

      if (!response.ok) {
        throw new Error(`Respon server bermasalah (${response.status})`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Gagal memproses permintaan langganan email.");
      }

      // 1. Aksi Check Subscription
      if (action === "checkSubscription") {
        if (result.subscribed) {
          localStorage.setItem("subscribed_email", targetEmail);
          Toast.show(`Email ${targetEmail} aktif terdaftar!`, "success");
          this.setMode("subscribed", targetEmail);
        } else {
          if (alertText) {
            alertText.innerHTML = `Email <strong>${escapeHtml(targetEmail)}</strong> belum terdaftar dalam sistem notifikasi.`;
          }
          if (alertEl) {
            alertEl.className = "alert alert-info";
            alertEl.classList.remove("hidden");
          }
          Toast.show("Email belum terdaftar dalam notifikasi.", "info");
        }
        return;
      }

      // 2. Aksi Unsubscribe
      if (action === "unsubscribeEmail") {
        const stored = localStorage.getItem("subscribed_email");
        if (stored && stored.toLowerCase() === targetEmail.toLowerCase()) {
          localStorage.removeItem("subscribed_email");
        }
        Toast.show(result.message || "Berhasil berhenti berlangganan.", "success");
        this.setMode("subscribe", "");
        return;
      }

      // 3. Aksi Subscribe (Pendaftaran Baru atau Re-subscribe / Sudah Terdaftar)
      if (action === "subscribeEmail") {
        localStorage.setItem("subscribed_email", targetEmail);

        if (result.alreadySubscribed) {
          Toast.show("Email ini sudah terdaftar sebelumnya.", "info");
        } else {
          Toast.show(result.message || "Pendaftaran email berhasil!", "success");
        }

        this.setMode("subscribed", targetEmail);
      }

    } catch (err) {
      console.error("Gagal submit langganan email:", err);
      if (alertText) alertText.textContent = err.message || "Terjadi kesalahan saat memproses permintaan.";
      if (alertEl) {
        alertEl.className = "alert alert-danger";
        alertEl.classList.remove("hidden");
      }
      Toast.show(err.message || "Gagal memproses langganan email", "error");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (input) input.disabled = false;
      if (btnSpinner) btnSpinner.classList.add("hidden");

      if (btnText) {
        if (this.mode === "subscribed" || this.mode === "unsubscribe") {
          btnText.textContent = "Berhenti Berlangganan";
        } else if (this.mode === "check_status") {
          btnText.textContent = "Cek Status";
        } else {
          btnText.textContent = "Daftar";
        }
      }
    }
  }
};

// ==========================================================================
// CONTROLLER MODAL RIWAYAT & ARSIP KEGIATAN (ADMIN COMPLETION REVIEW)
// ==========================================================================
const ArchiveModal = {
  items: [],
  cachedItems: null,
  isLoading: false,

  init() {
    const openBtn = document.getElementById("openArchiveModalBtn");
    const closeBtn = document.getElementById("closeArchiveModalBtn");
    const closeBottomBtn = document.getElementById("closeArchiveBottomBtn");
    const refreshBtn = document.getElementById("refreshArchiveBtn");
    const modalEl = document.getElementById("archiveModal");

    if (openBtn) openBtn.addEventListener("click", () => this.open());
    if (closeBtn) closeBtn.addEventListener("click", () => this.close());
    if (closeBottomBtn) closeBottomBtn.addEventListener("click", () => this.close());
    if (refreshBtn) refreshBtn.addEventListener("click", () => this.loadArchiveData(true));

    if (modalEl) {
      let isBackdropDown = false;
      modalEl.addEventListener("mousedown", (e) => {
        isBackdropDown = (e.target === modalEl);
      });
      modalEl.addEventListener("click", (e) => {
        if (isBackdropDown && e.target === modalEl) {
          this.close();
        }
        isBackdropDown = false;
      });
    }

    // Tutup dropdown kustom status pada kartu arsip saat klik di luar
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".archive-custom-select")) {
        document.querySelectorAll(".archive-custom-select.open").forEach(el => {
          el.classList.remove("open");
          const optList = el.querySelector(".archive-custom-options");
          if (optList) optList.classList.add("hidden");
          const trg = el.querySelector(".archive-status-trigger");
          if (trg) {
            trg.classList.remove("active");
            trg.setAttribute("aria-expanded", "false");
          }
          const parentCard = el.closest(".archive-card");
          if (parentCard) parentCard.classList.remove("dropdown-open");
        });
      }
    });
  },

  open() {
    if (!AuthState.isAdmin) {
      Toast.show("Fitur Riwayat Kegiatan memerlukan hak akses Administrator. Silakan login terlebih dahulu.", "warning");
      AdminLoginModal.open();
      return;
    }

    const modal = document.getElementById("archiveModal");
    if (!modal) return;

    modal.classList.remove("hidden");
    Modal.lockScroll();

    // Jika data sudah tersedia di cache sesi, tampilkan seketika (0ms delay)
    if (this.cachedItems !== null) {
      this.items = this.cachedItems;
      const loadingState = document.getElementById("archiveLoadingState");
      const emptyState = document.getElementById("archiveEmptyState");
      const totalText = document.getElementById("archiveTotalText");

      if (loadingState) loadingState.classList.add("hidden");

      if (this.items.length === 0) {
        if (emptyState) emptyState.classList.remove("hidden");
        if (totalText) totalText.textContent = "Total 0 kegiatan terarsip";
        this.updateStats([]);
      } else {
        if (emptyState) emptyState.classList.add("hidden");
        if (totalText) totalText.textContent = `Total ${this.items.length} kegiatan terarsip`;
        this.renderList(this.items);
        this.updateStats(this.items);
      }
    } else {
      this.loadArchiveData(false);
    }
  },

  close() {
    const modal = document.getElementById("archiveModal");
    if (modal) modal.classList.add("hidden");
    Modal.unlockScroll();
  },

  async loadArchiveData(forceRefresh = true) {
    const loadingState = document.getElementById("archiveLoadingState");
    const emptyState = document.getElementById("archiveEmptyState");
    const listContainer = document.getElementById("archiveListContainer");
    const totalText = document.getElementById("archiveTotalText");
    const refreshBtn = document.getElementById("refreshArchiveBtn");

    if (loadingState) loadingState.classList.remove("hidden");
    if (emptyState) emptyState.classList.add("hidden");
    if (listContainer && forceRefresh) listContainer.innerHTML = "";
    if (totalText) totalText.textContent = "Memuat data arsip...";
    if (refreshBtn) refreshBtn.classList.add("btn-spinning");

    try {
      this.isLoading = true;
      const data = await ApiClient.getArchiveEvents();
      this.items = Array.isArray(data) ? data : [];
      this.cachedItems = this.items;

      if (loadingState) loadingState.classList.add("hidden");

      if (this.items.length === 0) {
        if (emptyState) emptyState.classList.remove("hidden");
        if (totalText) totalText.textContent = "Total 0 kegiatan terarsip";
        this.updateStats([]);
      } else {
        if (emptyState) emptyState.classList.add("hidden");
        if (totalText) totalText.textContent = `Total ${this.items.length} kegiatan terarsip`;
        this.renderList(this.items);
        this.updateStats(this.items);
      }
    } catch (err) {
      console.error("Gagal memuat data arsip:", err);
      if (loadingState) loadingState.classList.add("hidden");
      if (emptyState) emptyState.classList.remove("hidden");
      if (totalText) totalText.textContent = "Gagal memuat arsip";
      Toast.show(err.message || "Gagal mengambil data arsip kegiatan", "error");
    } finally {
      this.isLoading = false;
      if (refreshBtn) refreshBtn.classList.remove("btn-spinning");
    }
  },

  updateStats(items) {
    let terlaksana = 0;
    let tidak = 0;
    let belum = 0;

    items.forEach(it => {
      const st = String(it.status_pelaksanaan || "").trim();
      if (st === "Terlaksana") terlaksana++;
      else if (st === "Tidak Terlaksana") tidak++;
      else belum++;
    });

    const statTerlaksana = document.querySelector("#statTerlaksana .stat-count");
    const statTidak = document.querySelector("#statTidak .stat-count");
    const statBelum = document.querySelector("#statBelum .stat-count");

    if (statTerlaksana) statTerlaksana.textContent = terlaksana;
    if (statTidak) statTidak.textContent = tidak;
    if (statBelum) statBelum.textContent = belum;
  },

  renderList(items) {
    const listContainer = document.getElementById("archiveListContainer");
    if (!listContainer) return;

    listContainer.innerHTML = "";

    const filtered = (items || []).filter(it => matchesUnitFilter(it.unit, AppState.unitFilter));
    this.updateStats(filtered);

    const totalText = document.getElementById("archiveTotalText");
    const emptyState = document.getElementById("archiveEmptyState");

    if (filtered.length === 0) {
      if (emptyState) emptyState.classList.remove("hidden");
      if (totalText) totalText.textContent = `Total 0 kegiatan terarsip (${AppState.unitFilter || 'Semua'})`;
      return;
    }

    if (emptyState) emptyState.classList.add("hidden");
    if (totalText) totalText.textContent = `Total ${filtered.length} kegiatan terarsip (${AppState.unitFilter || 'Semua'})`;

    // Urutkan berdasarkan tanggal selesai terbaru
    const sorted = [...filtered].sort((a, b) => {
      const dateA = (a.tanggal_selesai || a.tanggal_mulai || "") + " " + (a.jam_selesai || "00:00");
      const dateB = (b.tanggal_selesai || b.tanggal_mulai || "") + " " + (b.jam_selesai || "00:00");
      return dateB.localeCompare(dateA);
    });

    sorted.forEach(item => {
      const card = document.createElement("div");
      card.className = "archive-card";
      card.setAttribute("data-archive-id", item.id);

      const divInfo = getDivisiInfo(item.divisi);
      const divisiBadge = divInfo
        ? `<span class="divisi-badge divisi-${divInfo.key}"><i class="${divInfo.icon}"></i> <span>${escapeHtml(divInfo.name)}</span></span>`
        : `<span class="divisi-badge divisi-bersama"><i class="fa-solid fa-people-group"></i> <span>Bersama / Proker Bersama</span></span>`;

      const unitInfo = getUnitInfo(item.unit);
      const canManage = canAdminManageUnit(item.unit);

      const dateRangeStr = DateHelper.formatDateRange(item.tanggal_mulai, item.tanggal_selesai);
      const timeRangeStr = (item.jam_mulai && item.jam_selesai) ? `${item.jam_mulai} - ${item.jam_selesai} WITA` : "";

      const currentStatus = item.status_pelaksanaan || "Belum Dinilai";
      const currentKeterangan = item.keterangan_pelaksanaan || "";

      let badgeClass = "status-belum";
      let badgeIcon = "fa-regular fa-clock";
      if (currentStatus === "Terlaksana") {
        badgeClass = "status-terlaksana";
        badgeIcon = "fa-solid fa-circle-check";
      } else if (currentStatus === "Tidak Terlaksana") {
        badgeClass = "status-tidak";
        badgeIcon = "fa-solid fa-circle-xmark";
      }

      card.innerHTML = `
        <div class="archive-card-top">
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <span class="unit-badge unit-badge-${unitInfo.key}">
              <i class="${unitInfo.icon}"></i>
              <span>${escapeHtml(unitInfo.name)}</span>
            </span>
            ${divisiBadge}
            <span class="archive-status-badge ${badgeClass}" data-role="status-badge">
              <i class="${badgeIcon}"></i>
              <span class="status-badge-text">${escapeHtml(currentStatus)}</span>
            </span>
          </div>
        </div>

        <div class="archive-card-body">
          <h4 class="archive-card-title">${escapeHtml(item.judul)}</h4>
          ${item.deskripsi ? `<p class="archive-card-desc">${escapeHtml(item.deskripsi)}</p>` : ""}

          <div class="event-meta-grid" style="margin-top: 0.625rem; font-size: 0.8125rem;">
            <div class="meta-item" title="Rentang Tanggal">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>${escapeHtml(dateRangeStr)}</span>
            </div>
            ${timeRangeStr ? `
            <div class="meta-item" title="Waktu Pelaksanaan">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>${escapeHtml(timeRangeStr)}</span>
            </div>` : ""}
            ${item.lokasi ? `
            <div class="meta-item" title="Lokasi Kegiatan">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>${escapeHtml(item.lokasi)}</span>
            </div>` : ""}

            ${item.petugas ? `
            <div class="meta-item" title="Petugas / Penanggung Jawab">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Petugas: ${escapeHtml(item.petugas)}</span>
            </div>` : ""}
          </div>
        </div>

        <div class="archive-card-divider"></div>

        <!-- Form Evaluasi Vertikal (Clean Stacked Form) -->
        <div class="archive-eval-section">
          ${!canManage ? `
            <div class="unit-auth-notice" style="padding: 0.625rem 0.875rem; background: var(--bg-subtle); border-radius: var(--radius-md); font-size: 0.8125rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
              <i class="fa-solid fa-lock" style="color: var(--text-muted);"></i>
              <span>Evaluasi hanya dapat diubah oleh Admin ${escapeHtml(item.unit || "Unit terkait")}.</span>
            </div>
          ` : `
          <div class="form-group" style="margin-bottom: 0.875rem;">
            <label class="form-label" style="font-size: 0.8125rem; margin-bottom: 0.35rem;">Status Pelaksanaan</label>
            <div class="custom-select-wrap archive-custom-select">
              <button type="button" class="form-control custom-select-trigger archive-status-trigger" aria-haspopup="listbox" aria-expanded="false">
                <div class="custom-select-value">
                  <span class="trigger-badge ${badgeClass}">
                    <i class="${badgeIcon}"></i>
                    <span class="trigger-status-text">${escapeHtml(currentStatus)}</span>
                  </span>
                </div>
                <svg class="custom-select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <ul class="custom-select-options archive-custom-options hidden" role="listbox">
                <li class="custom-select-option ${currentStatus === 'Belum Dinilai' ? 'selected' : ''}" role="option" data-value="Belum Dinilai" tabindex="0">
                  <span class="status-option-badge" style="background-color: var(--bg-subtle); color: var(--text-muted);"><i class="fa-regular fa-clock"></i></span>
                  <div class="option-text"><span class="option-title">Belum Dinilai</span></div>
                  <svg class="option-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </li>
                <li class="custom-select-option ${currentStatus === 'Terlaksana' ? 'selected' : ''}" role="option" data-value="Terlaksana" tabindex="0">
                  <span class="status-option-badge" style="background-color: var(--primary-light); color: var(--primary);"><i class="fa-solid fa-circle-check"></i></span>
                  <div class="option-text"><span class="option-title">Terlaksana</span></div>
                  <svg class="option-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </li>
                <li class="custom-select-option ${currentStatus === 'Tidak Terlaksana' ? 'selected' : ''}" role="option" data-value="Tidak Terlaksana" tabindex="0">
                  <span class="status-option-badge" style="background-color: var(--danger-light); color: var(--danger);"><i class="fa-solid fa-circle-xmark"></i></span>
                  <div class="option-text"><span class="option-title">Tidak Terlaksana</span></div>
                  <svg class="option-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </li>
              </ul>
              <input type="hidden" class="archive-status-input" value="${escapeHtml(currentStatus)}">
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 0.875rem;">
            <label class="form-label" style="font-size: 0.8125rem; margin-bottom: 0.35rem;">Keterangan / Catatan Evaluasi</label>
            <textarea class="form-control archive-keterangan-textarea" rows="2" placeholder="Tulis catatan evaluasi atau kendala kegiatan...">${escapeHtml(currentKeterangan)}</textarea>
          </div>

          <div class="archive-actions-row">
            <button type="button" class="btn btn-primary archive-save-btn">
              <span class="btn-text">Simpan Evaluasi</span>
              <span class="btn-spinner hidden"></span>
            </button>
          </div>
          `}
        </div>
      `;

      if (canManage) {
        this.attachCardEvents(card, item);
      }
      listContainer.appendChild(card);
    });
  },

  attachCardEvents(card, item) {
    const selectWrap = card.querySelector(".archive-custom-select");
    const trigger = card.querySelector(".archive-status-trigger");
    const optionsList = card.querySelector(".archive-custom-options");
    const options = card.querySelectorAll(".custom-select-option");
    const hiddenInput = card.querySelector(".archive-status-input");
    const triggerText = card.querySelector(".trigger-status-text");
    const triggerBadge = card.querySelector(".trigger-badge");
    const triggerIcon = triggerBadge.querySelector("i");
    const topBadge = card.querySelector("[data-role='status-badge']");
    const topBadgeText = topBadge.querySelector(".status-badge-text");
    const topBadgeIcon = topBadge.querySelector("i");
    const textarea = card.querySelector(".archive-keterangan-textarea");
    const saveBtn = card.querySelector(".archive-save-btn");
    const btnSpinner = saveBtn.querySelector(".btn-spinner");
    const btnText = saveBtn.querySelector(".btn-text");

    // Toggle dropdown
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = selectWrap.classList.contains("open");

      // Close all other open dropdowns in archive cards
      document.querySelectorAll(".archive-custom-select.open").forEach(el => {
        if (el !== selectWrap) {
          el.classList.remove("open");
          const optList = el.querySelector(".archive-custom-options");
          if (optList) optList.classList.add("hidden");
          const trg = el.querySelector(".archive-status-trigger");
          if (trg) {
            trg.classList.remove("active");
            trg.setAttribute("aria-expanded", "false");
          }
          const parentCard = el.closest(".archive-card");
          if (parentCard) parentCard.classList.remove("dropdown-open");
        }
      });

      const parentCard = selectWrap.closest(".archive-card");

      if (isOpen) {
        selectWrap.classList.remove("open");
        optionsList.classList.add("hidden");
        trigger.classList.remove("active");
        trigger.setAttribute("aria-expanded", "false");
        if (parentCard) parentCard.classList.remove("dropdown-open");
      } else {
        selectWrap.classList.add("open");
        optionsList.classList.remove("hidden");
        trigger.classList.add("active");
        trigger.setAttribute("aria-expanded", "true");
        if (parentCard) parentCard.classList.add("dropdown-open");

        // Scroll smooth jika opsi berada dekat bagian bawah container
        setTimeout(() => {
          optionsList.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 50);
      }
    });

    // Pilihan opsi status
    options.forEach(opt => {
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        const val = opt.getAttribute("data-value");
        hiddenInput.value = val;

        options.forEach(o => {
          o.classList.remove("selected");
          o.setAttribute("aria-selected", "false");
        });
        opt.classList.add("selected");
        opt.setAttribute("aria-selected", "true");

        // Update trigger UI
        triggerText.textContent = val;
        let bClass = "status-belum";
        let bIcon = "fa-regular fa-clock";
        if (val === "Terlaksana") {
          bClass = "status-terlaksana";
          bIcon = "fa-solid fa-circle-check";
        } else if (val === "Tidak Terlaksana") {
          bClass = "status-tidak";
          bIcon = "fa-solid fa-circle-xmark";
        }

        triggerBadge.className = `trigger-badge ${bClass}`;
        triggerIcon.className = bIcon;

        // Update badge pada header kartu
        topBadge.className = `archive-status-badge ${bClass}`;
        topBadgeText.textContent = val;
        topBadgeIcon.className = bIcon;

        selectWrap.classList.remove("open");
        optionsList.classList.add("hidden");
        trigger.classList.remove("active");
        trigger.setAttribute("aria-expanded", "false");
        const parentCard = selectWrap.closest(".archive-card");
        if (parentCard) parentCard.classList.remove("dropdown-open");
      });
    });

    // Simpan evaluasi status & keterangan
    saveBtn.addEventListener("click", async () => {
      const statusVal = hiddenInput.value;
      const ketVal = textarea.value.trim();

      try {
        saveBtn.disabled = true;
        btnSpinner.classList.remove("hidden");
        btnText.textContent = "Menyimpan...";

        const res = await ApiClient.updateArchiveStatus(item.id, statusVal, ketVal);

        // Update item lokal & cache sesi
        item.status_pelaksanaan = statusVal;
        item.keterangan_pelaksanaan = ketVal;
        if (ArchiveModal.cachedItems) {
          const cached = ArchiveModal.cachedItems.find(c => c.id === item.id);
          if (cached) {
            cached.status_pelaksanaan = statusVal;
            cached.keterangan_pelaksanaan = ketVal;
          }
        }

        Toast.show(res.message || "Evaluasi status kegiatan berhasil disimpan!", "success");
        this.updateStats(this.items);
      } catch (err) {
        console.error("Gagal update status arsip:", err);
        Toast.show(err.message || "Gagal menyimpan evaluasi status kegiatan", "error");
      } finally {
        saveBtn.disabled = false;
        btnSpinner.classList.add("hidden");
        btnText.textContent = "Simpan Evaluasi";
      }
    });
  }
};

// ==========================================================================
// CONTROLLER NAVBAR & MOBILE DROPDOWN
// ==========================================================================
const NavbarManager = {
  toggleBtn: null,
  headerNav: null,
  menuIcon: null,
  closeIcon: null,
  isOpen: false,

  init() {
    this.toggleBtn = document.getElementById("navbarToggleBtn");
    this.headerNav = document.getElementById("headerNav");
    if (!this.toggleBtn || !this.headerNav) return;

    this.menuIcon = this.toggleBtn.querySelector(".nav-icon-menu");
    this.closeIcon = this.toggleBtn.querySelector(".nav-icon-close");

    // Toggle dropdown saat tombol hamburger diklik
    this.toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggle();
    });

    // Tutup dropdown saat item aksi di dalam headerNav diklik (mobile)
    this.headerNav.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        if (this.isOpen && window.innerWidth <= 640) {
          this.close();
        }
      });
    });

    // Tutup dropdown jika klik di luar headerNav dan navbarToggleBtn
    document.addEventListener("click", (e) => {
      if (this.isOpen && !this.headerNav.contains(e.target) && !this.toggleBtn.contains(e.target)) {
        this.close();
      }
    });

    // Tutup dropdown jika layar di-resize melebihi 640px
    window.addEventListener("resize", () => {
      if (window.innerWidth > 640 && this.isOpen) {
        this.close();
      }
    }, { passive: true });
  },

  open() {
    this.isOpen = true;
    this.headerNav.classList.add("nav-open");
    this.toggleBtn.setAttribute("aria-expanded", "true");
    this.toggleBtn.setAttribute("aria-label", "Tutup Menu Navigasi");
    this.toggleBtn.setAttribute("title", "Tutup Menu Navigasi");
    if (this.menuIcon) this.menuIcon.classList.add("hidden");
    if (this.closeIcon) this.closeIcon.classList.remove("hidden");
  },

  close() {
    this.isOpen = false;
    this.headerNav.classList.remove("nav-open");
    this.toggleBtn.setAttribute("aria-expanded", "false");
    this.toggleBtn.setAttribute("aria-label", "Buka Menu Navigasi");
    this.toggleBtn.setAttribute("title", "Buka Menu Navigasi");
    if (this.menuIcon) this.menuIcon.classList.remove("hidden");
    if (this.closeIcon) this.closeIcon.classList.add("hidden");
  },

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
};

// ==========================================================================
// PENGATUR TEMA (LIGHT / DARK MODE)
// ==========================================================================
const ThemeManager = {
  STORAGE_KEY: "theme-preference",
  currentTheme: "light",

  init() {
    const toggleBtn = document.getElementById("themeToggleBtn");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => this.toggleTheme());
    }

    // 1. Baca preferensi tersimpan dari localStorage
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved === "dark" || saved === "light") {
      this.applyTheme(saved, false);
    } else {
      // 2. Fallback ke preferensi sistem peramban (OS/browser)
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      this.applyTheme(prefersDark ? "dark" : "light", false);
    }

    // Dengarkan perubahan prefers-color-scheme otomatis dari OS jika user belum memilih secara eksplisit
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
          this.applyTheme(e.matches ? "dark" : "light", false);
        }
      });
    }
  },

  applyTheme(theme, save = true) {
    this.currentTheme = theme;
    const isDark = theme === "dark";

    if (isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }

    if (save) {
      try {
        localStorage.setItem(this.STORAGE_KEY, theme);
      } catch (e) {
        console.warn("Gagal menyimpan preferensi tema:", e);
      }
    }

    this.updateToggleIcon(isDark);
  },

  toggleTheme() {
    const nextTheme = this.currentTheme === "dark" ? "light" : "dark";
    this.applyTheme(nextTheme, true);
  },

  updateToggleIcon(isDark) {
    const toggleBtn = document.getElementById("themeToggleBtn");
    if (!toggleBtn) return;

    const sunIcon = toggleBtn.querySelector(".theme-icon-sun");
    const moonIcon = toggleBtn.querySelector(".theme-icon-moon");

    if (isDark) {
      if (sunIcon) sunIcon.classList.remove("hidden");
      if (moonIcon) moonIcon.classList.add("hidden");
      toggleBtn.title = "Ganti ke Mode Terang";
      toggleBtn.setAttribute("aria-label", "Ganti ke Mode Terang");
    } else {
      if (sunIcon) sunIcon.classList.add("hidden");
      if (moonIcon) moonIcon.classList.remove("hidden");
      toggleBtn.title = "Ganti ke Mode Gelap";
      toggleBtn.setAttribute("aria-label", "Ganti ke Mode Gelap");
    }
  }
};

// ==========================================================================
// AUTO-REFRESH (BACKGROUND POLLING)
// ==========================================================================
const AutoRefresh = {
  intervalId: null,
  POLL_INTERVAL_MS: 20000, // Sinkronisasi berkala tiap 20 detik

  /**
   * Cek apakah ada modal dialog yang sedang terbuka
   */
  isModalOpen() {
    const eventModal = document.getElementById("eventModal");
    const deleteModal = document.getElementById("deleteModal");
    const adminLoginModal = document.getElementById("adminLoginModal");
    const emailSubscribeModal = document.getElementById("emailSubscribeModal");
    const archiveModal = document.getElementById("archiveModal");
    const eventDetailModal = document.getElementById("eventDetailModal");
    const isEventModalOpen = eventModal && !eventModal.classList.contains("hidden");
    const isDeleteModalOpen = deleteModal && !deleteModal.classList.contains("hidden");
    const isAdminLoginOpen = adminLoginModal && !adminLoginModal.classList.contains("hidden");
    const isEmailModalOpen = emailSubscribeModal && !emailSubscribeModal.classList.contains("hidden");
    const isArchiveModalOpen = archiveModal && !archiveModal.classList.contains("hidden");
    const isDetailModalOpen = eventDetailModal && !eventDetailModal.classList.contains("hidden");
    return isEventModalOpen || isDeleteModalOpen || isAdminLoginOpen || isEmailModalOpen || isArchiveModalOpen || isDetailModalOpen;
  },

  /**
   * Eksekusi polling data kegiatan di latar belakang
   */
  tick() {
    // Lewati polling jika pengguna sedang mengisi formulir atau mengonfirmasi aksi
    if (this.isModalOpen()) {
      return;
    }
    // Panggil loadEventsData secara hening (isSilent = true)
    loadEventsData(true);
  },

  init() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => this.tick(), this.POLL_INTERVAL_MS);
  }
};

// ==========================================================================
// ENTRY POINT (SAAT HALAMAN SELESAI DIMUAT)
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  // Inisialisasi controller navbar, tema, form controls & modal
  NavbarManager.init();
  ThemeManager.init();
  UnitFilterManager.init();
  StatusDropdown.init();
  DivisiDropdown.init();
  LokasiDropdown.init();
  UnitDropdown.init();
  PetugasInputManager.init();
  ProkerSuggestionsManager.updateDatalist();
  NotificationManager.init();
  EmailSubscribeModal.init();
  ArchiveModal.init();
  EventDetailModal.init();
  FormPickers.init();

  // Inisialisasi tanggal terpilih ke hari ini
  const today = new Date();
  AppState.selectedDate = DateHelper.toDateString(today);
  AppState.viewYear = today.getFullYear();
  AppState.viewMonth = today.getMonth();

  initializeEvents();
  Auth.init(); // Inisialisasi status otentikasi (Guest Mode default & verifikasi token)
  loadEventsData();
  MakassarClock.init();
  UpcomingCountdown.init();
  AutoRefresh.init();
});

