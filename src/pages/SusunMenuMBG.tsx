// File: src/pages/SusunMenuMBG.tsx
import { useState, useRef, useEffect } from "react";
import { supabase } from "../config/supabaseClient";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- TYPESCRIPT INTERFACES ---
interface MenuItem {
  id: string;
  kode: string;
  nama: string;
  kategori: string; // Komponen Isi Piringku
  sumber_data?: string;
  gram: number;
  berat_kotor: number;
  harga_kg: number;
  cost: number;
  energi: number;
  protein: number;
  lemak: number;
  karbo: number;
  fe: number;
  vitA: number;
  ca: number;
  zn: number;
  vitC: number;
}

interface TkpiItem {
  kode: string;
  nama: string;
  sumber?: string;
  bdd?: string | number | null;
  energi?: string | number | null;
  protein?: string | number | null;
  lemak?: string | number | null;
  karbohidrat?: string | number | null;
  besi?: string | number | null;
  retinol?: string | number | null;
  karoten_total?: string | number | null;
  kalsium?: string | number | null;
  seng?: string | number | null;
  vitamin_c?: string | number | null;
  [key: string]: string | number | null | undefined;
}

interface TargetGroup {
  label: string;
  waktu: string;
  akgMin: number;
  akgMax: number;
  minE: number;
  maxE: number;
  minP: number;
  maxP: number;
  minL: number;
  maxL: number;
  minK: number;
  maxK: number;
  budgetTarget: number;
}

interface SavedMenu {
  id: string;
  nama_paket: string;
  kelompok_sasaran: string;
  total_kalori: number;
  status: string;
  data_menu: Record<string, MenuItem[]>;
}

// --- STANDAR BAKU MBG (BERDASARKAN TABEL 2 JUKNIS BGN 2026 & PERMENKES 28/2019) ---
const TARGET_GROUPS: Record<string, TargetGroup> = {
  tk_paud: { label: "Siswa TK/PAUD/TK LB", waktu: "Pagi", akgMin: 20, akgMax: 25, minE: 280, maxE: 350, minP: 5.0, maxP: 6.3, minL: 10.0, maxL: 12.5, minK: 44.0, maxK: 55.0, budgetTarget: 8000 },
  sd_1_3: { label: "Siswa SD/MI/SDLB Kelas 1-3", waktu: "Pagi", akgMin: 20, akgMax: 25, minE: 330, maxE: 413, minP: 8.0, maxP: 10.0, minL: 11.0, maxL: 13.8, minK: 50.0, maxK: 62.5, budgetTarget: 8000 },
  sd_4_6: { label: "Siswa SD/MI/SDLB Kelas 4-6", waktu: "Siang", akgMin: 30, akgMax: 35, minE: 585, maxE: 683, minP: 15.8, maxP: 18.4, minL: 19.5, maxL: 22.8, minK: 87.0, maxK: 101.5, budgetTarget: 10000 },
  smp: { label: "Siswa SMP/MTs/SMPLB", waktu: "Siang", akgMin: 30, akgMax: 35, minE: 668, maxE: 779, minP: 20.3, maxP: 23.6, minL: 22.5, maxL: 26.3, minK: 97.5, maxK: 113.8, budgetTarget: 10000 },
  sma: { label: "Siswa SMA/SMK/MA/SMALB", waktu: "Siang", akgMin: 30, akgMax: 35, minE: 713, maxE: 831, minP: 21.0, maxP: 24.5, minL: 22.5, maxL: 26.3, minK: 105.0, maxK: 122.5, budgetTarget: 10000 },
  pendidik: { label: "Pendidik / Tenaga Kependidikan", waktu: "Siang", akgMin: 30, akgMax: 35, minE: 713, maxE: 831, minP: 21.0, maxP: 24.5, minL: 22.5, maxL: 26.3, minK: 105.0, maxK: 122.5, budgetTarget: 10000 },
  balita_siang: { label: "Anak Balita (Siang)", waktu: "Siang", akgMin: 30, akgMax: 35, minE: 405, maxE: 473, minP: 6.0, maxP: 7.0, minL: 13.5, maxL: 15.8, minK: 64.5, maxK: 75.3, budgetTarget: 8000 },
  balita_pagi: { label: "Anak Balita 13-59 bln (Pagi)", waktu: "Pagi", akgMin: 20, akgMax: 25, minE: 270, maxE: 338, minP: 4.0, maxP: 5.0, minL: 9.0, maxL: 11.3, minK: 43.0, maxK: 53.8, budgetTarget: 8000 },
  bayi_siang: { label: "Balita 6-11 bulan (Siang)", waktu: "Siang", akgMin: 30, akgMax: 35, minE: 240, maxE: 280, minP: 4.5, maxP: 5.2, minL: 10.5, maxL: 12.2, minK: 31.5, maxK: 36.7, budgetTarget: 8000 },
  ibu_hamil: { label: "Ibu Hamil", waktu: "Siang", akgMin: 30, akgMax: 35, minE: 753, maxE: 879, minP: 22.1, maxP: 25.8, minL: 20.2, maxL: 23.6, minK: 118.5, maxK: 138.3, budgetTarget: 10000 },
  ibu_menyusui: { label: "Ibu Menyusui", waktu: "Siang", akgMin: 30, akgMax: 35, minE: 782, maxE: 912, minP: 26.3, maxP: 30.6, minL: 20.2, maxL: 23.5, minK: 123.0, maxK: 143.5, budgetTarget: 10000 }
};

// --- KOMPONEN UI ---
const BadgeLabel = ({ stat }: { stat: string }) => {
  if (stat === "pass") return <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>✅ Pass</span>;
  if (stat === "warn") return <span style={{ background: "#fef3c7", color: "#d97706", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>⚠️ Warn</span>;
  return <span style={{ background: "#fee2e2", color: "#991b1b", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>❌ Fail</span>;
};

const ProgressBar = ({ label, current, min, max, unit, stat }: { label: string, current: number, min: number, max: number, unit: string, stat: string }) => {
  const pct = Math.min(100, (current / max) * 100) || 0;
  const color = stat === "pass" ? "#22c55e" : stat === "warn" ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#334155" }}>
        <span>{label}</span>
        <span>{current.toFixed(1)} / {min}-{max} {unit}</span>
      </div>
      <div style={{ width: "100%", height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, transition: "width 0.3s ease" }}></div>
      </div>
    </div>
  );
};

export default function SusunMenuMBG() {
  const [view, setView] = useState<"list" | "compose">("list");
  const [savedMenus, setSavedMenus] = useState<SavedMenu[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRacikLoading, setIsRacikLoading] = useState(false);

  const [sasaran, setSasaran] = useState<string>("sd_4_6");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // State Logistik
  const [jumlahPenerima, setJumlahPenerima] = useState<number>(100);
  const [bufferPercent, setBufferPercent] = useState<number>(5);

  // Search States
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<TkpiItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTkpi, setSelectedTkpi] = useState<TkpiItem | null>(null);

  const [inputGram, setInputGram] = useState<number>(100);
  const [inputHarga, setInputHarga] = useState<number>(0);
  const [inputKategori, setInputKategori] = useState<string>("Makanan Pokok");

  // State Modal Bahan Kustom
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isSavingCustom, setIsSavingCustom] = useState(false);
  const [customBahan, setCustomBahan] = useState({
    nama: "", bdd: 100, energi: 0, protein: 0, lemak: 0, karbohidrat: 0
  });

  const nextId = useRef<number>(0);

  // --- FETCH DATA ---
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      const { data } = await supabase.from("rencana_menu").select("*").order("created_at", { ascending: false });
      if (isMounted && data) setSavedMenus(data as SavedMenu[]);
      setIsLoading(false);
    };
    if (view === "list") loadData();
    return () => { isMounted = false; };
  }, [view]);

  const handleDeleteMenu = async (id: string) => {
    if (!window.confirm("Yakin ingin menghapus menu ini?")) return;
    await supabase.from("rencana_menu").delete().eq("id", id);
    const { data } = await supabase.from("rencana_menu").select("*").order("created_at", { ascending: false });
    if (data) setSavedMenus(data as SavedMenu[]);
  };

  const parseGizi = (val: string | number | null | undefined) => {
    if (!val || val === "-" || val === "Tr" || String(val).trim() === "") return 0;
    return parseFloat(String(val).replace(",", ".")) || 0;
  };

  // --- LOGIKA SIMPAN BAHAN KUSTOM ---
  const handleSaveCustomBahan = async () => {
    if (!customBahan.nama || customBahan.nama.trim() === "") {
      alert("Nama bahan pangan wajib diisi!");
      return;
    }

    setIsSavingCustom(true);
    const newKode = `LOKAL-${Date.now()}`;

    const payload = {
      kode: newKode,
      nama: customBahan.nama,
      sumber: "Kustom / Lokal",
      bdd: customBahan.bdd,
      energi: customBahan.energi,
      protein: customBahan.protein,
      lemak: customBahan.lemak,
      karbohidrat: customBahan.karbohidrat,
      besi: 0, retinol: 0, kalsium: 0, seng: 0, vitamin_c: 0
    };

    const { error } = await supabase.from("data_tkpi").insert([payload]);

    setIsSavingCustom(false);

    if (error) {
      alert("Gagal menyimpan bahan: " + error.message);
    } else {
      alert("Bahan pangan berhasil ditambahkan ke database!");
      setIsCustomModalOpen(false);
      setSelectedTkpi(payload as TkpiItem);
      setInputGram(100);
      setSearch("");
      setCustomBahan({ nama: "", bdd: 100, energi: 0, protein: 0, lemak: 0, karbohidrat: 0 });
    }
  };

  // --- SEARCH TKPI ---
  const handleSearch = async (text: string) => {
    setSearch(text);
    if (text.length < 3) { setSearchResults([]); return; }
    setIsSearching(true);

    const { data } = await supabase.from("data_tkpi").select("*").ilike("nama", `%${text}%`).limit(8);

    const processedData = data?.map(item => ({
      ...item,
      sumber: item.sumber || "TKPI 2020"
    })) || [];

    setSearchResults(processedData as TkpiItem[]);
    setIsSearching(false);
  };

  const selectBahan = (item: TkpiItem) => {
    setSelectedTkpi(item);
    setSearch("");
    setSearchResults([]);
    setInputGram(100);
    setInputHarga(0);
  };

  const handleAddFood = () => {
    if (!selectedTkpi) return;
    if (inputGram <= 0) { alert("Gramase harus lebih dari 0"); return; }

    const bdd = parseGizi(selectedTkpi.bdd) || 100;
    const factor = (inputGram / 100) * (bdd / 100);
    const kotor = inputGram / (bdd / 100);
    const costBahan = (inputGram / 1000) * inputHarga;

    const newFood: MenuItem = {
      id: selectedTkpi.kode + "-" + (nextId.current++),
      kode: selectedTkpi.kode,
      nama: selectedTkpi.nama,
      kategori: inputKategori,
      sumber_data: selectedTkpi.sumber || "TKPI 2020",
      gram: inputGram,
      berat_kotor: kotor,
      harga_kg: inputHarga,
      cost: costBahan,
      energi: parseGizi(selectedTkpi.energi) * factor,
      protein: parseGizi(selectedTkpi.protein) * factor,
      lemak: parseGizi(selectedTkpi.lemak) * factor,
      karbo: parseGizi(selectedTkpi.karbohidrat) * factor,
      fe: parseGizi(selectedTkpi.besi) * factor,
      vitA: parseGizi(selectedTkpi.retinol || selectedTkpi.karoten_total) * factor,
      ca: parseGizi(selectedTkpi.kalsium) * factor,
      zn: parseGizi(selectedTkpi.seng) * factor,
      vitC: parseGizi(selectedTkpi.vitamin_c) * factor,
    };

    setMenuItems([...menuItems, newFood]);
    setSelectedTkpi(null);
  };

  // --- RACIK OTOMATIS (VERSI CERDAS 2.0) ---
  const racikOtomatis = async () => {
    setIsRacikLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

      const prompt = `Anda adalah ahli gizi MBG (Makan Bergizi Gratis).
      Buatkan 1 set menu makan siang untuk kelompok sasaran: ${target.label}.
      Target Energi: ${target.minE}-${target.maxE} kkal.
      Target Protein: ${target.minP}-${target.maxP} gram.

      PILIHKAN BAHAN BERIKUT (Harus di ikuti secara ketat):
      1. Makanan Pokok (Nasi/Ubi/Kentang) - Gramasi sekitar 100-150g
      2. Lauk Hewani (Ayam/Ikan/Telur/Daging) - Gramasi sekitar 40-75g (KECUALI bahan kering seperti Teri cukup 15g)
      3. Lauk Nabati (Tempe/Tahu) - Gramasi sekitar 25-50g
      4. Sayuran (Bayam/Wortel/Labu) - Gramasi sekitar 75-100g
      5. Buah (Pisang/Pepaya/Jeruk) - Gramasi sekitar 50-100g

      KEMBALIKAN HANYA JSON ARRAY berisi objek: [{"nama": "...", "gram": ..., "kategori": "..."}]
      Isi "kategori" dengan salah satu dari: "Makanan Pokok", "Lauk Hewani", "Lauk Nabati", "Sayuran", "Buah".
      Pastikan nama bahan sangat umum di Indonesia.
      DILARANG MEMBERIKAN TEKS LAIN.`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const aiRecommendations = JSON.parse(jsonStr);

      const newMenu: MenuItem[] = [];

      for (const rec of aiRecommendations) {
        const { data } = await supabase
          .from("data_tkpi")
          .select("*")
          .ilike("nama", `%${rec.nama.split(" ")[0]}%`)
          .limit(1);

        if (data && data.length > 0) {
          const item = data[0];
          const gram = rec.gram;
          const harga_kg = 25000;

          const bdd = parseGizi(item.bdd) || 100;
          const factor = (gram / 100) * (bdd / 100);
          const kotor = gram / (bdd / 100);

          newMenu.push({
            id: item.kode + "-" + (nextId.current++),
            kode: item.kode,
            nama: item.nama,
            kategori: rec.kategori || "Lainnya",
            sumber_data: item.sumber || "TKPI 2020",
            gram: gram,
            berat_kotor: kotor,
            harga_kg: harga_kg,
            cost: (gram / 1000) * harga_kg,
            energi: parseGizi(item.energi) * factor,
            protein: parseGizi(item.protein) * factor,
            lemak: parseGizi(item.lemak) * factor,
            karbo: parseGizi(item.karbohidrat) * factor,
            fe: parseGizi(item.besi) * factor,
            vitA: parseGizi(item.retinol || item.karoten_total) * factor,
            ca: parseGizi(item.kalsium) * factor,
            zn: parseGizi(item.seng) * factor,
            vitC: parseGizi(item.vitamin_c) * factor,
          });
        }
      }
      setMenuItems(newMenu);
    } catch (error) {
      console.error("AI Error:", error);
      alert("Gagal meracik. Coba lagi.");
    } finally {
      setIsRacikLoading(false);
    }
  };

  // --- EKSPOR CSV ---
  const handleExportCSV = () => {
    if (menuItems.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }

    const headers = ["Kode", "Kategori", "Nama Bahan", "Sumber Data", "Berat Bersih (g)", "Berat Kotor (g)", "Harga/Kg (Rp)", "Cost Bahan (Rp)", "Energi (kkal)", "Protein (g)", "Lemak (g)", "Karbohidrat (g)"];
    const rows = menuItems.map(m => [
      m.kode,
      `"${m.kategori}"`,
      `"${m.nama}"`,
      m.sumber_data || "TKPI 2020",
      m.gram,
      m.berat_kotor.toFixed(1),
      m.harga_kg,
      m.cost.toFixed(2),
      m.energi.toFixed(2),
      m.protein.toFixed(2),
      m.lemak.toFixed(2),
      m.karbo.toFixed(2)
    ]);

    const totalRow = ["", "", "TOTAL", "", "", "", "", totals.c.toFixed(2), totals.e.toFixed(2), totals.p.toFixed(2), totals.l.toFixed(2), totals.k.toFixed(2)];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n") + "\n" + totalRow.join(",");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Menu_MBG_${target.label.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // HYBRID VALIDATION ENGINE (3 PILAR)
  // ==========================================
  const target = TARGET_GROUPS[sasaran];

  const totals = menuItems.reduce((acc, m) => ({
    e: acc.e + m.energi, p: acc.p + m.protein, l: acc.l + m.lemak, k: acc.k + m.karbo, c: acc.c + m.cost
  }), { e: 0, p: 0, l: 0, k: 0, c: 0 });

  const finalCost = totals.c * 1.1;
  const costPerPorsiPlusBuffer = finalCost * (1 + (bufferPercent / 100));
  const totalRAB = costPerPorsiPlusBuffer * jumlahPenerima;

  // --- PILAR 1: Kelengkapan Komponen Isi Piringku ---
  const hasPokok = menuItems.some(m => m.kategori === "Makanan Pokok");
  const hasHewani = menuItems.some(m => m.kategori === "Lauk Hewani");
  const hasNabati = menuItems.some(m => m.kategori === "Lauk Nabati");
  const hasSayur = menuItems.some(m => m.kategori === "Sayuran");
  const hasBuah = menuItems.some(m => m.kategori === "Buah");
  const komponen = [hasPokok, hasHewani, hasNabati, hasSayur, hasBuah];
  const komponenCount = komponen.filter(Boolean).length;
  const isPiringkuLengkap = komponenCount === 5;
  const statPiringku = isPiringkuLengkap ? "pass" : komponenCount >= 3 ? "warn" : "fail";

  // --- PILAR 2: Kecukupan Energi & Protein (Kuantitatif Ketat) ---
  const statE = (totals.e >= target.minE * 0.9 && totals.e <= target.maxE * 1.1) ? "pass" : "fail";
  const statP = (totals.p >= target.minP * 0.95) ? "pass" : "fail";

  // --- PILAR 3: Info Makro Tambahan (Indikatif — Tidak Menyebabkan Gagal) ---
  const statL = (totals.l >= target.minL && totals.l <= target.maxL) ? "pass" : "warn";
  const statK = (totals.k >= target.minK && totals.k <= target.maxK) ? "pass" : "warn";

  // --- Kepatuhan Anggaran ---
  const statC = (finalCost <= target.budgetTarget) ? "pass" : "fail";

  // --- Status Final: Lulus jika Pilar 1 + 2 + Biaya terpenuhi ---
  const isMenuValid = isPiringkuLengkap && statE === "pass" && statP === "pass" && statC === "pass";
  const statusFinal = isMenuValid
    ? { label: "✅ Valid & Sesuai Pedoman", color: "#166534", bg: "#f0fdf4" }
    : komponenCount >= 3 && statE === "pass"
      ? { label: "⚠️ Hampir Sesuai — Perlu Revisi", color: "#d97706", bg: "#fffbeb" }
      : { label: "❌ Belum Memenuhi Standar", color: "#991b1b", bg: "#fef2f2" };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = {
      dibuat_oleh: user.id,
      nama_paket: `Menu MBG - ${target.label}`,
      kelompok_sasaran: target.label,
      total_kalori: totals.e,
      data_menu: { 'Makan Siang': menuItems },
      status: isMenuValid ? 'approved' : 'draft'
    };
    await supabase.from('rencana_menu').insert([payload]);
    alert("Menu Berhasil Disimpan!");
    setView("list");
  };

  // ==========================================
  // VIEW 1: DAFTAR MENU (SUMMARY PAGE)
  // ==========================================
  if (view === "list") {
    return (
      <div style={{ paddingBottom: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 24, color: "#1e293b" }}>Manajemen Susun Menu</h2>
          <button onClick={() => setView("compose")} style={{ background: "#10b981", color: "#fff", padding: "10px 20px", borderRadius: 8, fontWeight: 700, border: "none", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.3)" }}>
            + Susun Menu Baru
          </button>
        </div>

        <div className="card" style={{ padding: 24, borderRadius: 16, border: "1px solid #e2e8f0" }}>
          <h3 style={{ marginTop: 0, fontSize: 16, color: "#475569" }}>Daftar Rencana Menu MBG (Standardisasi Permenkes 28/2019)</h3>
          {isLoading ? <p>Memuat data...</p> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", minWidth: 600, textAlign: "left", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b", fontSize: 13 }}>
                    <th style={{ padding: 12 }}>NAMA PAKET</th>
                    <th>SASARAN</th>
                    <th>TOTAL ENERGI</th>
                    <th>STATUS</th>
                    <th>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {savedMenus.map(m => (
                    <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: 12, fontWeight: 600, color: "#0f172a" }}>{m.nama_paket}</td>
                      <td style={{ fontSize: 13, color: "#475569" }}>{m.kelompok_sasaran}</td>
                      <td style={{ fontSize: 13, fontWeight: 600 }}>{m.total_kalori.toFixed(0)} kkal</td>
                      <td>
                        <span style={{ background: m.status === 'approved' ? "#dcfce7" : "#fef3c7", color: m.status === 'approved' ? "#166534" : "#92400e", padding: "4px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                          {m.status === 'approved' ? '✅ Valid' : '⚠️ Draft'}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => handleDeleteMenu(m.id)} style={{ background: "#fee2e2", color: "#991b1b", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>Hapus</button>
                      </td>
                    </tr>
                  ))}
                  {savedMenus.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Belum ada menu yang disusun.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: COMPOSER (SUSUN MENU MBG)
  // ==========================================
  return (
    <div style={{ paddingBottom: 40 }}>
      {/* HEADER CONTROLS */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => setView("list")} style={{ background: "transparent", border: "1px solid #cbd5e1", padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 600, color: "#475569" }}>
            ⬅️ Kembali
          </button>
          <h2 style={{ margin: 0, fontSize: 20, color: "#1e293b" }}>Peracik Menu (Standar Juknis 2026)</h2>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {/* PERBAIKAN 1 & 2: Dropdown Target elegan tanpa tulisan "Target:" */}
          <select
            value={sasaran}
            onChange={e => setSasaran(e.target.value)}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontWeight: 600,
              color: "#0f172a",
              outline: "none",
              width: 280,
              backgroundColor: "#f8fafc",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              appearance: "none",
              backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23475569%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 16px top 50%",
              backgroundSize: "12px auto"
            }}
          >
            {Object.entries(TARGET_GROUPS).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>

          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", padding: "4px 12px", borderRadius: 8, border: "1px solid #cbd5e1" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>👥 Anak:</span>
            <input type="number" value={jumlahPenerima} onChange={e => setJumlahPenerima(Number(e.target.value))} style={{ width: 60, padding: "4px 8px", border: "1px solid #cbd5e1", borderRadius: 4, outline: "none", fontWeight: 600 }} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", padding: "4px 12px", borderRadius: 8, border: "1px solid #cbd5e1" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>📦 Buffer (%):</span>
            <input type="number" value={bufferPercent} onChange={e => setBufferPercent(Number(e.target.value))} style={{ width: 50, padding: "4px 8px", border: "1px solid #cbd5e1", borderRadius: 4, outline: "none", fontWeight: 600 }} />
          </div>
        </div>
      </div>

      {/* HORIZONTAL CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#fff", padding: "16px", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><span style={{ background: "#dcfce7", padding: 4, borderRadius: 4 }}>💰</span> Total Anggaran</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginTop: 8 }}>Rp {finalCost.toLocaleString("id-ID")}</div>
        </div>
        <div style={{ background: "#fff", padding: "16px", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><span style={{ background: "#dbeafe", padding: 4, borderRadius: 4 }}>⚡</span> Total Energi</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginTop: 8 }}>{totals.e.toFixed(0)} <span style={{ fontSize: 12, color: "#94a3b8" }}>kkal</span></div>
        </div>
        <div style={{ background: "#fff", padding: "16px", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><span style={{ background: "#fee2e2", padding: 4, borderRadius: 4 }}>🥩</span> Total Protein</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginTop: 8 }}>{totals.p.toFixed(1)} <span style={{ fontSize: 12, color: "#94a3b8" }}>g</span></div>
        </div>
        <div style={{ background: "#fff", padding: "16px", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><span style={{ background: "#fef3c7", padding: 4, borderRadius: 4 }}>🧈</span> Total Lemak</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginTop: 8 }}>{totals.l.toFixed(1)} <span style={{ fontSize: 12, color: "#94a3b8" }}>g</span></div>
        </div>
        <div style={{ background: "#fff", padding: "16px", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><span style={{ background: "#f3e8ff", padding: 4, borderRadius: 4 }}>🍞</span> Total Karbo</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginTop: 8 }}>{totals.k.toFixed(1)} <span style={{ fontSize: 12, color: "#94a3b8" }}>g</span></div>
        </div>
      </div>

      {/* INPUT BAR */}
      <div style={{ background: "#fff", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0", marginBottom: 24, overflow: "visible", position: "relative" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>

          <div style={{ flex: 2, position: "relative", zIndex: 50 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", display: "block" }}>🔍 Cari Bahan Pangan (Database TKPI)</label>
              {/* PERBAIKAN 4: Tombol Tambah Bahan (tanpa "Kustom") dengan desain yang lebih elegan */}
              <button
                onClick={() => setIsCustomModalOpen(true)}
                style={{
                  background: "#e0f2fe",
                  border: "1px solid #bae6fd",
                  color: "#0284c7",
                  fontWeight: 700,
                  fontSize: 11,
                  cursor: "pointer",
                  padding: "4px 10px",
                  borderRadius: 6,
                  transition: "background 0.2s"
                }}
              >
                + Tambah Bahan
              </button>
            </div>

            <input type="text" value={search} onChange={e => handleSearch(e.target.value)} placeholder="Ketik untuk mencari (Mis: Nasi, Telur)..." style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none", fontSize: 14 }} />

            {searchResults.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8, marginTop: 4, maxHeight: 250, overflowY: "auto", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", zIndex: 999 }}>
                {searchResults.map(item => (
                  <div key={item.kode} onClick={() => selectBahan(item)} style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ color: "#0f172a", display: "block" }}>{item.nama}</strong>
                      {item.sumber === "Kustom / Lokal"
                        ? <span style={{ fontSize: 11, color: "#f59e0b", display: "block", marginTop: 2, fontWeight: 600 }}>🌟 Sumber: {item.sumber}</span>
                        : <span style={{ fontSize: 11, color: "#10b981", display: "block", marginTop: 2 }}>Sumber: {item.sumber}</span>
                      }
                    </div>
                    <span style={{ color: "#64748b" }}>E:{item.energi} P:{item.protein}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DROPDOWN KATEGORI ISI PIRINGKU */}
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 }}>Kategori Komponen</label>
            <select value={inputKategori} onChange={e => setInputKategori(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none", background: selectedTkpi ? "#fff" : "#f8fafc", cursor: "pointer" }} disabled={!selectedTkpi}>
              <option value="Makanan Pokok">🍚 Makanan Pokok</option>
              <option value="Lauk Hewani">🍗 Lauk Hewani</option>
              <option value="Lauk Nabati">🧀 Lauk Nabati</option>
              <option value="Sayuran">🥬 Sayuran</option>
              <option value="Buah">🍉 Buah</option>
              <option value="Lainnya">🧂 Bumbu/Lainnya</option>
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 }}>Berat Bersih (Gram)</label>
            <input type="number" value={inputGram} onChange={e => setInputGram(Number(e.target.value))} style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none", background: selectedTkpi ? "#fff" : "#f8fafc" }} disabled={!selectedTkpi} />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 }}>Harga/Kg (Rp)</label>
            <input type="number" value={inputHarga === 0 ? '' : inputHarga} onChange={e => setInputHarga(Number(e.target.value))} placeholder="Mis: 15000" style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none", background: selectedTkpi ? "#fff" : "#f8fafc" }} disabled={!selectedTkpi} />
          </div>

          <div style={{ flex: 1 }}>
            <button onClick={handleAddFood} disabled={!selectedTkpi} style={{ width: "100%", padding: "12px", background: selectedTkpi ? "#10b981" : "#cbd5e1", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: selectedTkpi ? "pointer" : "not-allowed" }}>
              + Tambah
            </button>
          </div>
        </div>

        {selectedTkpi && (
          <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600, marginTop: 10 }}>
            ✅ Bahan terpilih: {selectedTkpi.nama}. Silakan tentukan Gramasi dan Harga pasar, lalu klik Tambah.
          </div>
        )}
        {isSearching && <div style={{ fontSize: 11, color: "#3b82f6", marginTop: 6, position: "absolute" }}>⏳ Mengakses Database Pangan...</div>}
      </div>

      {/* DUA KOLOM BAWAH (Tabel & Validasi) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24, alignItems: "start" }}>

        {/* KOLOM KIRI: Rincian Menu */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>Rincian Piring Menu</h3>
          </div>

          {/* PERBAIKAN 3: Skema Tabel yang Responsive & Scrollable agar lebih User Friendly */}
          <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", minWidth: 800, textAlign: "left", fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", color: "#64748b" }}>
                  <th style={{ padding: "12px 24px", whiteSpace: "nowrap" }}>BAHAN PANGAN</th>
                  <th style={{ whiteSpace: "nowrap" }}>KATEGORI</th>
                  <th style={{ whiteSpace: "nowrap" }}>BERSIH (G)</th>
                  <th style={{ color: "#2563eb", whiteSpace: "nowrap" }}>BELANJA (G)</th>
                  <th style={{ whiteSpace: "nowrap" }}>ANGGARAN</th>
                  <th style={{ whiteSpace: "nowrap" }}>ENERGI</th>
                  <th style={{ whiteSpace: "nowrap" }}>PROTEIN</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {menuItems.map((m, i) => (
                  <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 24px", fontWeight: 600, color: "#334155", minWidth: 180 }}>
                      {m.nama}
                    </td>
                    <td>
                      <span style={{ background: "#e2e8f0", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{m.kategori}</span>
                    </td>
                    <td>{m.gram}</td>
                    <td style={{ color: "#2563eb", fontWeight: 700 }}>{m.berat_kotor.toFixed(1)}</td>
                    <td style={{ color: "#059669", fontWeight: 600, whiteSpace: "nowrap" }}>Rp {m.cost.toLocaleString("id-ID")}</td>
                    <td>{m.energi.toFixed(1)}</td>
                    <td>{m.protein.toFixed(1)}</td>
                    <td style={{ paddingRight: 16 }}><button onClick={() => setMenuItems(menuItems.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16 }}>×</button></td>
                  </tr>
                ))}
                {menuItems.length === 0 && <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Belum ada bahan yang ditambahkan ke dalam piring.</td></tr>}
              </tbody>
            </table>
          </div>

          {/* INFO & ACTION BUTTONS */}
          <div style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0", padding: "16px 24px" }}>
            <div style={{ fontSize: 12, color: "#0284c7", background: "#e0f2fe", padding: "8px 12px", borderRadius: 6, marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span>💡</span>
              <div>
                <b>Informasi Asisten Cerdas:</b> Fungsi <i>Racik Otomatis</i> kini ditenagai oleh <b>Google Gemini AI</b> untuk merekomendasikan variasi menu yang bervariasi setiap kali ditekan, dan akan otomatis divalidasi oleh sistem sesuai Standar Mutlak Permenkes 28/2019.
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, width: "100%" }}>
              <button onClick={handleSave} disabled={menuItems.length === 0 || isRacikLoading} style={{ flex: 1, padding: "12px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: menuItems.length === 0 ? "not-allowed" : "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                💾 Simpan Menu
              </button>
              <button onClick={() => setMenuItems([])} disabled={isRacikLoading} style={{ flex: 1, padding: "12px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: isRacikLoading ? "not-allowed" : "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                🗑️ Kosongkan Piring
              </button>
              <button onClick={handleExportCSV} disabled={menuItems.length === 0 || isRacikLoading} style={{ flex: 1, padding: "12px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: menuItems.length === 0 ? "not-allowed" : "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                📄 Ekspor CSV
              </button>
              <button onClick={racikOtomatis} disabled={isRacikLoading} style={{ flex: 1.5, padding: "12px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: isRacikLoading ? "wait" : "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", opacity: isRacikLoading ? 0.7 : 1 }}>
                {isRacikLoading ? "⏳ Sedang Meracik Menu..." : "✨ Racik Otomatis (AI)"}
              </button>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: Analisis Hibrida (3 Pilar) */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>Analisis Kepatuhan Menu</h3>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Pedoman Gizi Seimbang & Juknis BGN 2026</div>
            </div>
            <div style={{ background: statusFinal.bg, color: statusFinal.color, padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800, textAlign: "center" }}>
              {statusFinal.label}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* PILAR 1: KELENGKAPAN ISI PIRINGKU */}
            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>1. Kelengkapan Komponen (Isi Piringku)</span>
                <BadgeLabel stat={statPiringku} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, color: "#475569" }}>
                <div>{hasPokok ? "✅" : "❌"} Makanan Pokok</div>
                <div>{hasSayur ? "✅" : "❌"} Sayuran</div>
                <div>{hasHewani ? "✅" : "❌"} Lauk Hewani</div>
                <div>{hasBuah ? "✅" : "❌"} Buah-buahan</div>
                <div>{hasNabati ? "✅" : "❌"} Lauk Nabati</div>
              </div>
            </div>

            {/* PILAR 2: ENERGI & PROTEIN */}
            <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 12 }}>2. Kecukupan Energi & Protein</div>
              <ProgressBar label="Energi (Toleransi ±10%)" current={totals.e} min={target.minE * 0.9} max={target.maxE * 1.1} unit="kkal" stat={statE} />
              <ProgressBar label="Protein (Min. 95% target)" current={totals.p} min={target.minP * 0.95} max={target.maxP} unit="g" stat={statP} />
            </div>

            {/* PILAR 3: INFO MAKRO TAMBAHAN */}
            <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>3. Info Makro Tambahan</span>
                <span style={{ background: "#e0f2fe", color: "#0284c7", padding: "4px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>ℹ️ Indikatif</span>
              </div>
              <ProgressBar label="Lemak" current={totals.l} min={target.minL} max={target.maxL} unit="g" stat={statL} />
              <ProgressBar label="Karbohidrat" current={totals.k} min={target.minK} max={target.maxK} unit="g" stat={statK} />
            </div>

            {/* KEPATUHAN ANGGARAN */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #e2e8f0" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>4. Batas Anggaran / Porsi</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Maks: Rp {target.budgetTarget.toLocaleString('id-ID')} (+10% bumbu)</div>
              </div>
              <BadgeLabel stat={statC} />
            </div>

            {/* PANEL RAB */}
            <div style={{ background: "#f0fdf4", padding: "16px", borderRadius: 8, border: "1px solid #bbf7d0", marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#166534", marginBottom: 6 }}>5. Rencana Anggaran Biaya (RAB)</div>
              <div style={{ fontSize: 11, color: "#15803d", marginBottom: 12 }}>Total untuk {jumlahPenerima} Anak (termasuk {bufferPercent}% cadangan buffer)</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#14532d" }}>
                Rp {totalRAB.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          MODAL: TAMBAH BAHAN KUSTOM 
      ========================================== */}
      {isCustomModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", padding: 32, borderRadius: 16, width: 450, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 20 }}>Tambah Bahan Kustom 🥬</h3>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>Masukkan nilai gizi per 100 gram bahan mentah. Data ini akan tersimpan permanen di database Anda.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>Nama Bahan Pangan</label>
                <input type="text" placeholder="Mis: Ikan Cakalang Asap" value={customBahan.nama} onChange={e => setCustomBahan({ ...customBahan, nama: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", outline: "none" }} />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>BDD (%)</label>
                  <input type="number" value={customBahan.bdd} onChange={e => setCustomBahan({ ...customBahan, bdd: Number(e.target.value) })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", outline: "none" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>Energi (Kkal)</label>
                  <input type="number" value={customBahan.energi} onChange={e => setCustomBahan({ ...customBahan, energi: Number(e.target.value) })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", outline: "none" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>Protein (g)</label>
                  <input type="number" value={customBahan.protein} onChange={e => setCustomBahan({ ...customBahan, protein: Number(e.target.value) })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", outline: "none" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>Lemak (g)</label>
                  <input type="number" value={customBahan.lemak} onChange={e => setCustomBahan({ ...customBahan, lemak: Number(e.target.value) })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", outline: "none" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>Karbo (g)</label>
                  <input type="number" value={customBahan.karbohidrat} onChange={e => setCustomBahan({ ...customBahan, karbohidrat: Number(e.target.value) })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", outline: "none" }} />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setIsCustomModalOpen(false)} style={{ padding: "10px 16px", background: "transparent", border: "1px solid #cbd5e1", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Batal</button>
              <button onClick={handleSaveCustomBahan} disabled={isSavingCustom} style={{ padding: "10px 24px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: isSavingCustom ? "not-allowed" : "pointer" }}>
                {isSavingCustom ? "Menyimpan..." : "💾 Simpan ke Database"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}