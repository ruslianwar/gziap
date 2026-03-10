# Catatan Proyek SiGizi MBG (Sistem Informasi Gizi Makan Bergizi Gratis)

*File ini digunakan agar AI dan Developer tetap sinkron mengenai status terakhir pekerjaan pada proyek ini, bahkan setelah komputer di-restart.*

## 📌 Status Terakhir (Update: 10 Maret 2026)
- **Repositori:** Bersiap untuk Release V1.0.0-Beta. _Git commit_ sangat direkomendasikan.
- **Commit Terakhir:** `docs: menambahkan file TODO.md`
- **Fokus Pekerjaan Terkini:** Pembersihan UI/Statistik Palsu (Dummy-Free), Penguncian UI Modul Laporan, Pemasangan Maklumat Hukum (HAKI), & Perombakan Dasbor.
- **File Aktif Terakhir:**
  - `src/pages/LaporanPage.tsx` (Perakitan `ExcelJS` & Isolasi 5 Laporan Fiktif)
  - `src/layouts/MainLayout.tsx` (Logo "v1.0.0-Beta", Tambahan _About_)
  - `src/pages/AboutPage.tsx` (Pusat Peringatan Independensi & Hak Cipta)
  - `src/pages/DashboardPage.tsx` (Sapaan Dinamis & Pemangkasan Angka Palsu)
- **Deployment:** Menunggu dorongan (*push*) ke repositori daring.

## 🚀 Langkah Selanjutnya (To-Do)
- [x] Perbaikan CRUD inline editing pada tabel Rincian Piring Menu
- [x] Hapus kolom Belanja, tambah Lemak & Karbo, pindah Kategori & Anggaran ke kanan
- [x] Perbaiki skema validasi gizi menjadi bertingkat (gizi pass + komponen 4/5 = ⚠️)
- [x] Fix floating point panjang di Progress Bar
  - [x] Racik Otomatis: prioritas Nasi Putih/Beras Merah, gramase dinamis per kelompok
- [x] Perbaikan Progress Bar → Range Indicator (warna semantik: biru/hijau/kuning/merah + zona target visual)
- [x] Perbaikan data bayi_siang → bayi_pagi (AKG 20-25%, waktu Pagi)
- [x] Dropdown kelompok sasaran → optgroup Porsi Kecil/Besar + badge otomatis
- [x] Menonaktifkan sementara fitur Racik Otomatis (menunggu upgrade API Gemini)
- [x] Ekspor Laporan Excel Susun Menu yang dipercantik & pemisahan kolom Protein (Hewani/Nabati)
- [x] Ekspor Laporan Excel Siklus Menu (Landscape, 5 Hari) di halaman Cycle Menu
- [x] (Sesi 9 Mar) Terapkan Kebijakan Keamanan Identitas Profil multi-tenant (RLS Supabase).
- [x] (Sesi 9 Mar) Susun logik toleransi Piringku (Boleh 4/5 Komponen asalkan Gizi Target Pass 100%).
- [x] (Sesi 9 Mar) Injeksi utuh data "Serat" mulai dari Pencarian Bahan, Kalkulator Reduksi, Bagan Progress Bar UI, sampai Ekspor Excel. Target Sasaran Serat merujuk pada Permenkes 28/2019.
- [x] (Sesi 9 Mar) Pasang Pagination backend Database via `select("*").limit(50)` untuk menghindari penumpukan memori tabel Menu.
- [x] (Sesi 9 Mar) Ciptakan UI/UX Layout Interaktif "Call To Action" untuk mengganti Tabel yang Kosong.
- [x] (Sesi 9 Mar) Resolusi Bug Fatal Layar "Blank" (Crash pada React `.toFixed()` saat berhadapan dengan data tipe String lama via injeksi `Number()`).
- [x] (Sesi 9 Mar) Resolusi Bug Pencarian `% ${text}%` Supabase dan sinkronisasi label Sidebar `Versi Aplikasi`.
- [x] Evaluasi `LaporanPage.tsx`: Hapus ekspor _.csv_ murahan dan ganti pakai `ExcelJS` mutlak (.xlsx).
- [x] Evaluasi `LaporanPage.tsx`: Kunci (_Disable_) tombol Ekspor dari 5 Laporan Fiktif yang belum ada induk halamannya (QC, Antropometri, Keuangan, Distribusi, Stok) demi mitigasi Hoaks UI.
- [x] Evaluasi `MainLayout.tsx`: Buang Label "Versi Aplikasi" usang dan ganti menjadi "v1.0.0-Beta" (Persiapan Rilis). Sisipkan ID Menu `about` di ujung bawah "Data & Laporan".
- [x] Evaluasi `AboutPage.tsx`: Ciptakan komponen elegan memuat disklaimer non-Pemerintah RI / Afiliasi BGN, dan deklarasikan ketegasan Hak Cipta.
- [x] Evaluasi `DashboardPage.tsx`: Hapus nama bongkar pasang *(Hardcoded)* "Selamat datang, Siti Rahayu" dan panggil intelijen *User Context* `user.nama_lengkap`.
- [x] Evaluasi `DashboardPage.tsx`: Hilangkan metrik kebohongan (3 Sekolah, 10+ Bahan Pangan, Aman QA), tersisa statistik _Menu Tersusun_ 100% Faktualitas-Database.
- [ ] Push perubahan terbaru ke GitHub dan verifikasi Cloudflare Pages pasca _restart_.

## 💬 Log Percakapan Terakhir
*(Bagian ini akan diisi oleh AI dengan rangkuman diskusi terakhir sebelum sesi berakhir/komputer direstart)*
- **[6 Maret 2026, Sesi Siang]** Berdiskusi mengenai cara terbaik agar AI dapat mengingat konteks proyek walau komputer direstart. Disepakati menggunakan file `TODO.md` ini sebagai "memory bank".
- **[6 Maret 2026, Sesi Malam]** Mengerjakan 5 perbaikan besar di `SusunMenuMBG.tsx`: (1) Tambah fitur Edit inline di tabel, (2) Kolom tabel didirikan ulang (hapus Belanja, tambah Lemak/Karbo), (3) Validasi gizi dibuat bertingkat agar lebih adil, (4) Fix angka floating point panjang di progress bar, (5) Racik Otomatis AI wajib pilih Nasi Putih/Beras Merah sebagai item pertama. Build TypeScript berhasil 0 error.
- **[7 Maret 2026, Sesi Siang]** Perbaikan lanjutan: (1) ProgressBar dirombak jadi Range Indicator (biru/hijau/kuning/merah + zona target), (2) Fitur Edit menu tersimpan, (3) Isolasi data per user menggunakan Supabase RLS — SQL policies dibuat di `supabase_rls_policies.sql`.
- **[9 Maret 2026, Sesi Restorasi & UI Debugging]** Sukses meloloskan injeksi Antarmuka Skala SaaS: Multi-tenant RLS per *User*, Penyelarasan Piringku (Toleransi 4/5 Komponen), Serat Pangan Terintegrasi UI (termasuk referensi `minS/maxS` berbasis AKG Target Sasaran Permenkes), dan Pagination List 50 baris. Mendeteksi & menyembuhkan *Bug Layar Blank* karena penolakan `String` JSON di `.toFixed` reduktor React (diselesaikan via bungkus `Number()`). Menormalkan bug sintaks filter Supabase (`ilike`). Nama lokal wilayah di Sidebar diganti "Versi Aplikasi" *(Universal Use)*. Semua kompilasi TSC sukses. Mesin siap _Restart_.

- **[10 Maret 2026, Sesi Karantina Pra-Rilis V1.0.0-Beta]** Memastikan aplikasi murni bebas dari kepalsuan _(Zero-Dummy)_. Terjadi perombakan raksasa di halaman Ekspor *LaporanPage*, yakni beralih dari teks *CSV* kasar ke mesin asli *ExcelJS* (*.xlsx*) dengan format berbeda per kategori. Demi menjaga kejujuran fitur terhadap *User*, 5 Modul Ekspor yang fiktif (QC, Antropometri, dll.) telah dilucuti senjatanya (_Disabled_ & Dikunci), dan peringatan "Modul Belum Dirilis" disematkan. Selain itu, menu baru "Tentang Aplikasi" (*About*) dilahirkan dengan balutan UI premium memancarkan peringatan merah (Non-Pemerintah) dan klausul kuat UU Hak Cipta. Terakhir, *Dashboard* dibedah total: Nama abadi statis "Siti Rahayu" dihapus berganti modul dinamis, dan 3 kotak hitungan bohong dirobohkan, demi kejujuran dasbor. IDE Typescript *0 Error/0 Warning*. Mesin siap di-_Commit_ dan di-_Restart_ kembali!

---
*Cara Menggunakan: Jika memulai sesi baru dengan AI pasca komputer restart, cukup sapa dengan: "Lanjutkan dari TODO.md" dan saya bersiap langsung memandu kelanjutan penugasan Anda tanpa melupakan riwayat program.*
