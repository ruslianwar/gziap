// File: src/pages/LaporanPage.tsx
import { useState } from "react";
import { AlertBox } from "../components/AlertBox";
import { useUI } from "../contexts/UIContext";
import { supabase } from "../config/supabaseClient";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export default function LaporanPage() {
  const { showToast } = useUI();
  const todayISO = new Date().toISOString().split("T")[0];
  const [periodeType, setPeriodeType] = useState("harian");
  const [tglDari, setTglDari] = useState(todayISO);
  const [tglSampai, setTglSampai] = useState(todayISO);
  const [isExporting, setIsExporting] = useState(false);

  // MESIN EKSPOR MULTI-KATEGORI (EXCEL RAAPI)
  const exportData = async (tipe: string, format: string) => {
    if (format !== "csv") {
      showToast(`Laporan format PDF untuk ${tipe} akan tersedia di sistem Back-End Pusat.`, "info");
      return;
    }

    setIsExporting(true);
    showToast(`Merakit lembar Excel: ${tipe.toUpperCase()}...`, "info");

    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(`Laporan ${tipe.toUpperCase()}`);

      // KOP SURAT UMUM
      sheet.mergeCells("A1:H1");
      sheet.getCell("A1").value = `LAPORAN SIGIZI MBG — KATEGORI: ${tipe.toUpperCase()}`;
      sheet.getCell("A1").font = { bold: true, size: 14 };
      sheet.getCell("A1").alignment = { horizontal: "center" };
      sheet.mergeCells("A2:H2");
      sheet.getCell("A2").value = `Periode Cetak: ${tglDari} s/d ${tglSampai}`;
      sheet.getCell("A2").font = { italic: true, color: { argb: "FF475569" } };
      sheet.getCell("A2").alignment = { horizontal: "center" };
      sheet.addRow([]);

      // KATEGORI 1: MENU & GIZI (TERHUBUNG SUPABASE SIKLUS MENU)
      if (tipe === "menu_gizi") {
        const { data: menuData } = await supabase.from("rencana_menu")
          .select("*")
          .gte("created_at", `${tglDari}T00:00:00Z`)
          .lte("created_at", `${tglSampai}T23:59:59Z`)
          .eq("status", "approved")
          .order("created_at", { ascending: true });

        const headerRow = sheet.addRow(["No", "Tgl Rencana", "Nama Siklus", "Sasaran", "Menu Siang", "Energi (kkal)", "Estimasi Bahan (Rp)", "St Verifikasi"]);
        headerRow.eachCell((c) => { c.font = { bold: true }; c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } }; });

        if (!menuData || menuData.length === 0) {
          sheet.addRow(["", "Tidak ada Menu MBG Valid di rentang tanggal ini.", "", "", "", "", ""]);
        } else {
          menuData.forEach((m, idx) => {
            let totalCost = 0;
            let mN = "Beragam Hidangan";
            if (m.data_menu) {
              const items = m.data_menu['Makan Siang'] || Object.values(m.data_menu)[0] || [];
              if (Array.isArray(items)) {
                items.forEach((item) => totalCost += Number(item.cost || 0));
                if (items[0]) mN = items[0].nama || mN;
              }
            }
            sheet.addRow([idx + 1, new Date(m.created_at).toLocaleDateString("id-ID"), m.nama_paket || "-", m.kelompok_sasaran || "-", mN + ", dll.", Math.round(m.total_kalori || 0), Math.round(totalCost * 1.1), "LULUS LENGKAP"]);
          });
        }
      }
      // KATEGORI 2: ANTROPOMETRI
      else if (tipe === "antro") {
        const hRow = sheet.addRow(["No", "Tgl Ukur", "NISN", "Nama Siswa", "Umur (Bln)", "BB (Kg)", "TB (Cm)", "LILA (Cm)", "Status Gizi", "Tindak Lanjut"]);
        hRow.eachCell((c) => { c.font = { bold: true }; c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } }; });
        sheet.addRow(["1", tglDari, "00129", "Siswa Prototipe", "124", "32.5", "135", "16", "Gizi Baik", "Lanjutkan Intervensi"]);
      }
      // KATEGORI 3: QC & FOOD SAFETY
      else if (tipe === "qc") {
        const hRow = sheet.addRow(["No", "Tgl Inspeksi", "Kode Sampel", "Petugas", "Suhu Matang (°C)", "Rasa", "Aroma", "Tekstur", "Keputusan", "Catatan"]);
        hRow.eachCell((c) => { c.font = { bold: true }; c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } }; });
        sheet.addRow(["1", tglDari, "FS-01-A", "Andi QA", "75", "Lulus", "Lulus", "Lulus", "Porsi Aman Distribusi", "Wajar"]);
      }
      // KATEGORI 4: DISTRIBUSI
      else if (tipe === "distribusi") {
        const hRow = sheet.addRow(["No", "Tanggal", "Tujuan Sekolah", "Armada", "Jam Berangkat", "Jam Tiba", "Porsi Rencana", "Porsi Realisasi", "Suhu Box (°C)"]);
        hRow.eachCell((c) => { c.font = { bold: true }; c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0F2FE" } }; });
        sheet.addRow(["1", tglDari, "SDN 1 Pusat", "Mobil Box A", "09:30", "10:15", "150", "150", "64"]);
      }
      // KATEGORI 5: STOK & INVENTARIS
      else if (tipe === "stok") {
        const hRow = sheet.addRow(["No", "Kode Barang", "Kategori", "Nama Bahan", "Stok Awal (Kg)", "Masuk (Kg)", "Keluar (Kg)", "Stok Akhir", "Rak/Gudang"]);
        hRow.eachCell((c) => { c.font = { bold: true }; c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFEDD5" } }; });
        sheet.addRow(["1", "B-001", "Pokok", "Beras Putih Medium", "500", "50", "120", "430", "Gudang Kering A"]);
      }
      // KATEGORI 6: KEUANGAN
      else if (tipe === "keuangan") {
        const hRow = sheet.addRow(["No", "Tanggal", "Ref. Transaksi", "Jenis", "Uraian", "Debet (Rp)", "Kredit (Rp)", "Saldo (Rp)"]);
        hRow.eachCell((c) => { c.font = { bold: true }; c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } }; });
        sheet.addRow(["1", tglDari, "INV-001", "Pengadaan", "Beli Beras 500Kg", "-", "6000000", "14000000"]);
      }

      // Format semua kolom
      sheet.columns.forEach(column => column.width = 18);

      // Simpan File
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, `Laporan_${tipe.toUpperCase()}_${tglDari}_sampai_${tglSampai}.xlsx`);

      showToast(`Laporan ${tipe.toUpperCase()} (.XLSX) Excel Rapi berhasil diunduh!`, "success");

    } catch (err: any) {
      showToast("Gagal Mengekstraksi Laporan Excel: " + err.message, "error");
    } finally {
      setIsExporting(false);
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
        ].map((r, i) => {
          const isAvailable = r.format === "menu_gizi"; // Hanya Menu Gizi yang hidup total
          const btnDisabled = isExporting || !isAvailable;

          return (
            <div key={i} className="report-card" style={{ opacity: isAvailable ? 1 : 0.65 }}>
              <div className="report-icon-big">{r.icon}</div>
              <div className="report-title">{r.title}</div>
              <div className="report-desc">{r.desc}</div>
              {/* Petunjuk Visual untuk Modul Non-aktif */}
              {!isAvailable && (
                <div style={{ fontSize: 11, color: "var(--red)", fontWeight: 600, textAlign: "center", marginTop: 8 }}>
                  Modul Belum Dirilis
                </div>
              )}
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
                  disabled={btnDisabled}
                  style={{ opacity: btnDisabled ? 0.6 : 1, cursor: btnDisabled ? 'not-allowed' : 'pointer' }}
                >
                  {isExporting && isAvailable ? "⏳" : "📤"} {isAvailable ? "Excel (.xlsx)" : "Terkunci"}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => exportData(r.format, "pdf")}
                  disabled={btnDisabled}
                  style={{ opacity: btnDisabled ? 0.6 : 1, cursor: btnDisabled ? 'not-allowed' : 'pointer' }}
                >
                  📄 PDF
                </button>
              </div>
            </div>
          );
        })}
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
