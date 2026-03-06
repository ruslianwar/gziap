// File: src/pages/CycleMenuPage.tsx
import { useState, useEffect } from "react";
import { Modal } from "../components/Modal";
import { supabase } from "../config/supabaseClient";

export default function CycleMenuPage() {
  const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
  const [week, setWeek] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // State menu menggunakan struktur asli prototipe Anda
  const [menus, setMenus] = useState<Record<number, any[]>>({
    1: [],
    2: [],
    3: [],
    4: [],
  });

  // State untuk form tambah manual (Modal)
  const [newMenu, setNewMenu] = useState({
    hari: "Senin",
    nama: "",
    lauk: "",
    buah: "",
    kal: 0,
    protein: 0,
    karbo: 0,
    lemak: 0,
    serat: 0,
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

  return (
    <div>
      <div className="topbar">
        <div className="tb-bread">
          SiGizi MBG / <span>Cycle Menu</span>
        </div>
      </div>
      <div className="ph">
        <div className="ph-title">Cycle Menu</div>
        <div className="ph-sub">
          Rencana menu harian MBG dengan validasi AKG otomatis (Terhubung
          Database)
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
            className="btn btn-primary btn-sm"
            onClick={() => setModalOpen(true)}
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
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 8px",
                  background: "var(--g6)",
                  color: "var(--g1)",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  marginTop: 8,
                }}
              >
                🔥 {m.kal} kkal
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  flexWrap: "wrap",
                  marginTop: 6,
                }}
              >
                <span
                  style={{
                    padding: "2px 6px",
                    borderRadius: 5,
                    fontSize: 10,
                    fontWeight: 700,
                    background: "#fef3c7",
                    color: "#92400e",
                  }}
                >
                  K {m.karbo}g
                </span>
                <span
                  style={{
                    padding: "2px 6px",
                    borderRadius: 5,
                    fontSize: 10,
                    fontWeight: 700,
                    background: "#e0e7ff",
                    color: "#3730a3",
                  }}
                >
                  P {m.protein}g
                </span>
                <span
                  style={{
                    padding: "2px 6px",
                    borderRadius: 5,
                    fontSize: 10,
                    fontWeight: 700,
                    background: "#fce7f3",
                    color: "#831843",
                  }}
                >
                  L {m.lemak}g
                </span>
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
                <button className="btn-icon-sq" style={{ fontSize: 12 }}>
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

      {/* Modal Tambah Menu (Dipertahankan 100% Sesuai Asli) */}
      {modalOpen && (
        <Modal
          title="Tambah Menu"
          sub="Data menu harian MBG"
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setModalOpen(false)}
              >
                Batal
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  alert(
                    "Gunakan FNCA Kalkulator untuk menambah menu riil ke Database.",
                  );
                  setModalOpen(false);
                }}
              >
                Simpan Data
              </button>
            </>
          }
        >
          <div>
            <div className="fr">
              <div className="fg">
                <label className="fl">Hari</label>
                <select
                  className="fs"
                  value={newMenu.hari}
                  onChange={(e) =>
                    setNewMenu({ ...newMenu, hari: e.target.value })
                  }
                >
                  {HARI.map((h) => (
                    <option key={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div className="fg">
                <label className="fl">Nama Menu</label>
                <input
                  className="fi"
                  placeholder="Nasi Ayam Bumbu Kuning"
                  value={newMenu.nama}
                  onChange={(e) =>
                    setNewMenu({ ...newMenu, nama: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="fg">
              <label className="fl">Lauk & Sayur</label>
              <input
                className="fi"
                placeholder="Ayam kuning, tempe goreng, bayam bening"
                value={newMenu.lauk}
                onChange={(e) =>
                  setNewMenu({ ...newMenu, lauk: e.target.value })
                }
              />
            </div>
            <div className="fg">
              <label className="fl">Buah</label>
              <input
                className="fi"
                placeholder="Pepaya"
                value={newMenu.buah}
                onChange={(e) =>
                  setNewMenu({ ...newMenu, buah: e.target.value })
                }
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 10,
              }}
            >
              {[
                { k: "kal", l: "Kalori" },
                { k: "karbo", l: "Karbo" },
                { k: "protein", l: "Protein" },
                { k: "lemak", l: "Lemak" },
                { k: "serat", l: "Serat" },
              ].map((item) => (
                <div key={item.k} className="fg">
                  <label className="fl">{item.l}</label>
                  <input
                    className="fi"
                    type="number"
                    value={newMenu[item.k as keyof typeof newMenu]}
                    onChange={(e) =>
                      setNewMenu({
                        ...newMenu,
                        [item.k]: Number(e.target.value),
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
