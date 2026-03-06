// File: src/pages/InventarisPage.tsx
import { useState } from "react";
import { Modal } from "../components/Modal";
import { AlertBox } from "../components/AlertBox";
import { STOK_DATA, formatRp } from "../utils/constants";

export default function InventarisPage() {
  const [stok] = useState(STOK_DATA);
  const [modalOpen, setModalOpen] = useState(false);

  // Logika FIFO & Notifikasi
  const isLow = (item: any) => item.stok < item.min;
  const isExpiring = (item: any) => {
    const diff =
      (new Date(item.kadaluarsa).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24);
    return diff <= 2 && diff >= 0; // Kadaluarsa dalam 2 hari atau kurang
  };
  const isExpired = (item: any) => new Date(item.kadaluarsa) < new Date();

  const counts = {
    total: stok.length,
    low: stok.filter(isLow).length,
    expiring: stok.filter(isExpiring).length,
    expired: stok.filter(isExpired).length,
  };

  return (
    <div>
      <div className="topbar">
        <div className="tb-bread">
          SiGizi MBG / <span>Inventaris & Stok</span>
        </div>
      </div>

      <div className="ph">
        <div className="ph-title">Inventaris & Buffer Stock</div>
        <div className="ph-sub">
          Manajemen stok gudang metode FIFO — First In, First Out
        </div>
      </div>

      {/* Grid Statistik */}
      <div className="sg sg-4">
        {[
          {
            icon: "📦",
            color: "#d8f3dc",
            val: counts.total,
            lbl: "Total Item",
          },
          {
            icon: "⚠️",
            color: "#fef3c7",
            val: counts.low,
            lbl: "Stok Minimum",
          },
          {
            icon: "⏰",
            color: "#ffedd5",
            val: counts.expiring,
            lbl: "Segera Kadaluarsa",
          },
          {
            icon: "🚫",
            color: "#fee2e2",
            val: counts.expired,
            lbl: "Sudah Kadaluarsa",
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

      {/* Peringatan Stok Rendah */}
      {counts.low > 0 && (
        <AlertBox type="warn" style={{ marginBottom: 16 }}>
          ⚠️{" "}
          <strong>
            {stok
              .filter(isLow)
              .map((s) => s.nama)
              .join(", ")}
          </strong>{" "}
          — stok di bawah minimum, segera lakukan pemesanan!
        </AlertBox>
      )}

      {/* Tabel Stok Gudang (Diurutkan berdasarkan tanggal masuk/FIFO) */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="ch-title">📋 Daftar Stok Gudang (FIFO)</div>
            <div className="ch-sub">Diurutkan berdasarkan tanggal masuk</div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setModalOpen(true)}
          >
            ＋ Tambah Stok
          </button>
        </div>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Bahan Pangan</th>
                <th>Stok</th>
                <th>Satuan</th>
                <th>Min. Stok</th>
                <th>Tgl Masuk</th>
                <th>Kadaluarsa</th>
                <th>Supplier</th>
                <th>Harga/Sat</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {/* Urutkan data berdasarkan tanggal masuk paling lama ke baru (FIFO) */}
              {[...stok]
                .sort(
                  (a, b) =>
                    new Date(a.masuk).getTime() - new Date(b.masuk).getTime(),
                )
                .map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      background: isExpired(item)
                        ? "#fff5f5"
                        : isLow(item)
                          ? "#fffbeb"
                          : "",
                    }}
                  >
                    <td style={{ fontWeight: 600 }}>{item.nama}</td>
                    <td
                      style={{
                        fontWeight: 700,
                        color: isLow(item) ? "#ef4444" : "var(--txt)",
                      }}
                    >
                      {formatRp(item.stok)}
                    </td>
                    <td>{item.sat}</td>
                    <td style={{ color: "var(--txt3)" }}>
                      {formatRp(item.min)}
                    </td>
                    <td>{item.masuk}</td>
                    <td
                      style={{
                        color: isExpired(item)
                          ? "#ef4444"
                          : isExpiring(item)
                            ? "#f59e0b"
                            : "var(--txt)",
                      }}
                    >
                      {item.kadaluarsa}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--txt3)" }}>
                      {item.supplier}
                    </td>
                    <td>Rp {formatRp(item.harga)}</td>
                    <td>
                      {isExpired(item) ? (
                        <span className="badge b-red">Kadaluarsa</span>
                      ) : isExpiring(item) ? (
                        <span className="badge b-orange">Hampir Exp</span>
                      ) : isLow(item) ? (
                        <span className="badge b-gold">Stok Rendah</span>
                      ) : (
                        <span className="badge b-green">Normal</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          className="btn-icon-sq"
                          style={{ fontSize: 12 }}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon-sq del"
                          style={{ fontSize: 12 }}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Stok */}
      {modalOpen && (
        <Modal
          title="Tambah Stok Masuk"
          sub="Sistem Inventaris FIFO"
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
              <label className="fl">Nama Bahan Pangan</label>
              <input className="fi" placeholder="Contoh: Beras Premium" />
            </div>
            <div className="fr">
              <div className="fg">
                <label className="fl">Jumlah (Qty)</label>
                <input className="fi" type="number" />
              </div>
              <div className="fg">
                <label className="fl">Satuan</label>
                <select className="fs">
                  <option>kg</option>
                  <option>liter</option>
                  <option>ikat</option>
                  <option>butir</option>
                </select>
              </div>
            </div>
            <div className="fr">
              <div className="fg">
                <label className="fl">Tgl Masuk</label>
                <input className="fi" type="date" />
              </div>
              <div className="fg">
                <label className="fl">Tgl Kadaluarsa</label>
                <input className="fi" type="date" />
              </div>
            </div>
            <div className="fg">
              <label className="fl">Supplier</label>
              <input className="fi" placeholder="Pilih Supplier..." />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
