// File: src/pages/AntropometriPage.tsx
import { useState } from "react";
import { Modal } from "../components/Modal";
import { AlertBox } from "../components/AlertBox";
import { ANTRO_DATA, SEKOLAH_DATA } from "../utils/constants";

export default function AntropometriPage() {
  const [data] = useState(ANTRO_DATA);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");

  // Mapping konfigurasi UI untuk status gizi
  const statusMap: Record<
    string,
    { label: string; badge: string; color: string }
  > = {
    normal: { label: "Normal", badge: "b-green", color: "#22c55e" },
    kurus: { label: "Kurus", badge: "b-gold", color: "#f59e0b" },
    gemuk: { label: "Gemuk", badge: "b-pink", color: "#ec4899" },
    stunting: { label: "Stunting", badge: "b-red", color: "#ef4444" },
  };

  // Logika filter & pencarian
  const filtered = data.filter((d) => {
    const matchSearch =
      (d.nama || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.sekolah || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterStatus === "Semua" || d.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const counts = {
    normal: data.filter((d) => d.status === "normal").length,
    kurus: data.filter((d) => d.status === "kurus").length,
    gemuk: data.filter((d) => d.status === "gemuk").length,
    stunting: data.filter((d) => d.status === "stunting").length,
  };

  return (
    <div>
      <div className="topbar">
        <div className="tb-bread">
          SiGizi MBG / <span>Pemantauan Antropometri</span>
        </div>
      </div>

      <div className="ph">
        <div className="ph-title">Pemantauan Antropometri</div>
        <div className="ph-sub">
          Pengukuran bulanan BB, TB, LK, LILA penerima manfaat MBG
        </div>
      </div>

      {/* Grid Statistik */}
      <div className="sg sg-4">
        {[
          { icon: "✅", color: "#d8f3dc", val: counts.normal, lbl: "Normal" },
          { icon: "⚠️", color: "#fef3c7", val: counts.kurus, lbl: "Kurus" },
          {
            icon: "🔴",
            color: "#fee2e2",
            val: counts.stunting,
            lbl: "Stunting",
          },
          { icon: "📊", color: "#fce7f3", val: counts.gemuk, lbl: "Gemuk" },
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

      {/* Bar Distribusi Status */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="ch-title">📊 Distribusi Status Gizi</div>
        </div>
        <div className="card-body">
          <div className="antro-status-bar">
            {Object.entries(counts).map(([k, v]) => (
              <div
                key={k}
                style={{ flex: v || 0, background: statusMap[k].color }}
                title={`${statusMap[k].label}: ${v}`}
              ></div>
            ))}
          </div>
          <div
            style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}
          >
            {Object.entries(counts).map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: statusMap[k].color,
                  }}
                ></div>
                {statusMap[k].label}: <strong>{v}</strong> (
                {data.length > 0 ? Math.round((v / data.length) * 100) : 0}%)
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabel Data Siswa */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="ch-title">📋 Data Siswa</div>
            <div className="ch-sub">
              {filtered.length} dari {data.length} siswa
            </div>
          </div>
          <div className="ch-right">
            <div className="search-wrap">
              <span>🔍</span>
              <input
                className="search-inp"
                placeholder="Cari nama, sekolah..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="ftabs">
              {["Semua", "normal", "kurus", "gemuk", "stunting"].map((f) => (
                <div
                  key={f}
                  className={`ftab ${filterStatus === f ? "active" : ""}`}
                  onClick={() => setFilterStatus(f)}
                >
                  {f === "Semua" ? "Semua" : statusMap[f].label}
                </div>
              ))}
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setModalOpen(true)}
            >
              ＋ Input Data
            </button>
          </div>
        </div>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Nama Siswa</th>
                <th>Sekolah</th>
                <th>Kelas</th>
                <th>BB (kg)</th>
                <th>TB (cm)</th>
                <th>BMI</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const bmi =
                  d.bb && d.tb ? (d.bb / (d.tb / 100) ** 2).toFixed(1) : 0;
                return (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600 }}>{d.nama}</td>
                    <td style={{ fontSize: 12, color: "var(--txt3)" }}>
                      {d.sekolah}
                    </td>
                    <td>{d.kelas}</td>
                    <td>{d.bb}</td>
                    <td>{d.tb}</td>
                    <td style={{ fontWeight: 700 }}>{bmi}</td>
                    <td>
                      <span
                        className={`badge ${statusMap[d.status]?.badge || "b-green"}`}
                      >
                        {statusMap[d.status]?.label || d.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn-icon-sq" style={{ fontSize: 12 }}>
                        ✏️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty">
              Tidak ada data yang cocok dengan pencarian.
            </div>
          )}
        </div>
      </div>

      {/* Modal Input Data */}
      {modalOpen && (
        <Modal
          title="Input Data Antropometri"
          sub="Pengukuran bulanan penerima manfaat"
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
              <label className="fl">Nama Siswa</label>
              <input className="fi" placeholder="Contoh: Ahmad Rizky" />
            </div>
            <div className="fr">
              <div className="fg">
                <label className="fl">Sekolah</label>
                <select className="fs">
                  {SEKOLAH_DATA.map((sk) => (
                    <option key={sk.id}>{sk.nama}</option>
                  ))}
                </select>
              </div>
              <div className="fg">
                <label className="fl">Kelas</label>
                <input className="fi" placeholder="4A" />
              </div>
            </div>
            <div className="fr4" style={{ marginTop: 10 }}>
              <div className="fg">
                <label className="fl">BB (kg)</label>
                <input className="fi" type="number" />
              </div>
              <div className="fg">
                <label className="fl">TB (cm)</label>
                <input className="fi" type="number" />
              </div>
              <div className="fg">
                <label className="fl">LK (cm)</label>
                <input className="fi" type="number" />
              </div>
              <div className="fg">
                <label className="fl">LILA (cm)</label>
                <input className="fi" type="number" />
              </div>
            </div>
            <AlertBox type="info" style={{ marginTop: 10 }}>
              BMI dan Status Gizi akan dihitung otomatis saat Anda menyimpan
              data.
            </AlertBox>
          </div>
        </Modal>
      )}
    </div>
  );
}
