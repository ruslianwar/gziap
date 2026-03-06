// File: src/pages/TargetGiziPage.tsx
import { AlertBox } from "../components/AlertBox";
import { AKG_GROUPS } from "../utils/constants";

export default function TargetGiziPage() {
  return (
    <div>
      <div className="topbar">
        <div className="tb-bread">
          SiGizi MBG / <span>Target & AKG</span>
        </div>
      </div>
      <div className="ph">
        <div className="ph-title">Target Gizi & AKG</div>
        <div className="ph-sub">
          Angka Kecukupan Gizi per kelompok sasaran — Permenkes No. 28 Tahun
          2019
        </div>
      </div>

      <AlertBox type="info" style={{ marginBottom: 16 }}>
        📌 Data AKG ini berdasarkan{" "}
        <strong>Peraturan Menteri Kesehatan No. 28 Tahun 2019</strong> tentang
        Angka Kecukupan Gizi yang Dianjurkan untuk Masyarakat Indonesia.
      </AlertBox>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="ch-title">
            📊 Tabel AKG Lengkap — Kelompok Sasaran
          </div>
        </div>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Kelompok Sasaran</th>
                <th>Energi (kkal)</th>
                <th>Protein (g)</th>
                <th>Lemak (g)</th>
                <th>Karbo (g)</th>
                <th>Serat (g)</th>
                <th>Kalsium (mg)</th>
                <th>Besi (mg)</th>
                <th>Target Sarapan (25%)</th>
                <th>Target Siang (35%)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(AKG_GROUPS).map(([k, v]) => (
                <tr key={k}>
                  <td style={{ fontWeight: 700 }}>{k}</td>
                  <td>{v.energi}</td>
                  <td>{v.protein}</td>
                  <td>{v.lemak}</td>
                  <td>{v.karbo}</td>
                  <td>{v.serat}</td>
                  <td>{v.kalsium}</td>
                  <td>{v.besi}</td>
                  <td style={{ color: "var(--g3)", fontWeight: 600 }}>
                    {Math.round(v.energi * 0.25)} kkal
                  </td>
                  <td style={{ color: "var(--blue)", fontWeight: 600 }}>
                    {Math.round(v.energi * 0.35)} kkal
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <div className="card-header">
            <div className="ch-title">📋 Pembagian Waktu Makan</div>
          </div>
          <div className="card-body">
            {[
              [
                "🌅 Sarapan",
                "25%",
                "Energi, protein, karbohidrat untuk aktivitas pagi",
              ],
              [
                "☀️ Makan Siang",
                "35%",
                "Terbesar — energi penuh untuk aktivitas siang",
              ],
              ["🌙 Makan Malam", "30%", "Pemulihan nutrisi setelah aktivitas"],
              ["🍎 Snack", "10%", "Camilan bergizi, buah, atau fortifikasi"],
            ].map(([w, p, d], i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom: i < 3 ? "1px solid #f5f5f5" : "none",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "var(--g6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {w.split(" ")[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {w.slice(2)} <span style={{ color: "var(--g3)" }}>{p}</span>
                  </div>
                  <div
                    style={{ fontSize: 12, color: "var(--txt3)", marginTop: 2 }}
                  >
                    {d}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="ch-title">⚠️ Batas GGL (Gula, Garam, Lemak)</div>
          </div>
          <div className="card-body">
            <AlertBox type="warn" style={{ marginBottom: 12 }}>
              Batas maksimal harian sesuai Permenkes untuk mencegah penyakit
              tidak menular
            </AlertBox>
            {[
              ["🍬 Gula", "≤ 50 g/hari", "≈ 4 sendok makan"],
              ["🧂 Garam (Natrium)", "≤ 2000 mg/hari", "≈ 1 sendok teh"],
              ["🧈 Lemak", "≤ 67 g/hari", "Semua sumber lemak gabungan"],
            ].map(([ic, val, eq], i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: i < 2 ? "1px solid #f5f5f5" : "none",
                  fontSize: 13,
                }}
              >
                <span style={{ fontWeight: 600 }}>{ic}</span>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: "var(--red)" }}>
                    {val}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--txt3)" }}>{eq}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
