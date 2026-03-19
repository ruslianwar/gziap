// File: src/pages/DashboardPage.tsx
import { useEffect, useState } from "react";
import { ProgBar } from "../components/ProgBar";
import { supabase } from "../config/supabaseClient";

export default function DashboardPage({ user }: { user?: any }) {
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [licenseInfo, setLicenseInfo] = useState<{ days_remaining: number; expires_at: string } | null>(null);

  const [totalMenu, setTotalMenu] = useState("-");
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [appSettings, setAppSettings] = useState<Record<string, boolean>>({});

  // Effect untuk stats dasar
  useEffect(() => {
    async function loadStats() {
      // Hitung total siklus menu
      const { count } = await supabase
        .from("rencana_menu")
        .select("*", { count: "exact", head: true });

      if (count !== null) setTotalMenu(count.toString());

      // Ambil 4 menu terbaru sebagai log aktivitas
      const { data } = await supabase
        .from("rencana_menu")
        .select("nama_paket, created_at")
        .order("created_at", { ascending: false })
        .limit(4);

      if (data) {
        setRecentActivities(data.map(d => ({
          text: `Menu ${d.nama_paket} ditambahkan ke siklus`,
          // Format relatif kasar:
          time: new Date(d.created_at).toLocaleDateString("id-ID"),
          dot: "#6366f1"
        })));
      }
    }
    loadStats();

    // 2. Load License Info
    import("../utils/licenseCache").then(({ getLicenseCache }) => {
      const cache = getLicenseCache();
      if (cache.data) {
        setLicenseInfo({
          expires_at: cache.data.expires_at,
          days_remaining: cache.data.days_remaining
        });
      }
    });
  }, []);

  // Effect untuk load Settings (khusus Superadmin)
  useEffect(() => {
    if (user?.role !== "superadmin") return;

    async function fetchSettings() {
      const { data } = await supabase.from("app_settings").select("*");
      if (data) {
        const smap = data.reduce((acc: any, curr: any) => {
          acc[curr.key] = curr.value;
          return acc;
        }, {});
        setAppSettings(smap);
      }
    }
    fetchSettings();

    const channel = supabase
      .channel("dash_app_settings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings" },
        () => fetchSettings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const toggleSetting = async (key: string) => {
    // Optimistic UI internal state
    const newVal = appSettings[key] === false ? true : false;
    setAppSettings((prev) => ({ ...prev, [key]: newVal }));
    // Lempar update ke DB
    await supabase.from("app_settings").update({ value: newVal }).eq("key", key);
  };

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
        <div className="welcome-name">Selamat datang, {user?.nama_lengkap || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Ahli Gizi"}! 👋</div>
        <div className="welcome-sub">
          Ringkasan aktivitas platform SiGizi MBG hari ini
        </div>
      </div>

      {/* Grid Statistik Atas */}
      <div className="sg sg-4">
        {[
          { icon: "🥗", color: "#d8f3dc", val: totalMenu, lbl: "Menu Tersusun" },
        ].map((s, i) => (
          <div key={i} className="sc">
            <div className="sc-icon" style={{ background: s.color }}>
              {s.icon}
            </div>
            <div className="sc-val">{s.val}</div>
            <div className="sc-lbl">{s.lbl}</div>
          </div>
        ))}

        {/* LICENSE BADGE */}
        {licenseInfo && (
          <div className="sc" style={{ border: "1px solid #e2e8f0" }}>
            <div className="sc-icon" style={{ background: licenseInfo.days_remaining < 30 ? "#fee2e2" : "#f0fdf4" }}>
              🔑
            </div>
            <div className="sc-val" style={{ color: licenseInfo.days_remaining < 30 ? "#b91c1c" : "#1c4d32" }}>
              {licenseInfo.days_remaining} <span style={{ fontSize: 13 }}>Hari</span>
            </div>
            <div className="sc-lbl">Sisa Masa Aktif Lisensi</div>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Kolom Kiri: Aktivitas Terbaru */}
        <div className="card">
          <div className="card-header">
            <div className="ch-title">Aktivitas Terbaru</div>
          </div>
          <div className="card-body">
            {recentActivities.length > 0 ? recentActivities.map((a, i) => (
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
            )) : (
              <div style={{ fontSize: 13, color: "var(--txt3)", textAlign: "center", padding: "12px 0" }}>Belum ada aktivitas menu terbaru.</div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Status Modul dengan ProgBar */}
        <div className="card">
          <div className="card-header">
            <div className="ch-title">Status Modul Hari Ini</div>
          </div>
          <div className="card-body">
            {[
              { label: "Perencanaan Menu", pct: 100, color: "#22c55e" },
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

      {/* Grid Khusus Superadmin: Pengaturan Visibilitas Modul */}
      {user?.role === "superadmin" && (
        <div className="card" style={{ marginTop: 16 }}>
          <div
            className="card-header"
            style={{
              background: "#475569",
              color: "#fff",
              borderRadius: "8px 8px 0 0",
            }}
          >
            <div
              className="ch-title"
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <span>⚙️</span> Pengaturan Visibilitas Modul (Hak Akses Superadmin)
            </div>
          </div>
          <div
            className="card-body"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {[
              { key: "supplychain", label: "Supply Chain", icon: "🏪" },
              { key: "inventaris", label: "Inventaris / Stok", icon: "📦" },
              { key: "distribusi", label: "Distribusi", icon: "🚚" },
              { key: "qc", label: "QC & Organoleptik", icon: "🧪" },
              { key: "antropometri", label: "Antropometri", icon: "📏" },
              { key: "sekolah", label: "Data Sekolah", icon: "🏫" },
            ].map((m) => (
              <div
                key={m.key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px",
                  background: "#f8fafc",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{m.icon}</span>
                  {m.label}
                </div>
                {/* Komponen Toggle Switch */}
                <button
                  onClick={() => toggleSetting(m.key)}
                  style={{
                    width: 48,
                    height: 26,
                    borderRadius: 13,
                    background:
                      appSettings[m.key] !== false ? "#10b981" : "#cbd5e1",
                    border: "none",
                    position: "relative",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  title={appSettings[m.key] !== false ? "Matikan modul ini" : "Aktifkan modul ini"}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 2,
                      left: appSettings[m.key] !== false ? 24 : 2,
                      width: 22,
                      height: 22,
                      background: "#fff",
                      borderRadius: "50%",
                      transition: "all 0.3s ease",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
