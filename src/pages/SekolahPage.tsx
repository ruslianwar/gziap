// File: src/pages/SekolahPage.tsx
import { useState } from "react";
import { Modal } from "../components/Modal";
import { SEKOLAH_DATA } from "../utils/constants";

export default function SekolahPage() {
  const [sekolahs] = useState(SEKOLAH_DATA);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Semua");

  // Logika pencarian dan filter tingkat sekolah
  const filtered = sekolahs.filter((s) => {
    const matchSearch =
      (s.nama || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.kecamatan || "").toLowerCase().includes(search.toLowerCase());
    return matchSearch && (filter === "Semua" || s.tingkat === filter);
  });

  return (
    <div>
      <div className="topbar">
        <div className="tb-bread">
          SiGizi MBG / <span>Data Sekolah</span>
        </div>
      </div>

      <div className="ph">
        <div className="ph-title">Data Sekolah</div>
        <div className="ph-sub">
          Daftar sekolah dan kelompok sasaran program MBG
        </div>
      </div>

      {/* Grid Statistik */}
      <div className="sg sg-4">
        {[
          {
            icon: "🏫",
            color: "#d8f3dc",
            val: sekolahs.length,
            lbl: "Total Sekolah",
          },
          {
            icon: "✅",
            color: "#dcfce7",
            val: sekolahs.filter((s) => s.status === "aktif").length,
            lbl: "Sekolah Aktif",
          },
          {
            icon: "👨‍🎓",
            color: "#e0e7ff",
            val: sekolahs
              .reduce((a, s) => a + (Number(s.siswa) || 0), 0)
              .toLocaleString("id-ID"),
            lbl: "Total Siswa",
          },
          {
            icon: "📍",
            color: "#fef3c7",
            val: [...new Set(sekolahs.map((s) => s.kecamatan))].length,
            lbl: "Kecamatan Terjangkau",
          },
        ].map((s, i) => (
          <div key={i} className="sc">
            <div className="sc-icon" style={{ background: s.color }}>
              {s.icon}
            </div>
            <div className="sc-val">{s.val}</div>
            <div className="sc-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Baris Pencarian & Tombol Tambah */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div className="search-wrap">
            <span>🔍</span>
            <input
              className="search-inp"
              placeholder="Cari nama, kecamatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="ftabs">
            {["Semua", "SD", "SMP", "SMA"].map((f) => (
              <div
                key={f}
                className={`ftab ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </div>
            ))}
          </div>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setModalOpen(true)}
        >
          ＋ Tambah Sekolah
        </button>
      </div>

      {/* Grid Data Sekolah */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
        }}
      >
        {filtered.map((s) => (
          <div key={s.id} className="supplier-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: s.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                {s.tingkat}
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button className="btn-icon-sq" style={{ fontSize: 12 }}>
                  ✏️
                </button>
                <button className="btn-icon-sq del" style={{ fontSize: 12 }}>
                  🗑
                </button>
              </div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>
              {s.nama}
            </div>
            <div
              style={{ fontSize: 12, color: "var(--txt3)", marginBottom: 6 }}
            >
              📍 {s.kecamatan}
            </div>

            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginBottom: 8,
              }}
            >
              <span
                className={`badge ${s.tingkat === "SD" ? "b-blue" : s.tingkat === "SMP" ? "b-pink" : "b-gold"}`}
              >
                {s.tingkat}
              </span>
              <span
                className={`badge ${s.status === "aktif" ? "b-green" : "b-red"}`}
              >
                {s.status}
              </span>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div
                style={{
                  padding: "3px 8px",
                  background: "var(--cream)",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                👨‍🎓 {s.siswa} siswa
              </div>
              <div
                style={{
                  padding: "3px 8px",
                  background: "var(--cream)",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                🏛 {s.kelas} kelas
              </div>
            </div>

            <div style={{ fontSize: 12, color: "var(--txt3)", marginTop: 6 }}>
              👤 Operator: {s.operator}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--g3)",
                marginTop: 4,
                fontWeight: 600,
              }}
            >
              🎯 AKG: {s.kelompok || s.tingkat}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Tambah Sekolah */}
      {modalOpen && (
        <Modal
          title="Tambah Sekolah"
          sub="Data sekolah peserta MBG"
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
                onClick={() => setModalOpen(false)}
              >
                Simpan Data
              </button>
            </>
          }
        >
          <div>
            <div className="fg">
              <label className="fl">Nama Sekolah</label>
              <input className="fi" placeholder="Contoh: SDN 01 Ungaran" />
            </div>
            <div className="fr">
              <div className="fg">
                <label className="fl">Kecamatan</label>
                <input className="fi" placeholder="Ungaran Barat" />
              </div>
              <div className="fg">
                <label className="fl">Tingkat</label>
                <select className="fs">
                  <option>SD</option>
                  <option>SMP</option>
                  <option>SMA</option>
                </select>
              </div>
            </div>
            <div className="fr">
              <div className="fg">
                <label className="fl">Jumlah Siswa</label>
                <input className="fi" type="number" />
              </div>
              <div className="fg">
                <label className="fl">Jumlah Kelas</label>
                <input className="fi" type="number" />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
