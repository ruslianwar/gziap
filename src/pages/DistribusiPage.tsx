// File: src/pages/DistribusiPage.tsx
import { useState } from "react";
import { ProgBar } from "../components/ProgBar";
import { Modal } from "../components/Modal";
import { DIST_BASE, formatRp } from "../utils/constants";

export default function DistribusiPage() {
  const dates = Object.keys(DIST_BASE).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );
  const [selDate, setSelDate] = useState(dates[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const records = DIST_BASE[selDate] || [];
  const selesai = records.filter((r) => r.status === "selesai").length;
  const totalPlan = records.reduce((a, r) => a + r.plan, 0);
  const totalReal = records.reduce((a, r) => a + r.real, 0);
  const pct = totalPlan ? Math.round((totalReal / totalPlan) * 100) : 0;

  const statMap: Record<string, { badge: string; lbl: string }> = {
    selesai: { badge: "b-green", lbl: "Selesai" },
    proses: { badge: "b-gold", lbl: "Proses" },
    belum: { badge: "b-gray", lbl: "Belum" },
  };

  const handleEditClick = (item: any) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  return (
    <div>
      <div className="topbar">
        <div className="tb-bread">
          SiGizi MBG / <span>Distribusi Makanan</span>
        </div>
      </div>

      <div className="ph">
        <div className="ph-title">Distribusi Makanan</div>
        <div className="ph-sub">
          Pemantauan realisasi distribusi MBG per sekolah per hari
        </div>
      </div>

      {/* Grid Statistik */}
      <div className="sg sg-4">
        {[
          {
            icon: "✅",
            color: "#d8f3dc",
            val: `${selesai}/${records.length}`,
            lbl: "Sekolah Selesai",
          },
          {
            icon: "🍱",
            color: "#e0e7ff",
            val: formatRp(totalPlan),
            lbl: "Rencana Porsi",
          },
          {
            icon: "📦",
            color: "#fef3c7",
            val: formatRp(totalReal),
            lbl: "Porsi Terealisasi",
          },
          { icon: "📊", color: "#fce7f3", val: `${pct}%`, lbl: "Realisasi" },
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

      {/* Baris Progress Keseluruhan */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header">
          <div className="ch-title">📊 Realisasi Keseluruhan ({selDate})</div>
        </div>
        <div className="card-body">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              marginBottom: 6,
            }}
          >
            <span>
              {formatRp(totalReal)} dari {formatRp(totalPlan)} porsi
            </span>
            <span style={{ fontWeight: 700, color: "var(--g3)" }}>{pct}%</span>
          </div>
          <ProgBar
            val={pct}
            max={100}
            color={pct === 100 ? "#22c55e" : pct > 50 ? "#40916c" : "#e9c46a"}
            className="prog-lg"
          />
        </div>
      </div>

      {/* Filter Tanggal */}
      <div className="ftabs" style={{ marginBottom: 16 }}>
        {dates.map((d) => (
          <div
            key={d}
            className={`ftab ${selDate === d ? "active" : ""}`}
            onClick={() => setSelDate(d)}
          >
            {new Date(d).toLocaleDateString("id-ID", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </div>
        ))}
      </div>

      {/* Tabel Distribusi */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="ch-title">Rincian per Sekolah</div>
          </div>
        </div>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Sekolah</th>
                <th>Rencana</th>
                <th>Realisasi</th>
                <th>Progress</th>
                <th>Jam</th>
                <th>Status</th>
                <th>Catatan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.sekolah}</td>
                  <td>{formatRp(r.plan)}</td>
                  <td style={{ fontWeight: 700 }}>{formatRp(r.real)}</td>
                  <td style={{ minWidth: 130 }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <ProgBar
                        val={r.real}
                        max={r.plan}
                        color={r.status === "selesai" ? "#22c55e" : "#f59e0b"}
                      />
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "var(--txt3)",
                          width: 28,
                        }}
                      >
                        {r.plan ? Math.round((r.real / r.plan) * 100) : 0}%
                      </span>
                    </div>
                  </td>
                  <td>{r.jam}</td>
                  <td>
                    <span
                      className={`badge ${statMap[r.status]?.badge || "b-gray"}`}
                    >
                      {statMap[r.status]?.lbl || r.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: "var(--txt3)" }}>
                    {r.catatan || "—"}
                  </td>
                  <td>
                    <button
                      className="btn-icon-sq"
                      onClick={() => handleEditClick(r)}
                    >
                      ✏️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Update Distribusi */}
      {modalOpen && selectedItem && (
        <Modal
          title="Update Distribusi"
          sub={selectedItem.sekolah}
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
            <div className="fr">
              <div className="fg">
                <label className="fl">Porsi Terealisasi</label>
                <input
                  className="fi"
                  type="number"
                  defaultValue={selectedItem.real}
                />
              </div>
              <div className="fg">
                <label className="fl">Status</label>
                <select className="fs" defaultValue={selectedItem.status}>
                  <option value="belum">Belum</option>
                  <option value="proses">Proses</option>
                  <option value="selesai">Selesai</option>
                </select>
              </div>
            </div>
            <div className="fg">
              <label className="fl">Jam Distribusi</label>
              <input
                className="fi"
                type="time"
                defaultValue={selectedItem.jam !== "-" ? selectedItem.jam : ""}
              />
            </div>
            <div className="fg">
              <label className="fl">Catatan</label>
              <textarea
                className="fi"
                defaultValue={selectedItem.catatan}
                style={{ minHeight: 70 }}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
