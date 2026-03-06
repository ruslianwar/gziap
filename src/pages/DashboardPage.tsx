// File: src/pages/DashboardPage.tsx
import { ProgBar } from "../components/ProgBar";

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <div className="topbar">
        <div className="tb-bread">
          SiGizi MBG / <span>Dashboard</span>
        </div>
        <div className="tb-right">
          <div className="tb-date">📅 {today}</div>
        </div>
      </div>

      <div className="welcome">
        <div className="welcome-name">Selamat datang, Siti Rahayu! 👋</div>
        <div className="welcome-sub">
          Ringkasan aktivitas platform SiGizi MBG hari ini
        </div>
      </div>

      {/* Grid Statistik Atas */}
      <div className="sg sg-4">
        {[
          { icon: "🏫", color: "#d8f3dc", val: "6", lbl: "Sekolah Aktif" },
          {
            icon: "👨‍🎓",
            color: "#e0e7ff",
            val: "2.063",
            lbl: "Siswa Terdaftar",
          },
          { icon: "👥", color: "#fef3c7", val: "12", lbl: "Pengguna Sistem" },
          {
            icon: "✅",
            color: "#fce7f3",
            val: "78%",
            lbl: "Distribusi Hari Ini",
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Kolom Kiri: Aktivitas Terbaru */}
        <div className="card">
          <div className="card-header">
            <div className="ch-title">Aktivitas Terbaru</div>
          </div>
          <div className="card-body">
            {[
              {
                dot: "#40916c",
                text: "Cycle menu minggu 3 diperbarui Ahli Gizi",
                time: "10 mnt lalu",
              },
              {
                dot: "#6366f1",
                text: "QC checklist SDN 01 selesai — 100% passed",
                time: "28 mnt lalu",
              },
              {
                dot: "#e9c46a",
                text: "Stok bayam SDN 05 di bawah minimum",
                time: "1 jam lalu",
              },
              {
                dot: "#e76f51",
                text: "4 siswa teridentifikasi berisiko stunting",
                time: "2 jam lalu",
              },
            ].map((a, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "8px 0",
                  borderBottom: i < 3 ? "1px solid #f5f5f5" : "none",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: a.dot,
                    marginTop: 6,
                    flexShrink: 0,
                  }}
                ></div>
                <div>
                  <div style={{ fontSize: 13, color: "var(--txt)" }}>
                    {a.text}
                  </div>
                  <div
                    style={{ fontSize: 11, color: "var(--txt3)", marginTop: 2 }}
                  >
                    {a.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kolom Kanan: Status Modul dengan ProgBar */}
        <div className="card">
          <div className="card-header">
            <div className="ch-title">Status Modul Hari Ini</div>
          </div>
          <div className="card-body">
            {[
              { label: "FNCA / Perencanaan Menu", pct: 100, color: "#22c55e" },
              { label: "Supply Chain & Stok", pct: 85, color: "#3b82f6" },
              { label: "QC & Organoleptik", pct: 60, color: "#f59e0b" },
              { label: "Distribusi Makanan", pct: 78, color: "#8b5cf6" },
            ].map((m, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12.5,
                    marginBottom: 5,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{m.label}</span>
                  <span style={{ color: "var(--txt3)" }}>{m.pct}%</span>
                </div>
                {/* Menggunakan komponen Reusable yang kita buat */}
                <ProgBar
                  val={m.pct}
                  max={100}
                  color={m.color}
                  className="prog-md"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
