// File: src/pages/SupplyChainPage.tsx
import { useState } from "react";
import { Modal } from "../components/Modal";
import { AlertBox } from "../components/AlertBox";
import { SUPPLIER_DATA, formatRp } from "../utils/constants";

export default function SupplyChainPage() {
  const [suppliers] = useState(SUPPLIER_DATA);
  // State untuk mengontrol Modal terbuka/tertutup. null = tertutup.
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Data survei harga (dummy)
  const hargaData = [
    {
      id: 1,
      bahan: "Beras premium",
      harga_pasar: 13500,
      het: 14000,
      toko: "Pasar Ungaran",
      status: "ok",
    },
    {
      id: 2,
      bahan: "Ayam potong",
      harga_pasar: 38000,
      het: 35000,
      toko: "Pasar Bawen",
      status: "melebihi",
    },
  ];

  return (
    <div>
      <div className="topbar">
        <div className="tb-bread">
          SiGizi MBG / <span>Supply Chain</span>
        </div>
      </div>

      <div className="ph">
        <div className="ph-title">Supply Chain & Manajemen Supplier</div>
        <div className="ph-sub">
          Data supplier lokal, survei harga pasar, dan validasi HET
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 15 }}>
          Daftar Supplier Lokal
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setModalOpen(true)}
        >
          ＋ Tambah Supplier
        </button>
      </div>

      {/* Grid Supplier */}
      <div className="sc-grid" style={{ marginBottom: 20 }}>
        {suppliers.map((s) => (
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
                  width: 42,
                  height: 42,
                  borderRadius: 11,
                  background: s.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                {s.nama[0]}
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
              style={{ fontSize: 12, color: "var(--txt3)", marginBottom: 8 }}
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
              <span className="badge b-green">{s.jenis}</span>
              <span className="badge b-green">{s.status}</span>
            </div>
            <div
              style={{ fontSize: 12, color: "var(--txt2)", marginBottom: 4 }}
            >
              🛒 {s.komoditas}
            </div>
            <div style={{ fontSize: 12, color: "var(--txt3)" }}>
              👤 {s.kontak} · 📱 {s.no_hp}
            </div>
          </div>
        ))}
      </div>

      {/* Tabel Survei Harga */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="ch-title">📊 Survei Harga Pasar Mingguan</div>
            <div className="ch-sub">
              Validasi vs HET / Indeks Kemahalan Wilayah
            </div>
          </div>
        </div>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Bahan Pangan</th>
                <th>Harga Pasar</th>
                <th>HET/Batas</th>
                <th>Lokasi</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {hargaData.map((h) => (
                <tr key={h.id}>
                  <td style={{ fontWeight: 600 }}>{h.bahan}</td>
                  <td>Rp {formatRp(h.harga_pasar)}</td>
                  <td>Rp {formatRp(h.het)}</td>
                  <td>{h.toko}</td>
                  <td>
                    {h.status === "melebihi" ? (
                      <AlertBox type="err" style={{ marginBottom: 0 }}>
                        Melebihi HET
                      </AlertBox>
                    ) : (
                      <AlertBox type="ok" style={{ marginBottom: 0 }}>
                        Normal
                      </AlertBox>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Komponen Modal yang akan muncul jika modalOpen bernilai true */}
      {modalOpen && (
        <Modal
          title="Tambah Supplier"
          sub="Data supplier lokal MBG"
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
          {/* Isi Form di dalam Modal */}
          <div>
            <div className="fg">
              <label className="fl">Nama Supplier</label>
              <input className="fi" placeholder="Contoh: UD Maju Bersama" />
            </div>
            <div className="fr">
              <div className="fg">
                <label className="fl">Jenis</label>
                <select className="fs">
                  <option>UMKM</option>
                  <option>BUM Desa</option>
                  <option>Koperasi</option>
                </select>
              </div>
              <div className="fg">
                <label className="fl">Kecamatan</label>
                <input className="fi" placeholder="Ungaran Barat" />
              </div>
            </div>
            <div className="fg">
              <label className="fl">Komoditas</label>
              <input className="fi" placeholder="Sayur mayur segar" />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
