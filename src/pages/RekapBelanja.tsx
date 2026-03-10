// File: src/pages/RekapBelanja.tsx
import { useState, useEffect } from "react";
import { supabase } from "../config/supabaseClient";
import { useUI } from "../contexts/UIContext";

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

export default function RekapBelanja() {
  const { showToast } = useUI();
  const [menus, setMenus] = useState<SavedMenu[]>([]);
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  // Hitung Total Uang Belanja Keseluruhan
  const totalEstimasiRAB = rekapHasil.reduce((acc, item) => {
    const kebutuhanRealGram = item.total_berat_kotor_gram * jumlahPenerima * (1 + (bufferPercent / 100));
    const kebutuhanKg = kebutuhanRealGram / 1000;
    return acc + (kebutuhanKg * item.harga_kg);
  }, 0);

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
            <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>👥 Jumlah Penerima (Siswa)</label>
            <input type="number" value={jumlahPenerima} onChange={e => setJumlahPenerima(Number(e.target.value))} style={{ width: "100%", padding: 10, marginTop: 6, borderRadius: 8, border: "1px solid #cbd5e1" }} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>📦 Cadangan / Buffer (%)</label>
            <input type="number" value={bufferPercent} onChange={e => setBufferPercent(Number(e.target.value))} style={{ width: "100%", padding: 10, marginTop: 6, borderRadius: 8, border: "1px solid #cbd5e1" }} />
          </div>

          <h3 style={{ marginTop: 0, fontSize: 15, borderBottom: "1px solid #e2e8f0", paddingBottom: 12 }}>2. Pilih Menu (Siklus)</h3>
          {isLoading ? <p style={{ fontSize: 13 }}>Memuat daftar menu...</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 400, overflowY: "auto" }}>
              {menus.length === 0 && <p style={{ fontSize: 13, color: "#94a3b8" }}>Belum ada menu yang berstatus Valid.</p>}
              {menus.map(menu => (
                <label key={menu.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: 12, background: selectedMenuIds.includes(menu.id) ? "#f0fdf4" : "#f8fafc", border: `1px solid ${selectedMenuIds.includes(menu.id) ? "#bbf7d0" : "#e2e8f0"} `, borderRadius: 8, cursor: "pointer" }}>
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
            <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>📄 Daftar Pesanan Supplier</h3>
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
                const subtotal = kebutuhanKg * item.harga_kg;

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
            <div style={{ padding: 20, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => showToast("Fitur Ekspor PDF/Excel bisa kita tambahkan di sini!", "info")} style={{ background: "#0f172a", color: "#fff", padding: "12px 24px", borderRadius: 8, fontWeight: 700, border: "none", cursor: "pointer" }}>
                🖨️ Cetak Daftar Belanja
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}