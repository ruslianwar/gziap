// File: src/pages/LaporanPage.tsx
import { useState } from "react";
import { AlertBox } from "../components/AlertBox";

export default function LaporanPage() {
  const todayISO = new Date().toISOString().split("T")[0];
  const [periodeType, setPeriodeType] = useState("harian");
  const [tglDari, setTglDari] = useState(todayISO);
  const [tglSampai, setTglSampai] = useState(todayISO);

  // Logika Export CSV Sederhana (Sesuai Prototype Anda)
  const exportData = (tipe: string, format: string) => {
    const headers = [
      "Tanggal",
      "Sekolah",
      "Menu",
      "Porsi Rencana",
      "Porsi Realisasi",
      "Energi (kkal)",
      "Protein (g)",
      "Status QC",
      "Skor Gizi",
    ];
    const rows = [
      [
        todayISO,
        "SDN 01 Ungaran",
        "Nasi Ayam Bumbu Kuning",
        312,
        312,
        650,
        28,
        "LULUS",
        "88%",
      ],
      [
        todayISO,
        "SDN 02 Ungaran",
        "Nasi Ikan Tongkol Balado",
        287,
        287,
        620,
        32,
        "LULUS",
        "84%",
      ],
      [
        todayISO,
        "SDN 05 Bawen",
        "Nasi Daging Semur",
        198,
        185,
        700,
        35,
        "LULUS",
        "76%",
      ],
    ];

    if (format === "csv") {
      const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
      const a = document.createElement("a");
      a.href = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(csv);
      a.download = `Laporan_MBG_${tipe}_${todayISO}.csv`;
      a.click();
      alert(
        `✅ Laporan ${tipe} (CSV) berhasil diunduh! Silakan cek folder Download Anda.`,
      );
    } else {
      alert(
        `⏳ Laporan ${tipe} (PDF) sedang diproses... (Fitur render PDF penuh akan tersedia di versi produksi backend).`,
      );
    }
  };

  return (
    <div>
      <div className="topbar">
        <div className="tb-bread">
          SiGizi MBG / <span>Laporan & Export</span>
        </div>
      </div>

      <div className="ph">
        <div className="ph-title">Laporan & Export Terintegrasi</div>
        <div className="ph-sub">
          Export laporan Harian, 2 Mingguan, Bulanan — format Excel/CSV/PDF
          untuk SIPGN & Dialur
        </div>
      </div>

      {/* Pengaturan Periode */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="ch-title">⚙️ Pengaturan Periode Laporan</div>
        </div>
        <div className="card-body">
          <div className="fr" style={{ alignItems: "end" }}>
            <div className="fg">
              <label className="fl">Jenis Laporan</label>
              <select
                className="fs"
                value={periodeType}
                onChange={(e) => setPeriodeType(e.target.value)}
              >
                <option value="harian">Laporan Harian</option>
                <option value="2mingguan">Laporan 2 Mingguan</option>
                <option value="bulanan">Laporan Bulanan</option>
              </select>
            </div>
            <div className="fg">
              <label className="fl">Tanggal Dari</label>
              <input
                className="fi"
                type="date"
                value={tglDari}
                onChange={(e) => setTglDari(e.target.value)}
              />
            </div>
            <div className="fg">
              <label className="fl">Tanggal Sampai</label>
              <input
                className="fi"
                type="date"
                value={tglSampai}
                onChange={(e) => setTglSampai(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Kartu-Kartu Jenis Laporan */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 20,
        }}
      >
        {[
          {
            icon: "📋",
            title: "Laporan Distribusi",
            desc: "Rekapitulasi distribusi harian per sekolah dengan data porsi, realisasi, dan waktu",
            format: "distribusi",
          },
          {
            icon: "🥗",
            title: "Laporan Menu & Gizi",
            desc: "Daftar cycle menu, nilai gizi, dan analisis kecukupan AKG per kelompok sasaran",
            format: "menu_gizi",
          },
          {
            icon: "🔬",
            title: "Laporan QC & Food Safety",
            desc: "Hasil checklist inspeksi, skor organoleptik, dan riwayat food sample",
            format: "qc",
          },
          {
            icon: "📦",
            title: "Laporan Stok & RKBP",
            desc: "Rencana Kebutuhan Bahan Pangan otomatis dari menu + realisasi penggunaan stok",
            format: "stok",
          },
          {
            icon: "📏",
            title: "Laporan Antropometri",
            desc: "Data pengukuran BB/TB/LK/LILA dan rekapitulasi status gizi penerima manfaat",
            format: "antro",
          },
          {
            icon: "💰",
            title: "Laporan Keuangan",
            desc: "Estimasi biaya, realisasi pengadaan, dan analisis efisiensi anggaran per periode",
            format: "keuangan",
          },
        ].map((r, i) => (
          <div key={i} className="report-card">
            <div className="report-icon-big">{r.icon}</div>
            <div className="report-title">{r.title}</div>
            <div className="report-desc">{r.desc}</div>
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "center",
                marginTop: 16,
              }}
            >
              <button
                className="btn btn-primary btn-sm"
                onClick={() => exportData(r.format, "csv")}
              >
                📤 CSV/Excel
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => exportData(r.format, "pdf")}
              >
                📄 PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Panduan Integrasi Sistem Pemerintah */}
      <div className="card">
        <div className="card-header">
          <div className="ch-title">🔗 Integrasi SIPGN & Portal Dialur BGN</div>
        </div>
        <div className="card-body">
          <AlertBox type="info" style={{ marginBottom: 12 }}>
            <div>
              <strong>Instruksi Import ke SIPGN:</strong>
              <br />
              1. Export laporan dalam format CSV dari tombol di atas
              <br />
              2. Buka SIPGN → menu Import Data → pilih file CSV
              <br />
              3. Sesuaikan mapping kolom sesuai format SIPGN
              <br />
              4. Validasi data sebelum submit final
            </div>
          </AlertBox>
          <AlertBox type="info">
            <div>
              <strong>Instruksi Copy-Paste ke Portal Dialur:</strong>
              <br />
              1. Buka file CSV hasil export dengan Excel/Google Sheets
              <br />
              2. Salin data sesuai format yang diminta portal Dialur
              <br />
              3. Paste langsung di form input portal Dialur BGN
            </div>
          </AlertBox>
        </div>
      </div>
    </div>
  );
}
