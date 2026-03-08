// File: src/pages/CycleMenuPage.tsx
import { useState, useEffect } from "react";
import { supabase } from "../config/supabaseClient";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export default function CycleMenuPage() {
  const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
  const [week, setWeek] = useState(1);
  const [loading, setLoading] = useState(true);

  // State menu menggunakan struktur asli prototipe Anda
  const [menus, setMenus] = useState<Record<number, any[]>>({
    1: [],
    2: [],
    3: [],
    4: [],
  });

  const fetchCycleMenus = async () => {
    setLoading(true);

    // Mengambil data riil dari Supabase
    const { data: menuData, error: menuError } = await supabase
      .from("rencana_menu")
      .select("*")
      .order("created_at", { ascending: false });

    if (!menuError && menuData) {
      const mappedMenus: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [] };

      menuData.forEach((item, index) => {
        const hariIndex = index % 5;
        const hari = HARI[hariIndex];
        const weekIndex = Math.floor(index / 5) + 1;

        if (weekIndex <= 4) {
          let kal = 0,
            protein = 0,
            karbo = 0,
            lemak = 0,
            serat = 0;
          let laukArr: string[] = [];
          let buahArr: string[] = [];

          const buahKeywords = [
            "pisang",
            "pepaya",
            "jeruk",
            "semangka",
            "melon",
            "mangga",
            "apel",
          ];

          // EKSTRAKSI DATA YANG BENAR: Loop semua jadwal makan (Sarapan s/d Snack)
          if (item.data_menu) {
            Object.values(item.data_menu).forEach((mealArray: any) => {
              if (Array.isArray(mealArray)) {
                mealArray.forEach((m: any) => {
                  // Agregasi Total Gizi
                  kal += m.energi || 0;
                  protein += m.protein || 0;
                  karbo += m.karbo || 0;
                  lemak += m.lemak || 0;
                  serat += m.serat || 0;

                  // Pemisahan Lauk vs Buah
                  const namaLower = (m.nama || "").toLowerCase();
                  const isBuah =
                    m.kategori === "Buah" ||
                    buahKeywords.some((bk) => namaLower.includes(bk));

                  if (isBuah) {
                    if (!buahArr.includes(m.nama)) buahArr.push(m.nama);
                  } else {
                    if (!laukArr.includes(m.nama)) laukArr.push(m.nama);
                  }
                });
              }
            });
          }

          // Format agar nama lauk tidak merusak kartu (maks 4 bahan)
          const laukText =
            laukArr.length > 0
              ? laukArr.slice(0, 4).join(", ") +
              (laukArr.length > 4 ? ", dll" : "")
              : "Lauk belum ditentukan";

          const buahText =
            buahArr.length > 0 ? buahArr.join(", ") : "Buah Musim";

          mappedMenus[weekIndex].push({
            id: item.id,
            hari: hari,
            nama: item.nama_paket || `Menu ${hari}`,
            lauk: laukText,
            buah: buahText,
            kal: Math.round(kal),
            protein: Math.round(protein),
            karbo: Math.round(karbo),
            lemak: Math.round(lemak),
            serat: Math.round(serat),
            kelompok_sasaran: item.kelompok_sasaran, // Tambahan untuk Kop
            raw_data: item.data_menu // Menyimpan detail bahan mentah untuk Export
          });
        }
      });

      // Jika hasil mapping kosong, biarkan kosong, jika ada isi, timpa state
      setMenus(mappedMenus);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCycleMenus();
  }, []);

  const handleDelete = async (id: string, namaMenu: string) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus menu "${namaMenu}" secara permanen?`,
      )
    ) {
      const { error } = await supabase
        .from("rencana_menu")
        .delete()
        .eq("id", id);
      if (!error) {
        fetchCycleMenus();
      } else {
        alert("Gagal menghapus data: " + error.message);
      }
    }
  };

  const cur = menus[week] || [];
  const avgKal = cur.length
    ? Math.round(cur.reduce((a, m) => a + m.kal, 0) / cur.length)
    : 0;

  // --- FUNGSI EKSPOR SIKLUS MENU MINGGUAN ---
  const handleExportSiklusExcel = async () => {
    if (cur.length === 0) {
      alert("Tidak ada data menu pada minggu ini untuk diekspor.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Siklus Menu Minggu ${week}`, {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
    });

    // --- KOP SURAT ---
    sheet.mergeCells("A1:K1");
    sheet.getCell("A1").value = `LAPORAN SIKLUS MENU MAKAN BERGIZI GRATIS (MBG) — MINGGU KE-${week}`;
    sheet.getCell("A1").font = { bold: true, size: 14 };
    sheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };

    sheet.mergeCells("A2:L2");
    // Ambil semua kelomok sasaran yang unik dari menu minggu ini
    const sasaranList = Array.from(new Set(cur.map((c: any) => c.kelompok_sasaran).filter(Boolean)));
    const sasaranMode = sasaranList.length > 0 ? sasaranList.join(", ") : "Umum";
    const porsiTag = avgKal >= 500 ? "Porsi Besar" : "Porsi Kecil";
    sheet.getCell("A2").value = `Penerima Manfaat: ${sasaranMode} (${porsiTag})`;
    sheet.getCell("A2").font = { bold: true, size: 12, italic: true, color: { argb: "FF475569" } };
    sheet.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };

    sheet.addRow([]); // Space

    // --- FUNGSI HELPER UNTUK MEMBANGUN TABEL PER HARI ---
    const buildDailyTable = (menuHari: any) => {
      // 1. Judul Hari
      sheet.addRow([]);
      const subHeaderRow = sheet.addRow([`HARI: ${menuHari.hari.toUpperCase()} — ${menuHari.nama}`]);
      sheet.mergeCells(`A${subHeaderRow.number}:J${subHeaderRow.number}`);
      subHeaderRow.getCell(1).font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
      subHeaderRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } }; // Biru dongker
      subHeaderRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };

      // 2. Header Kolom Rincian
      const headerRow = sheet.addRow([
        "No", "Nama Hidangan", "Berat Kotor (g)", "Berat Bersih (g)", "Energi (kkal)", "Protein (g)", "Lemak (g)", "Karbo (g)", "Harga/Kg (Rp)", "Cost Bahan (Rp)"
      ]);
      headerRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
        cell.font = { bold: true, size: 11 };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      });

      // 3. Ekstraksi Item Bahan dari raw_data
      const rawMenu = menuHari.raw_data;
      let items: any[] = [];
      if (rawMenu) {
        Object.values(rawMenu).forEach((mealArray: any) => {
          if (Array.isArray(mealArray)) items = [...items, ...mealArray];
        });
      }

      if (items.length === 0) {
        const trRow = sheet.addRow(["", "Tidak ada rincian bahan makanan", "", "", "", "", "", "", "", ""]);
        sheet.mergeCells(`B${trRow.number}:J${trRow.number}`);
        trRow.font = { italic: true };
        return;
      }

      // 4. Isi Data Tabel Hari Itu
      let tE = 0, tP = 0, tL = 0, tK = 0, tCost = 0;

      // State tracking untuk merge cells
      let lastHidangan = "";
      let mergeStartRow = -1;

      items.forEach((m: any, idx: number) => {
        const pTotal = m.protein || 0;

        tE += m.energi || 0; tP += pTotal;
        tL += m.lemak || 0; tK += m.karbo || 0; tCost += m.cost || 0;

        let hidanganName = m.hidangan || m.kategori || "-";
        if (!m.hidangan) {
          if (m.kategori === "Makanan Pokok") hidanganName = "Nasi / Pengganti";
          else if (m.kategori === "Sayuran") hidanganName = "Sayur";
        }

        const row = sheet.addRow([
          idx + 1,
          hidanganName,
          Number(m.berat_kotor || 0).toFixed(1),
          Number(m.gram || 0),
          Number(m.energi || 0).toFixed(1),
          Number(pTotal).toFixed(1),
          Number(m.lemak || 0).toFixed(1),
          Number(m.karbo || 0).toFixed(1),
          Number(m.harga_kg || 0),
          Number(m.cost || 0).toFixed(2)
        ]);

        const currentRowNum = row.number;

        // Logika Merge Cell Header (Nama Hidangan ada di Kolom 2 / B)
        if (hidanganName !== lastHidangan) {
          // Jika berganti nilai, merge yang sebelumnya jika > 1 baris
          if (mergeStartRow !== -1 && (currentRowNum - 1) > mergeStartRow) {
            sheet.mergeCells(`B${mergeStartRow}:B${currentRowNum - 1}`);
          }
          // Set awal blok baru
          mergeStartRow = currentRowNum;
          lastHidangan = hidanganName;
        }

        row.eachCell((cell) => {
          cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
          cell.alignment = { vertical: "middle" };
        });

        row.getCell(3).numFmt = '0.0';  // B.Kotor
        row.getCell(4).numFmt = '#,##0'; // B.Bersih
        row.getCell(5).numFmt = '0.0';  // E
        row.getCell(6).numFmt = '0.0';  // P
        row.getCell(7).numFmt = '0.0';  // L
        row.getCell(8).numFmt = '0.0'; // K
        row.getCell(9).numFmt = '#,##0'; // Harga Kg
        row.getCell(10).numFmt = '#,##0.00'; // Cost
      });

      // Merge untuk blok terakhir (jika ada) di akhir loop
      if (mergeStartRow !== -1 && (sheet.rowCount) > mergeStartRow) {
        sheet.mergeCells(`B${mergeStartRow}:B${sheet.rowCount}`);
      }

      // 5. Total Harian
      const finalCostHarian = tCost * 1.1; // margin+bumbu
      const totalRow = sheet.addRow([
        "", "TOTAL BIAYA BAHAN PER PORSI", "", "", tE.toFixed(1), tP.toFixed(1), tL.toFixed(1), tK.toFixed(1), "", tCost.toFixed(2)
      ]);
      sheet.mergeCells(`B${totalRow.number}:D${totalRow.number}`);
      totalRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      });
      // Baris Rangkuman Anggaran + Bumbu 10%
      const estimasiRow = sheet.addRow([
        "", "ESTIMASI TOTAL HARGA (+10% Bumbu & Margin):", "", "", "", "", "", "", "", `Rp ${finalCostHarian.toLocaleString("id-ID", { minimumFractionDigits: 2 })}`
      ]);
      sheet.mergeCells(`B${estimasiRow.number}:I${estimasiRow.number}`);
      estimasiRow.getCell(2).font = { bold: true, italic: true };
      estimasiRow.getCell(10).font = { bold: true, color: { argb: "FF047857" } };
    };

    // --- LOOP PEMBUATAN TABEL HARI (SENIN - JUMAT) ---
    // Karena 'cur' mungkin tidak urut hari, kita sort sesuai array HARI
    const sortedCur = [...cur].sort((a, b) => HARI.indexOf(a.hari) - HARI.indexOf(b.hari));
    sortedCur.forEach((harianMenu) => {
      buildDailyTable(harianMenu);
    });

    // --- Atur Lebar Kolom Murni (Landscape Friendly) ---
    sheet.columns = [
      { width: 5 },   // No
      { width: 35 },  // Kategori
      { width: 14 },  // B.Kotor
      { width: 14 },  // B.Bersih
      { width: 14 },  // E
      { width: 14 },  // P
      { width: 14 },  // L
      { width: 14 },  // K
      { width: 22 },  // Harga/Kg
      { width: 22 }   // Cost
    ];

    // --- GENERATE FILE EXCEL ---
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const filename = `Laporan_Siklus_Menu_M${week}_MBG.xlsx`;
    saveAs(blob, filename);
  };

  return (
    <div>
      <div className="topbar">
        <div className="tb-bread">
          SiGizi MBG / <span>Siklus Menu</span>
        </div>
      </div>
      <div className="ph">
        <div className="ph-title">Siklus Menu</div>
        <div className="ph-sub">
          Rencana menu harian MBG dengan validasi AKG otomatis (Terhubung Database)
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div className="ftabs">
          {[1, 2, 3, 4].map((w) => (
            <div
              key={w}
              className={`ftab ${week === w ? "active" : ""}`}
              onClick={() => setWeek(w)}
            >
              Minggu {w}
            </div>
          ))}
        </div>
        <div>
          <button
            className="btn btn-secondary btn-sm"
            style={{ marginRight: 8 }}
            onClick={fetchCycleMenus}
          >
            🔄 Segarkan Data
          </button>
          <button
            className="btn btn-sm"
            style={{ marginRight: 8, background: "#10b981", color: "white", border: "1px solid #059669" }}
            title="Ekspor Laporan Format Landscape Senin-Jumat"
            onClick={handleExportSiklusExcel}
            disabled={cur.length === 0}
          >
            📊 Ekspor Siklus Menu
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => alert("Gunakan Halaman 'Susun Menu MBG' dari menu Sidebar untuk mengkreasikan dan menyimpan menu baru, lalu Menu tersebut akan otomatis tersimpan dalam siklus ini.")}
            title="Tambah menu melalui kalkulator FNCA"
          >
            ＋ Tambah Menu
          </button>
        </div>
      </div>

      {loading ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "var(--txt3)",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          ⏳ Memuat data dari server Supabase...
        </div>
      ) : cur.length === 0 ? (
        <div className="empty">
          Belum ada menu untuk minggu ini. Silakan racik dan simpan menu dari
          FNCA Kalkulator.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 12,
            marginBottom: 18,
          }}
        >
          {cur.map((m, i) => (
            <div
              key={i}
              style={{
                background: "#fff",
                borderRadius: 12,
                border: "1px solid var(--border)",
                padding: 14,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--g3)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 7,
                }}
              >
                {m.hari}
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 5 }}>
                {m.nama}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--txt2)",
                  lineHeight: 1.6,
                  flexGrow: 1,
                }}
              >
                {m.lauk}
              </div>
              <div style={{ fontSize: 12, color: "var(--txt3)", marginTop: 8 }}>
                🍌 {m.buah}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 12,
                }}
              >
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div style={{ fontWeight: 800, color: "var(--g3)", fontSize: 13 }}>
                    {m.kal} kkal
                  </div>
                  <div style={{ fontSize: 10, color: "var(--txt3)", fontWeight: 600 }}>
                    (P:{m.protein} L:{m.lemak} K:{m.karbo})
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
                {/* Edit route switch if strictly necessary, but simple alert or setEdit mode is fine for now; 
                    delete already wired to handleDelete */}
                <button
                  className="btn-icon-sq"
                  style={{ fontSize: 12 }}
                  onClick={() => alert("Gunakan halaman Susun Menu untuk memodifikasi menu ini.")}
                  title="Edit Menu"
                >
                  ✏️
                </button>
                <button
                  className="btn-icon-sq del"
                  style={{ fontSize: 12 }}
                  onClick={() => handleDelete(m.id, m.nama)}
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && cur.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="ch-title">📊 Rekap Nutrisi Minggu {week}</div>
          </div>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>Hari</th>
                  <th>Menu</th>
                  <th>Kalori</th>
                  <th>Protein</th>
                  <th>Karbo</th>
                  <th>Lemak</th>
                  <th>Serat</th>
                  <th>Validasi 4 Komponen</th>
                </tr>
              </thead>
              <tbody>
                {cur.map((m, i) => {
                  // Validasi sederhana: Jika protein, karbo, dan lemak > 0 maka lengkap
                  const isLengkap = m.protein > 0 && m.karbo > 0 && m.lemak > 0;
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 700 }}>{m.hari}</td>
                      <td>{m.nama}</td>
                      <td style={{ fontWeight: 700, color: "var(--g3)" }}>
                        {m.kal} kkal
                      </td>
                      <td>{m.protein}g</td>
                      <td>{m.karbo}g</td>
                      <td>{m.lemak}g</td>
                      <td>{m.serat}g</td>
                      <td>
                        {isLengkap ? (
                          <span className="badge b-green">✅ Lengkap</span>
                        ) : (
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              background: "#fef2f2",
                              color: "#991b1b",
                            }}
                          >
                            ⚠️ Cek FNCA
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ background: "var(--cream)", fontWeight: 700 }}>
                  <td colSpan={2}>Total</td>
                  <td style={{ color: "var(--g3)" }}>
                    {cur.reduce((a, m) => a + m.kal, 0)} kkal
                  </td>
                  <td>{cur.reduce((a, m) => a + m.protein, 0)}g</td>
                  <td>{cur.reduce((a, m) => a + m.karbo, 0)}g</td>
                  <td>{cur.reduce((a, m) => a + m.lemak, 0)}g</td>
                  <td>{cur.reduce((a, m) => a + m.serat, 0)}g</td>
                  <td>Rata-rata {avgKal} kkal/hari</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
