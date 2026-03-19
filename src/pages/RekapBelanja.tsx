import { useState, useEffect } from "react";
import { supabase } from "../config/supabaseClient";
import { useUI } from "../contexts/UIContext";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface SavedMenu {
  id: string;
  nama_paket: string;
  kelompok_sasaran: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data_menu: any;
  status: string;
}

interface RekapItem {
  kode: string;
  nama: string;
  total_berat_kotor_gram: number; // Total gram sebelum dikali anak & buffer
  harga_kg: number;
}

export default function RekapBelanja({ user }: { user: any }) {
  const { showToast } = useUI();
  const [menus, setMenus] = useState<SavedMenu[]>([]);
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Parameter Logistik Global
  const [jumlahPenerima, setJumlahPenerima] = useState<number>(100);
  const [bufferPercent, setBufferPercent] = useState<number>(5);

  // Tarik data menu dari database saat halaman dibuka
  useEffect(() => {
    const fetchMenus = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from("rencana_menu")
        .select("*")
        .eq("status", "approved") // Hanya tarik menu yang sudah Valid
        .order("created_at", { ascending: false });

      if (data) setMenus(data as SavedMenu[]);
      setIsLoading(false);
    };
    fetchMenus();
  }, []);

  // Handle Checkbox Pilihan Menu
  const toggleMenuSelection = (id: string) => {
    if (selectedMenuIds.includes(id)) {
      setSelectedMenuIds(selectedMenuIds.filter(menuId => menuId !== id));
    } else {
      setSelectedMenuIds([...selectedMenuIds, id]);
    }
  };

  // MESIN AGREGASI (Menjumlahkan semua bahan dari menu yang dipilih)
  const generateRekap = () => {
    const rekapMap: Record<string, RekapItem> = {};

    selectedMenuIds.forEach(id => {
      const menu = menus.find(m => m.id === id);
      if (!menu || !menu.data_menu) return;

      // Mengambil rincian bahan dari 'Makan Siang' (Sesuai format simpan kita sebelumnya)
      const items = menu.data_menu['Makan Siang'] || [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items.forEach((item: any) => {
        if (!rekapMap[item.kode]) {
          rekapMap[item.kode] = {
            kode: item.kode,
            nama: item.nama,
            total_berat_kotor_gram: 0,
            harga_kg: item.harga_kg || 25000,
          };
        }
        // Menjumlahkan berat kotor per porsi dari berbagai menu
        rekapMap[item.kode].total_berat_kotor_gram += (item.berat_kotor || item.gram);
      });
    });

    return Object.values(rekapMap).sort((a, b) => a.nama.localeCompare(b.nama));
  };

  const rekapHasil = generateRekap();

  // Hitung Total Uang Belanja Keseluruhan (Dibulatkan ke Rupiah terdekat)
  const totalEstimasiRAB = Math.round(rekapHasil.reduce((acc, item) => {
    const kebutuhanRealGram = item.total_berat_kotor_gram * jumlahPenerima * (1 + (bufferPercent / 100));
    const kebutuhanKg = kebutuhanRealGram / 1000;
    return acc + (kebutuhanKg * item.harga_kg);
  }, 0));

  // --- FUNGSI EKSPOR EXCEL ---
  const handleExportExcel = async () => {
    if (rekapHasil.length === 0) return;
    setIsExporting(true);

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Rekap Belanja");

      // Styling Header
      worksheet.mergeCells("A1:D1");
      const titleCell = worksheet.getCell("A1");
      titleCell.value = "LAPORAN REKAP BELANJA LOGISTIK MBG";
      titleCell.font = { name: "Arial", size: 14, bold: true };
      titleCell.alignment = { vertical: "middle", horizontal: "center" };

      worksheet.mergeCells("A2:D2");
      const subTitleCell = worksheet.getCell("A2");
      subTitleCell.value = `Instansi: ${user?.nama_sppg_instansi || "Umum"} | Tanggal: ${new Date().toLocaleDateString("id-ID")}`;
      subTitleCell.font = { name: "Arial", size: 10 };
      subTitleCell.alignment = { vertical: "middle", horizontal: "center" };

      // Parameter Info
      worksheet.addRow([]);
      worksheet.addRow(["PARAMETER LOGISTIK"]);
      worksheet.addRow(["Jumlah Siswa:", `${jumlahPenerima} Anak`]);
      worksheet.addRow(["Buffer Cadangan:", `${bufferPercent}%`]);
      worksheet.addRow(["Total Menu Gabungan:", `${selectedMenuIds.length} Menu`]);
      worksheet.addRow([]);

      // Table Header
      const headerRow = worksheet.addRow(["NAMA BAHAN", "KEBUTUHAN (KG)", "HARGA SATUAN (RP)", "SUBTOTAL (RP)"]);
      headerRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1C4D32" } };
        cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      });

      // Data Rows
      rekapHasil.forEach(item => {
        const kebKg = (item.total_berat_kotor_gram * jumlahPenerima * (1 + (bufferPercent / 100))) / 1000;
        const subtotal = Math.round(kebKg * item.harga_kg);
        const row = worksheet.addRow([item.nama, kebKg.toFixed(2), item.harga_kg, subtotal]);
        row.eachCell((cell, colNumber) => {
          cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
          // Format angka untuk kolom Harga Satuan (3) dan Subtotal (4)
          if (colNumber >= 3) {
            cell.numFmt = "#,##0";
          }
        });
      });

      // Summary Row
      const footerRow = worksheet.addRow(["TOTAL ESTIMASI BELANJA", "", "", totalEstimasiRAB]);
      worksheet.mergeCells(`A${footerRow.number}:C${footerRow.number}`);
      footerRow.getCell(4).font = { bold: true };
      footerRow.getCell(4).numFmt = "#,##0";
      footerRow.getCell(1).alignment = { horizontal: "right" };

      // Signature Area
      worksheet.addRow([]);
      worksheet.addRow([]);
      const signRow = worksheet.addRow(["", "", "Petugas Penanggung Jawab,"]);
      worksheet.mergeCells(`C${signRow.number}:D${signRow.number}`);
      signRow.getCell(3).alignment = { horizontal: "center" };

      worksheet.addRow([]);
      worksheet.addRow([]);
      worksheet.addRow([]);

      const nameRow = worksheet.addRow(["", "", user?.nama_lengkap || "AHLI GIZI"]);
      worksheet.mergeCells(`C${nameRow.number}:D${nameRow.number}`);
      nameRow.getCell(3).font = { bold: true, underline: true };
      nameRow.getCell(3).alignment = { horizontal: "center" };

      const instRow = worksheet.addRow(["", "", user?.nama_sppg_instansi || "INTANSI"]);
      worksheet.mergeCells(`C${instRow.number}:D${instRow.number}`);
      instRow.getCell(3).font = { size: 9 };
      instRow.getCell(3).alignment = { horizontal: "center" };

      // Set Column Widths
      worksheet.getColumn(1).width = 35;
      worksheet.getColumn(2).width = 20;
      worksheet.getColumn(3).width = 20;
      worksheet.getColumn(4).width = 20;

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Rekap_Belanja_${user?.nama_sppg_instansi || 'SiGizi'}_${Date.now()}.xlsx`);
      showToast("Berhasil mengekspor Excel!", "success");
    } catch (err: any) {
      showToast("Gagal ekspor: " + err.message, "error");
    } finally {
      setIsExporting(false);
    }
  };

  // --- FUNGSI EKSPOR PDF ---
  const handleExportPDF = () => {
    if (rekapHasil.length === 0) return;
    setIsExporting(true);

    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(16);
      doc.setTextColor(28, 77, 50); // Hijau Tua
      doc.text("REKAP BELANJA LOGISTIK MBG", 105, 20, { align: "center" });

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Instansi: ${user?.nama_sppg_instansi || "Umum"}`, 105, 27, { align: "center" });
      doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, 105, 32, { align: "center" });

      // Parameter Box
      doc.setFillColor(248, 250, 252);
      doc.rect(14, 40, 182, 20, "F");
      doc.setFontSize(9);
      doc.setTextColor(50);
      doc.text(`Jumlah Penerima: ${jumlahPenerima} Anak`, 20, 47);
      doc.text(`Buffer Cadangan: ${bufferPercent}%`, 20, 54);
      doc.text(`Variasi Menu: ${selectedMenuIds.length} Paket`, 100, 47);
      doc.text(`Mata Uang: Rupiah (IDR)`, 100, 54);

      // Table
      const tableData = rekapHasil.map(item => {
        const kebKg = (item.total_berat_kotor_gram * jumlahPenerima * (1 + (bufferPercent / 100))) / 1000;
        const subtotal = Math.round(kebKg * item.harga_kg);
        return [
          item.nama,
          `${kebKg.toFixed(2)} Kg`,
          `Rp ${item.harga_kg.toLocaleString("id-ID")}`,
          `Rp ${subtotal.toLocaleString("id-ID")}`
        ];
      });

      autoTable(doc, {
        startY: 65,
        head: [["NAMA BAHAN", "KEBUTUHAN", "HARGA/KG", "SUBTOTAL"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [28, 77, 50] },
        foot: [[
          { content: "TOTAL ESTIMASI ANGGARAN", colSpan: 3, styles: { halign: "right", fontStyle: "bold" } },
          { content: `Rp ${totalEstimasiRAB.toLocaleString("id-ID")}`, styles: { fontStyle: "bold", fillColor: [220, 252, 231], textColor: [22, 101, 52] } }
        ]],
        styles: { fontSize: 9 }
      });

      // Signature
      const finalY = ((doc as any).lastAutoTable?.finalY || 150) + 15;
      doc.setFontSize(10);
      doc.text("Petugas Penanggung Jawab,", 140, finalY);
      doc.setFont("helvetica", "bold");
      doc.text(user?.nama_lengkap || "AHLI GIZI", 140, finalY + 25);
      doc.setFont("helvetica", "normal");
      doc.setLineWidth(0.5);
      doc.line(140, finalY + 26, 185, finalY + 26);
      doc.setFontSize(8);
      doc.text(user?.nama_sppg_instansi || "Instansi", 140, finalY + 30);

      doc.save(`Rekap_Belanja_${user?.nama_sppg_instansi || "SiGizi"}_${Date.now()}.pdf`);
      showToast("Berhasil mengekspor PDF!", "success");
    } catch (err: any) {
      showToast("Gagal ekspor PDF: " + err.message, "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "auto", fontFamily: "Inter, sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 8px 0", color: "#1e293b" }}>🛒 Rekap Belanja Logistik (Supplier)</h2>
        <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>Gabungkan beberapa menu menjadi satu daftar pesanan otomatis dalam satuan Kilogram.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24, alignItems: "start" }}>

        {/* PANEL KIRI: Pilihan Menu & Parameter */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 20 }}>
          <h3 style={{ marginTop: 0, fontSize: 15, borderBottom: "1px solid #e2e8f0", paddingBottom: 12 }}>1. Parameter Logistik</h3>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>👥 Jumlah Penerima (Siswa)</label>
            <input type="number" value={jumlahPenerima} onChange={e => setJumlahPenerima(Number(e.target.value))} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", outline: "none" }} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>📦 Cadangan / Buffer (%)</label>
            <input type="number" value={bufferPercent} onChange={e => setBufferPercent(Number(e.target.value))} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", outline: "none" }} />
          </div>

          <h3 style={{ marginTop: 0, fontSize: 15, borderBottom: "1px solid #e2e8f0", paddingBottom: 12 }}>2. Pilih Menu (Siklus)</h3>
          {isLoading ? <p style={{ fontSize: 13 }}>Memuat daftar menu...</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 400, overflowY: "auto", paddingRight: 4 }}>
              {menus.length === 0 && <p style={{ fontSize: 13, color: "#94a3b8" }}>Belum ada menu yang berstatus Valid.</p>}
              {menus.map(menu => (
                <label key={menu.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: 12, background: selectedMenuIds.includes(menu.id) ? "#f0fdf4" : "#f8fafc", border: `1px solid ${selectedMenuIds.includes(menu.id) ? "#bbf7d0" : "#e2e8f0"} `, borderRadius: 8, cursor: "pointer", transition: "all 0.2s" }}>
                  <input type="checkbox" checked={selectedMenuIds.includes(menu.id)} onChange={() => toggleMenuSelection(menu.id)} style={{ marginTop: 4 }} />
                  <div>
                    <strong style={{ display: "block", fontSize: 13, color: "#0f172a" }}>{menu.nama_paket}</strong>
                    <span style={{ fontSize: 11, color: "#64748b" }}>Sasaran: {menu.kelompok_sasaran}</span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* PANEL KANAN: Hasil Rekap Belanja */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>📄 Daftar Pesanan Supplier {selectedMenuIds.length > 0 && `(${selectedMenuIds.length} Menu)`}</h3>
            <div style={{ background: "#dcfce7", color: "#166534", padding: "8px 16px", borderRadius: 8, fontWeight: 800, fontSize: 14 }}>
              Estimasi Uang: Rp {totalEstimasiRAB.toLocaleString("id-ID")}
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
            <thead style={{ background: "#fff", color: "#64748b", borderBottom: "2px solid #e2e8f0" }}>
              <tr>
                <th style={{ padding: "16px 24px" }}>NAMA BAHAN</th>
                <th>KEBUTUHAN (KG)</th>
                <th>HARGA/KG</th>
                <th>SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              {rekapHasil.map(item => {
                // Rumus inti Logistik: (Gram Kotor * Jumlah Anak * Buffer) / 1000 = Kilogram
                const kebutuhanRealGram = item.total_berat_kotor_gram * jumlahPenerima * (1 + (bufferPercent / 100));
                const kebutuhanKg = kebutuhanRealGram / 1000;
                const subtotal = Math.round(kebutuhanKg * item.harga_kg);

                return (
                  <tr key={item.kode} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 24px", fontWeight: 600, color: "#334155" }}>{item.nama}</td>
                    <td style={{ color: "#2563eb", fontWeight: 800, fontSize: 14 }}>{kebutuhanKg.toFixed(2)} Kg</td>
                    <td>Rp {item.harga_kg.toLocaleString("id-ID")}</td>
                    <td style={{ fontWeight: 600, color: "#059669" }}>Rp {subtotal.toLocaleString("id-ID")}</td>
                  </tr>
                );
              })}
              {rekapHasil.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                    Silakan centang satu atau beberapa menu di panel kiri untuk melihat rekap belanja.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {rekapHasil.length > 0 && (
            <div style={{ padding: 20, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                disabled={isExporting}
                onClick={handleExportExcel}
                style={{ background: "#166534", color: "#fff", padding: "10px 20px", borderRadius: 8, fontWeight: 700, border: "none", cursor: isExporting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, opacity: isExporting ? 0.7 : 1 }}>
                📊 Ekspor Excel
              </button>
              <button
                disabled={isExporting}
                onClick={handleExportPDF}
                style={{ background: "#991b1b", color: "#fff", padding: "10px 20px", borderRadius: 8, fontWeight: 700, border: "none", cursor: isExporting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, opacity: isExporting ? 0.7 : 1 }}>
                📄 Ekspor PDF
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
