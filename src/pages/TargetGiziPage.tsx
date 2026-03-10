// File: src/pages/TargetGiziPage.tsx
import { AlertBox } from "../components/AlertBox";

// --- STANDAR BAKU MBG (BERDASARKAN TABEL 2 JUKNIS BGN 2026 & PERMENKES 28/2019) ---
const TARGET_GROUPS: Record<string, any> = {
  tk_paud: { label: "Siswa TK/PAUD/TK LB", waktu: "Pagi", akgMin: 20, akgMax: 25, minE: 280, maxE: 350, minP: 5.0, maxP: 6.3, minL: 10.0, maxL: 12.5, minK: 44.0, maxK: 55.0, minS: 3.2, maxS: 4.0, budgetTarget: 8000 },
  sd_1_3: { label: "Siswa SD/MI/SDLB Kelas 1-3", waktu: "Pagi", akgMin: 20, akgMax: 25, minE: 330, maxE: 413, minP: 8.0, maxP: 10.0, minL: 11.0, maxL: 13.8, minK: 50.0, maxK: 62.5, minS: 4.4, maxS: 5.5, budgetTarget: 8000 },
  sd_4_6: { label: "Siswa SD/MI/SDLB Kelas 4-6", waktu: "Siang", akgMin: 30, akgMax: 35, minE: 585, maxE: 683, minP: 15.8, maxP: 18.4, minL: 19.5, maxL: 22.8, minK: 87.0, maxK: 101.5, minS: 7.8, maxS: 9.1, budgetTarget: 10000 },
  smp: { label: "Siswa SMP/MTs/SMPLB", waktu: "Siang", akgMin: 30, akgMax: 35, minE: 668, maxE: 779, minP: 20.3, maxP: 23.6, minL: 22.5, maxL: 26.3, minK: 97.5, maxK: 113.8, minS: 9.0, maxS: 10.5, budgetTarget: 10000 },
  sma: { label: "Siswa SMA/SMK/MA/SMALB", waktu: "Siang", akgMin: 30, akgMax: 35, minE: 713, maxE: 831, minP: 21.0, maxP: 24.5, minL: 22.5, maxL: 26.3, minK: 105.0, maxK: 122.5, minS: 9.0, maxS: 10.5, budgetTarget: 10000 },
  pendidik: { label: "Pendidik / Tenaga Kependidikan", waktu: "Siang", akgMin: 30, akgMax: 35, minE: 713, maxE: 831, minP: 21.0, maxP: 24.5, minL: 22.5, maxL: 26.3, minK: 105.0, maxK: 122.5, minS: 9.0, maxS: 10.5, budgetTarget: 10000 },
  balita_siang: { label: "Anak Balita (Siang)", waktu: "Siang", akgMin: 30, akgMax: 35, minE: 405, maxE: 473, minP: 6.0, maxP: 7.0, minL: 13.5, maxL: 15.8, minK: 64.5, maxK: 75.3, minS: 3.3, maxS: 4.0, budgetTarget: 8000 },
  balita_pagi: { label: "Anak Balita 13-59 bln (Pagi)", waktu: "Pagi", akgMin: 20, akgMax: 25, minE: 270, maxE: 338, minP: 4.0, maxP: 5.0, minL: 9.0, maxL: 11.3, minK: 43.0, maxK: 53.8, minS: 2.2, maxS: 2.8, budgetTarget: 8000 },
  bayi_pagi: { label: "Bayi 6-11 bulan (Pagi/MPASI)", waktu: "Pagi", akgMin: 20, akgMax: 25, minE: 160, maxE: 200, minP: 3.0, maxP: 3.8, minL: 7.0, maxL: 8.8, minK: 21.0, maxK: 26.3, minS: 2.2, maxS: 2.8, budgetTarget: 8000 },
  ibu_hamil: { label: "Ibu Hamil", waktu: "Siang", akgMin: 30, akgMax: 35, minE: 753, maxE: 879, minP: 22.1, maxP: 25.8, minL: 20.2, maxL: 23.6, minK: 118.5, maxK: 138.3, minS: 10.2, maxS: 11.9, budgetTarget: 10000 },
  ibu_menyusui: { label: "Ibu Menyusui", waktu: "Siang", akgMin: 30, akgMax: 35, minE: 782, maxE: 912, minP: 26.3, maxP: 30.6, minL: 20.2, maxL: 23.5, minK: 123.0, maxK: 143.5, minS: 11.4, maxS: 13.3, budgetTarget: 10000 }
};

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
                <th>Waktu & Persentase</th>
                <th>Target Energi (kkal)</th>
                <th>Target Protein (g)</th>
                <th>Target Lemak (g)</th>
                <th>Target Karbo (g)</th>
                <th>Target Serat (g)</th>
                <th>Budget Asumsi</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(TARGET_GROUPS).map(([k, v]) => (
                <tr key={k}>
                  <td style={{ fontWeight: 700 }}>{v.label}</td>
                  <td>
                    {v.waktu} ({v.akgMin}% - {v.akgMax}%)
                  </td>
                  <td style={{ fontWeight: 600, color: "var(--g3)" }}>
                    {v.minE} - {v.maxE}
                  </td>
                  <td>{v.minP} - {v.maxP}</td>
                  <td>{v.minL} - {v.maxL}</td>
                  <td>{v.minK} - {v.maxK}</td>
                  <td>{v.minS} - {v.maxS}</td>
                  <td>Rp {v.budgetTarget.toLocaleString("id-ID")}</td>
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
