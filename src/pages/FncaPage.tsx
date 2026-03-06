// File: src/pages/FncaPage.tsx
import { useState, useEffect } from "react";
import { AKG_GROUPS } from "../utils/constants";
import { supabase } from "../config/supabaseClient";

export default function FncaPage() {
  const getStr = (key: string, def: string) => localStorage.getItem(key) || def;
  const getNum = (key: string, def: number) => {
    const val = localStorage.getItem(key);
    return val !== null ? Number(val) : def;
  };
  const getObj = (key: string, def: any) => {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : def;
    } catch {
      return def;
    }
  };

  const [topTab, setTopTab] = useState(() =>
    getStr("fnca_topTab", "Perencana Menu"),
  );
  const [mealTab, setMealTab] = useState(() =>
    getStr("fnca_mealTab", "Makan Siang"),
  );

  const [sasaran, setSasaran] = useState(() =>
    getStr("fnca_sasaran", "SD (10-12 th)"),
  );
  const [jumlahSasaran, setJumlahSasaran] = useState(() =>
    getNum("fnca_jumlah", 300),
  );
  const [bufferStock, setBufferStock] = useState(() =>
    getNum("fnca_buffer", 10),
  );
  const [targetHarga, setTargetHarga] = useState(() =>
    getNum("fnca_harga", 10000),
  );

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [qty, setQty] = useState(100);

  // --- STATE BARU UNTUK PROSES SIMPAN ---
  const [isSaving, setIsSaving] = useState(false);

  const [menus, setMenus] = useState<Record<string, any[]>>(() =>
    getObj("fnca_menus", {
      Sarapan: [],
      "Makan Siang": [],
      "Makan Malam": [],
      Snack: [],
    }),
  );

  useEffect(() => {
    localStorage.setItem("fnca_topTab", topTab);
  }, [topTab]);
  useEffect(() => {
    localStorage.setItem("fnca_mealTab", mealTab);
  }, [mealTab]);
  useEffect(() => {
    localStorage.setItem("fnca_sasaran", sasaran);
  }, [sasaran]);
  useEffect(() => {
    localStorage.setItem("fnca_jumlah", jumlahSasaran.toString());
  }, [jumlahSasaran]);
  useEffect(() => {
    localStorage.setItem("fnca_buffer", bufferStock.toString());
  }, [bufferStock]);
  useEffect(() => {
    localStorage.setItem("fnca_harga", targetHarga.toString());
  }, [targetHarga]);
  useEffect(() => {
    localStorage.setItem("fnca_menus", JSON.stringify(menus));
  }, [menus]);

  const akg = AKG_GROUPS[sasaran] || AKG_GROUPS["SD (10-12 th)"];
  const targetHarian = akg.energi;

  const targetSesi: Record<string, number> = {
    Sarapan: Math.round(targetHarian * 0.25),
    "Makan Siang": Math.round(targetHarian * 0.35),
    "Makan Malam": Math.round(targetHarian * 0.3),
    Snack: Math.round(targetHarian * 0.1),
  };

  const parseGizi = (val: string | null) => {
    if (!val || val === "-" || val === "Tr" || val.trim() === "") return 0;
    return parseFloat(val.toString().replace(",", ".")) || 0;
  };

  const handleSearch = async (text: string) => {
    setSearch(text);
    if (text.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const { data, error } = await supabase
      .from("data_tkpi")
      .select("*")
      .ilike("nama", `%${text}%`)
      .limit(10);

    if (!error && data) setSearchResults(data);
    setIsSearching(false);
  };

  const addFood = (foodItem: any) => {
    if (qty <= 0) return;
    const bdd = parseGizi(foodItem.bdd) || 100;
    const factor = (qty / 100) * (bdd / 100);
    const newFood = {
      id: foodItem.kode + Math.random(),
      nama: foodItem.nama,
      kategori: "Bahan Pangan",
      gram: qty,
      bdd: bdd,
      energi: parseGizi(foodItem.energi) * factor,
      protein: parseGizi(foodItem.protein) * factor,
      lemak: parseGizi(foodItem.lemak) * factor,
      karbo: parseGizi(foodItem.karbohidrat) * factor,
      serat: parseGizi(foodItem.serat) * factor,
      kalsium: parseGizi(foodItem.kalsium) * factor,
      besi: parseGizi(foodItem.besi) * factor,
      harga: qty * 25,
    };

    setMenus((prev) => ({ ...prev, [mealTab]: [...prev[mealTab], newFood] }));
    setSearch("");
    setSearchResults([]);
  };

  const removeFood = (index: number) => {
    setMenus((prev) => ({
      ...prev,
      [mealTab]: prev[mealTab].filter((_, i) => i !== index),
    }));
  };

  const generateRekomendasi = async () => {
    setIsSearching(true);
    const keywords = {
      karbo: ["beras", "kentang", "jagung", "singkong", "talas", "ubi"],
      hewani: ["ayam", "ikan", "sapi", "telur", "lele", "bandeng", "tongkol"],
      nabati: ["tahu", "tempe", "kacang hijau", "kacang merah", "kacang tanah"],
      sayur: [
        "bayam",
        "kangkung",
        "wortel",
        "buncis",
        "sawi",
        "daun singkong",
        "tomat",
      ],
      buah: ["pisang", "pepaya", "jeruk", "semangka", "melon", "mangga"],
    };

    const fetchRandomItem = async (kws: string[]) => {
      const kw = kws[Math.floor(Math.random() * kws.length)];
      const { data } = await supabase
        .from("data_tkpi")
        .select("*")
        .ilike("nama", `%${kw}%`)
        .limit(10);
      return data && data.length > 0
        ? data[Math.floor(Math.random() * data.length)]
        : null;
    };

    const [karbo, hewani, nabati, sayur, buah] = await Promise.all([
      fetchRandomItem(keywords.karbo),
      fetchRandomItem(keywords.hewani),
      fetchRandomItem(keywords.nabati),
      fetchRandomItem(keywords.sayur),
      fetchRandomItem(keywords.buah),
    ]);

    const newMenus: any[] = [];
    const formatMenu = (item: any, gram: number, kat: string) => {
      if (!item) return;
      const bdd = parseGizi(item.bdd) || 100;
      const factor = (gram / 100) * (bdd / 100);
      newMenus.push({
        id: item.kode + Math.random(),
        nama: item.nama,
        kategori: kat,
        gram: gram,
        bdd: bdd,
        energi: parseGizi(item.energi) * factor,
        protein: parseGizi(item.protein) * factor,
        lemak: parseGizi(item.lemak) * factor,
        karbo: parseGizi(item.karbohidrat) * factor,
        serat: parseGizi(item.serat) * factor,
        kalsium: parseGizi(item.kalsium) * factor,
        besi: parseGizi(item.besi) * factor,
        harga: gram * 25,
      });
    };

    formatMenu(karbo, 150, "Makanan Pokok");
    formatMenu(hewani, 80, "Lauk Hewani");
    formatMenu(nabati, 50, "Lauk Nabati");
    formatMenu(sayur, 100, "Sayur");
    formatMenu(buah, 100, "Buah");

    setMenus((prev) => ({ ...prev, [mealTab]: newMenus }));
    setIsSearching(false);
  };

  // --- LOGIKA BARU: SIMPAN KE DATABASE SUPABASE ---
  const saveMenuToDatabase = async () => {
    setIsSaving(true);

    // Ambil data user yang sedang login dari sistem Auth Supabase
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Sesi berakhir. Silakan login kembali.");
      setIsSaving(false);
      return;
    }

    const payload = {
      dibuat_oleh: user.id,
      nama_paket: `Menu Harian - ${sasaran} (${new Date().toLocaleDateString("id-ID")})`,
      kelompok_sasaran: sasaran,
      total_kalori: totals.energi,
      data_menu: menus, // Simpan objek JSON keranjang makanan
      status: "published",
    };

    const { error } = await supabase.from("rencana_menu").insert([payload]);

    if (!error) {
      alert("✅ Rencana menu berhasil disimpan permanen ke Database!");
    } else {
      alert("❌ Gagal menyimpan menu: " + error.message);
    }
    setIsSaving(false);
  };

  const allMenus = Object.values(menus).flat();
  const totals = allMenus.reduce(
    (acc, item) => ({
      energi: acc.energi + item.energi,
      protein: acc.protein + item.protein,
      lemak: acc.lemak + item.lemak,
      karbo: acc.karbo + item.karbo,
      serat: acc.serat + item.serat,
      kalsium: acc.kalsium + item.kalsium,
      besi: acc.besi + item.besi,
      harga: acc.harga + item.harga,
    }),
    {
      energi: 0,
      protein: 0,
      lemak: 0,
      karbo: 0,
      serat: 0,
      kalsium: 0,
      besi: 0,
      harga: 0,
    },
  );

  const skorGizi =
    targetHarian > 0
      ? Math.min(100, Math.round((totals.energi / targetHarian) * 100))
      : 0;

  const MiniBar = ({
    label,
    val,
    max,
    unit,
  }: {
    label: string;
    val: number;
    max: number;
    unit: string;
  }) => {
    const pct = Math.min(100, val > 0 && max > 0 ? (val / max) * 100 : 0);
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: 13,
          marginBottom: 14,
        }}
      >
        <div style={{ width: 90, fontWeight: 600, color: "var(--txt)" }}>
          {label}
        </div>
        <div
          style={{
            flex: 1,
            height: 6,
            background: "#f1f5f9",
            borderRadius: 4,
            overflow: "hidden",
            margin: "0 12px",
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: "#ef4444",
              borderRadius: 4,
            }}
          ></div>
        </div>
        <div
          style={{
            width: 100,
            textAlign: "right",
            color: "var(--txt3)",
            fontSize: 12,
          }}
        >
          <span style={{ color: "var(--txt)", fontWeight: 600 }}>
            {val.toFixed(1)}
          </span>
          {unit} / {max}
        </div>
      </div>
    );
  };

  const renderGrafik = () => {
    const calcPct = (val: number, max: number) =>
      Math.min(100, Math.round((val / max) * 100));

    return (
      <div
        style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24 }}
      >
        <div className="card" style={{ borderRadius: 12 }}>
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: 15 }}>
              📊 Perbandingan Asupan vs AKG
            </h3>
          </div>
          <div className="card-body">
            {[
              { l: "Energi (kkal)", v: totals.energi, m: akg.energi },
              { l: "Protein (g)", v: totals.protein, m: akg.protein },
              { l: "Lemak (g)", v: totals.lemak, m: akg.lemak },
              { l: "Karbohidrat (g)", v: totals.karbo, m: akg.karbo },
              { l: "Serat (g)", v: totals.serat, m: akg.serat || 30 },
              { l: "Kalsium (mg)", v: totals.kalsium, m: akg.kalsium || 1000 },
              { l: "Besi (mg)", v: totals.besi, m: akg.besi || 15 },
            ].map((i, idx) => {
              const pct = calcPct(i.v, i.m);
              const isGood = pct >= 80 && pct <= 110;
              return (
                <div key={idx} style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                  >
                    <span>{i.l}</span>
                    <span style={{ color: isGood ? "#16a34a" : "#ef4444" }}>
                      {pct}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 12,
                      background: "#f1f5f9",
                      borderRadius: 6,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: isGood ? "#22c55e" : "#ef4444",
                        borderRadius: 6,
                      }}
                    ></div>
                  </div>
                  <div
                    style={{ fontSize: 11, color: "var(--txt3)", marginTop: 4 }}
                  >
                    {i.v.toFixed(1)}{" "}
                    <span style={{ float: "right" }}>Target: {i.m}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="card" style={{ borderRadius: 12 }}>
            <div className="card-header">
              <h3 style={{ margin: 0, fontSize: 15 }}>
                🍽 Distribusi per Waktu Makan
              </h3>
            </div>
            <div className="card-body">
              {["Sarapan", "Makan Siang", "Makan Malam", "Snack"].map((m) => {
                const cal = menus[m].reduce((a, b) => a + b.energi, 0);
                const target = targetSesi[m];
                const pct = calcPct(cal, target);
                return (
                  <div key={m} style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                        fontWeight: 700,
                        marginBottom: 4,
                      }}
                    >
                      <span>{m}</span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 400,
                          color: "var(--txt3)",
                        }}
                      >
                        {cal.toFixed(0)} kkal / target {target} kkal
                      </span>
                    </div>
                    <div
                      style={{
                        height: 16,
                        background: "#f1f5f9",
                        borderRadius: 8,
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: "#10b981",
                          borderRadius: 8,
                        }}
                      ></div>
                      <span
                        style={{
                          position: "absolute",
                          right: 8,
                          top: 1,
                          fontSize: 10,
                          color: pct > 50 ? "#fff" : "#cbd5e1",
                          fontWeight: 700,
                        }}
                      >
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
              {skorGizi < 80 && (
                <div
                  style={{
                    padding: 12,
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#b91c1c",
                    borderRadius: 8,
                    fontSize: 13,
                    marginTop: 16,
                  }}
                >
                  🚫 Skor Gizi Hari Ini: <strong>{skorGizi}%</strong> — Kurang,
                  segera perbaiki menu!
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ borderRadius: 12 }}>
            <div className="card-header">
              <h3 style={{ margin: 0, fontSize: 15 }}>🔍 Validasi Menu</h3>
            </div>
            <div
              className="card-body"
              style={{ display: "flex", flexDirection: "column", gap: 8 }}
            >
              {[
                {
                  label: "Energi dalam rentang normal",
                  ok: skorGizi >= 80 && skorGizi <= 110,
                },
                {
                  label: "Protein ≥ 80% AKG",
                  ok: calcPct(totals.protein, akg.protein) >= 80,
                },
                {
                  label: "Lemak dalam batas GGL",
                  ok: totals.lemak <= akg.lemak,
                },
                {
                  label: "Serat ≥ 70% AKG (>20g)",
                  ok: calcPct(totals.serat, akg.serat || 30) >= 70,
                },
                {
                  label: "Kalsium mencukupi",
                  ok: calcPct(totals.kalsium, akg.kalsium || 1000) >= 80,
                },
                {
                  label: "Harga sesuai target/porsi",
                  ok: totals.harga <= targetHarga,
                },
              ].map((v, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    fontSize: 13,
                    border: `1px solid ${v.ok ? "#bbf7d0" : "#fde68a"}`,
                    background: v.ok ? "#f0fdf4" : "#fefce8",
                    color: v.ok ? "#166534" : "#854d0e",
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <span>{v.ok ? "✅" : "⚠️"}</span> {v.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTargetGizi = () => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      <div className="card" style={{ borderRadius: 12 }}>
        <div className="card-header">
          <h3 style={{ margin: 0, fontSize: 15 }}>
            🎯 Target Gizi Harian (AKG)
          </h3>
        </div>
        <div className="card-body">
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Kelompok Sasaran
          </label>
          <select
            value={sasaran}
            onChange={(e) => setSasaran(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 10,
              border: "1px solid #3b82f6",
              outline: "none",
              fontSize: 14,
              marginBottom: 24,
            }}
          >
            {Object.keys(AKG_GROUPS).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <div style={{ paddingLeft: 16 }}>
            <ul style={{ color: "var(--txt2)", fontSize: 13, lineHeight: 1.8 }}>
              <li>Sarapan: 25% AKG</li>
              <li>Makan Siang: 35% AKG</li>
              <li>Makan Malam: 30% AKG</li>
              <li>Snack: 10% AKG</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card" style={{ borderRadius: 12 }}>
        <div className="card-header">
          <h3 style={{ margin: 0, fontSize: 15 }}>🛒 Pengaturan Pemesanan</h3>
        </div>
        <div className="card-body">
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Jumlah Sasaran (orang)
            </label>
            <input
              type="number"
              value={jumlahSasaran}
              onChange={(e) => setJumlahSasaran(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                fontSize: 14,
              }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Buffer Stock (%)
            </label>
            <input
              type="number"
              value={bufferStock}
              onChange={(e) => setBufferStock(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                fontSize: 14,
              }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Target Harga/Porsi (Rp)
            </label>
            <input
              type="number"
              value={targetHarga}
              onChange={(e) => setTargetHarga(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                fontSize: 14,
              }}
            />
          </div>

          <div
            style={{
              background: "#fafafa",
              padding: 16,
              borderRadius: 10,
              fontSize: 13,
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ marginBottom: 6 }}>
              📋 Total sasaran + buffer:{" "}
              <strong>
                {jumlahSasaran +
                  Math.round(jumlahSasaran * (bufferStock / 100))}{" "}
                orang
              </strong>
            </div>
            <div style={{ marginBottom: 6 }}>
              💰 Budget total/hari:{" "}
              <strong>
                Rp {(jumlahSasaran * targetHarga).toLocaleString("id-ID")}
              </strong>
            </div>
            <div>
              🔥 Total kalori/hari:{" "}
              <strong>
                {targetHarian} kkal × {jumlahSasaran} ={" "}
                {(targetHarian * jumlahSasaran).toLocaleString("id-ID")} kkal
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEstimasi = () => {
    const rekapBahan = allMenus.reduce((acc: any, item: any) => {
      if (!acc[item.nama]) acc[item.nama] = { ...item, gram: 0 };
      acc[item.nama].gram += item.gram;
      return acc;
    }, {});

    const items = Object.values(rekapBahan) as any[];
    const grandTotalHarga = items.reduce(
      (a, b) => a + b.harga * jumlahSasaran,
      0,
    );

    return (
      <div className="card" style={{ borderRadius: 12 }}>
        <div
          className="card-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 16 }}>
              🛒 Estimasi Kebutuhan Bahan Pangan
            </h3>
            <div style={{ fontSize: 12, color: "var(--txt3)", marginTop: 4 }}>
              Berdasarkan menu aktif × {jumlahSasaran} sasaran + {bufferStock}%
              buffer stock
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            style={{ borderRadius: 8 }}
          >
            📤 Export CSV
          </button>
        </div>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>BAHAN MAKANAN</th>
                <th>KATEGORI</th>
                <th>PER PORSI (G)</th>
                <th>KEBUTUHAN BERSIH</th>
                <th>+ BUFFER ({bufferStock}%)</th>
                <th>TOTAL KEBUTUHAN</th>
                <th>ESTIMASI HARGA</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 30 }}>
                    Menu masih kosong.
                  </td>
                </tr>
              ) : (
                items.map((m: any, i) => {
                  const kebBersih = (m.gram * jumlahSasaran) / 1000;
                  const buffer = kebBersih * (bufferStock / 100);
                  const total = kebBersih + buffer;
                  const hargaTotal = m.harga * jumlahSasaran;

                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{m.nama}</td>
                      <td>
                        <span
                          className="badge b-gray"
                          style={{ borderRadius: 6 }}
                        >
                          {m.kategori}
                        </span>
                      </td>
                      <td>{m.gram}g</td>
                      <td>{kebBersih.toFixed(2)} kg</td>
                      <td>{buffer.toFixed(2)} kg</td>
                      <td style={{ fontWeight: 700, color: "var(--g3)" }}>
                        {total.toFixed(2)} kg
                      </td>
                      <td>Rp {hargaTotal.toLocaleString("id-ID")}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div
          style={{
            padding: "16px 24px",
            background: "#fafafa",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: 24,
            fontSize: 14,
          }}
        >
          <div>
            💰 Total Estimasi Biaya:{" "}
            <strong>Rp {grandTotalHarga.toLocaleString("id-ID")}</strong>
          </div>
          <div>
            📦 Total Bahan: <strong>{items.length} item</strong>
          </div>
          <div>
            👥 Sasaran: <strong>{jumlahSasaran} orang</strong>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      <div
        className="topbar"
        style={{ display: "flex", justifyContent: "space-between" }}
      >
        <div className="tb-bread">
          SiGizi MBG / <span>FNCA — Food Nutrition Content Analysis</span>
        </div>
        <button
          style={{
            background: "#1f2937",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          📊 Export CSV
        </button>
      </div>

      <div
        style={{
          background: "#1c4d32",
          color: "white",
          padding: "28px 32px",
          borderRadius: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              margin: "0 0 8px 0",
              fontFamily: "serif",
            }}
          >
            Food Nutrition Content Analysis
          </h1>
          <div style={{ fontSize: 13, color: "#a7f3d0" }}>
            Analisis gizi makanan • Buffer stock • Estimasi pemesanan • Basis
            TKPI + Permenkes 28/2019
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 42,
              fontWeight: 800,
              color: "#f87171",
              lineHeight: 1,
            }}
          >
            {skorGizi}%
          </div>
          <div style={{ fontSize: 13, color: "#a7f3d0", marginTop: 6 }}>
            Skor Gizi Hari Ini
          </div>
        </div>
      </div>

      {/* Navigasi Utama Lapis 1 (Border Radius 10px) */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {[
          "Perencana Menu",
          "Grafik & Analisis",
          "Target Gizi",
          "Estimasi Pemesanan",
        ].map((t) => (
          <button
            key={t}
            onClick={() => setTopTab(t)}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              background: topTab === t ? "#1c4d32" : "#fff",
              color: topTab === t ? "#fff" : "var(--txt2)",
              border: topTab === t ? "none" : "1px solid var(--border)",
              boxShadow:
                topTab === t ? "0 4px 6px -1px rgba(28, 77, 50, 0.2)" : "none",
            }}
          >
            {t === "Perencana Menu"
              ? "🥗"
              : t === "Grafik & Analisis"
                ? "📊"
                : t === "Target Gizi"
                  ? "⚙️"
                  : "🛒"}{" "}
            {t}
          </button>
        ))}
      </div>

      {topTab === "Grafik & Analisis" && renderGrafik()}
      {topTab === "Target Gizi" && renderTargetGizi()}
      {topTab === "Estimasi Pemesanan" && renderEstimasi()}

      {topTab === "Perencana Menu" && (
        <>
          {/* Navigasi Waktu Makan Lapis 2 (Border Radius 10px, bukan 20px lagi) */}
          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            {["Sarapan", "Makan Siang", "Makan Malam", "Snack"].map((t) => (
              <button
                key={t}
                onClick={() => setMealTab(t)}
                style={{
                  position: "relative",
                  padding: "8px 20px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: mealTab === t ? "#22c55e" : "#fff",
                  color: mealTab === t ? "#fff" : "var(--txt2)",
                  border: mealTab === t ? "none" : "1px solid var(--border)",
                }}
              >
                {t === "Sarapan"
                  ? "🌅"
                  : t === "Makan Siang"
                    ? "☀️"
                    : t === "Makan Malam"
                      ? "🌙"
                      : "🍎"}{" "}
                {t}
                {menus[t].length > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      background: "#f59e0b",
                      color: "#fff",
                      fontSize: 10,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {menus[t].length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 340px",
              gap: 24,
              alignItems: "start",
            }}
          >
            <div>
              <div
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: 24,
                  border: "1px solid var(--border)",
                  marginBottom: 24,
                }}
              >
                <h3 style={{ margin: "0 0 6px 0", fontSize: 16 }}>
                  + Tambah Makanan ke {mealTab}
                </h3>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--txt3)",
                    marginBottom: 20,
                  }}
                >
                  Target Sesi: {targetSesi[mealTab]} kkal
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr",
                    gap: 16,
                    marginBottom: 20,
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 8,
                      }}
                    >
                      Cari Bahan (TKPI)
                    </label>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Cari: nasi, ayam..."
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #d1d5db",
                        borderRadius: 10,
                        fontSize: 14,
                      }}
                    />

                    {searchResults.length > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          background: "#fff",
                          border: "1px solid var(--border)",
                          borderRadius: 10,
                          marginTop: 4,
                          zIndex: 10,
                          maxHeight: 250,
                          overflowY: "auto",
                          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                        }}
                      >
                        {searchResults.map((item) => (
                          <div
                            key={item.kode}
                            onClick={() => addFood(item)}
                            style={{
                              padding: "12px",
                              borderBottom: "1px solid #f1f5f9",
                              cursor: "pointer",
                              fontSize: 13,
                            }}
                          >
                            <strong>{item.nama}</strong>{" "}
                            <div style={{ fontSize: 11, color: "var(--txt3)" }}>
                              BDD: {item.bdd}% • E: {item.energi} kkal
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {isSearching && (
                      <div
                        style={{ fontSize: 11, color: "#3b82f6", marginTop: 6 }}
                      >
                        ⏳ Sedang memproses...
                      </div>
                    )}
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 8,
                      }}
                    >
                      Berat (gram)
                    </label>
                    <input
                      type="number"
                      value={qty}
                      onChange={(e) => setQty(Number(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #d1d5db",
                        borderRadius: 10,
                        fontSize: 14,
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={generateRekomendasi}
                    disabled={isSearching}
                    style={{
                      padding: "10px 18px",
                      background: "#faf5ff",
                      border: "1px solid #d8b4fe",
                      color: "#7e22ce",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {isSearching ? "⏳ Meracik..." : "🤖 Rekomendasi Otomatis"}
                  </button>
                  <button
                    onClick={() => setMenus((p) => ({ ...p, [mealTab]: [] }))}
                    style={{
                      padding: "10px 18px",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#b91c1c",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    🗑 Kosongkan
                  </button>
                </div>
              </div>

              <div className="card" style={{ borderRadius: 12 }}>
                <div className="card-header">
                  <h3 style={{ margin: 0, fontSize: 15 }}>☀️ {mealTab}</h3>
                </div>
                <div className="tw" style={{ margin: 0 }}>
                  <table style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>BAHAN</th>
                        <th>KATEGORI</th>
                        <th>GRAM</th>
                        <th>ENERGI</th>
                        <th>PROTEIN</th>
                        <th>HARGA</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {menus[mealTab].length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            style={{ textAlign: "center", padding: 30 }}
                          >
                            Kosong. Klik Rekomendasi Otomatis!
                          </td>
                        </tr>
                      ) : (
                        menus[mealTab].map((m, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{m.nama}</td>
                            <td>
                              <span
                                className="badge b-gray"
                                style={{ fontSize: 10, borderRadius: 6 }}
                              >
                                {m.kategori}
                              </span>
                            </td>
                            <td>{m.gram}g</td>
                            <td>{m.energi.toFixed(1)}</td>
                            <td>{m.protein.toFixed(1)}</td>
                            <td>Rp {m.harga}</td>
                            <td>
                              <button
                                className="btn-icon-sq del"
                                style={{ borderRadius: 8 }}
                                onClick={() => removeFood(i)}
                              >
                                🗑
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 24, borderRadius: 12 }}>
              <h3 style={{ margin: "0 0 20px 0", fontSize: 16 }}>
                🎯 Ringkasan Gizi Hari Ini
              </h3>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 24,
                }}
              >
                <span style={{ fontSize: 13, color: "var(--txt2)" }}>
                  Kelompok:
                </span>
                <span
                  style={{ fontWeight: 700, fontSize: 14, color: "var(--txt)" }}
                >
                  {sasaran}
                </span>
              </div>

              <MiniBar
                label="Energi"
                val={totals.energi}
                max={akg.energi}
                unit="kkal"
              />
              <MiniBar
                label="Protein"
                val={totals.protein}
                max={akg.protein}
                unit="g"
              />
              <MiniBar
                label="Lemak"
                val={totals.lemak}
                max={akg.lemak}
                unit="g"
              />
              <MiniBar
                label="Karbohidrat"
                val={totals.karbo}
                max={akg.karbo}
                unit="g"
              />
              <MiniBar
                label="Serat"
                val={totals.serat}
                max={akg.serat || 30}
                unit="g"
              />
              <MiniBar
                label="Kalsium"
                val={totals.kalsium}
                max={akg.kalsium || 1000}
                unit="mg"
              />
              <MiniBar
                label="Besi"
                val={totals.besi}
                max={akg.besi || 15}
                unit="mg"
              />

              <div
                style={{
                  height: 1,
                  background: "var(--border)",
                  margin: "24px 0",
                }}
              ></div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 24, // Diberi jarak ke bawah untuk tombol
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--txt2)",
                  }}
                >
                  💰 Estimasi Biaya/Porsi
                </div>
                <div
                  style={{ fontSize: 20, fontWeight: 800, color: "#16a34a" }}
                >
                  Rp {totals.harga.toLocaleString("id-ID")}
                </div>
              </div>

              {/* === TOMBOL SIMPAN DATABASE BARU ADA DI SINI === */}
              <button
                onClick={saveMenuToDatabase}
                disabled={isSaving || allMenus.length === 0}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "#1c4d32",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontWeight: 700,
                  cursor:
                    isSaving || allMenus.length === 0
                      ? "not-allowed"
                      : "pointer",
                  opacity: isSaving || allMenus.length === 0 ? 0.6 : 1,
                }}
              >
                {isSaving
                  ? "⏳ Menyimpan ke Database..."
                  : "💾 Simpan Rencana Menu"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
