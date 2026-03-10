// File: src/layouts/MainLayout.tsx
import { useState, useEffect } from "react";
import { useUI } from "../contexts/UIContext";
import { supabase } from "../config/supabaseClient";
import Logo from "../assets/logo.png";

// Definisi data yang diterima (Props) dari App.tsx
interface Props {
  children: React.ReactNode;
  activePage: string;
  setActivePage: (page: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any; // Menerima data user yang sedang login
  onLogout: () => void; // Menerima fungsi logout
}

export default function MainLayout({
  children,
  activePage,
  setActivePage,
  user,
  onLogout,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const { showToast } = useUI();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userProfile, setUserProfile] = useState<any>(null);
  const [editProfileForm, setEditProfileForm] = useState({
    nama_lengkap: "",
    gelar: "",
    nama_sppg_instansi: "",
    nomor_str_nip: "",
  });

  useEffect(() => {
    if (user?.id) {
      fetchUserProfile();
    }
  }, [user?.id]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data && !error) {
        setUserProfile(data);
        setEditProfileForm({
          nama_lengkap: data.nama_lengkap || "",
          gelar: data.gelar || "",
          nama_sppg_instansi: data.nama_sppg_instansi || "",
          nomor_str_nip: data.nomor_str_nip || "",
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          email: user.email,
          ...editProfileForm
        });

      if (!error) {
        showToast("Profil berhasil diperbarui!", "success");
        setIsProfileModalOpen(false);
        fetchUserProfile();
      } else {
        showToast("Gagal menyimpan profil: " + error.message, "error");
      }
    } catch (err: any) {
      showToast("Terjadi kesalahan: " + err.message, "error");
    }
  };

  // Fungsi pembuat inisial nama jika avatar tidak tersedia (Siti Rahayu -> SR)
  const getAvatar = (nama: string) => {
    if (!nama) return "?";
    return nama
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  };

  // Cek apakah user yang login adalah admin (untuk menyembunyikan/menampilkan menu)
  //const isAdmin = user?.role === "admin";
  // CEK AKSES & VISIBILITAS MODUL DARI DATABASE
  const isAdmin = user?.role === "superadmin" || user?.role === "admin";
  const [appSettings, setAppSettings] = useState<Record<string, boolean>>({});

  useEffect(() => {
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
  }, [user]);

  // Daftar Menu Navigasi Berbasis Filter Setelan Aplikasi
  // Jika Setting undefined (belum di-set), default dianggap true (tampil)
  const isVisible = (key: string) => appSettings[key] !== false;

  const rawMenus = [
    {
      section: "Utama",
      items: [{ id: "dashboard", icon: "📊", label: "Dashboard" }],
    },
    {
      section: "Gizi & Menu",
      items: [
        { id: "fnca", icon: "🔬", label: "Susun Menu MBG" },
        { id: "bahan_kustom", icon: "🍎", label: "Bahan Kustom" },
        { id: "rekap", icon: "🛒", label: "Rekap Belanja" },
        { id: "cycle_menu", icon: "🥗", label: "Siklus Menu" },
        { id: "target_gizi", icon: "🎯", label: "Target & AKG" },
      ],
    },
    {
      section: "Operasional",
      items: [
        (isVisible("supplychain") && { id: "supplychain", icon: "🏪", label: "Supply Chain" }),
        (isVisible("inventaris") && { id: "inventaris", icon: "📦", label: "Inventaris/Stok" }),
        (isVisible("distribusi") && { id: "distribusi", icon: "🚚", label: "Distribusi" }),
        (isVisible("qc") && { id: "qc", icon: "🧪", label: "QC & Organoleptik" }),
      ].filter(Boolean) as { id: string; icon: string; label: string }[],
    },
    {
      section: "Quality & Kesehatan",
      items: [
        (isVisible("antropometri") && { id: "antropometri", icon: "📏", label: "Antropometri" }),
      ].filter(Boolean) as { id: string; icon: string; label: string }[],
    },
    {
      section: "Data & Laporan",
      items: [
        (isVisible("sekolah") && { id: "sekolah", icon: "🏫", label: "Data Sekolah" }),
        { id: "laporan", icon: "📈", label: "Laporan & Export" },
        ...(isAdmin ? [
          { id: "users", icon: "👥", label: "Manajemen User" },
          { id: "admin_feedback", icon: "📬", label: "Kotak Laporan" }
        ] : []),
        { id: "about", icon: "ℹ️", label: "Tentang Aplikasi" },
        ...(!isAdmin ? [{ id: "feedback", icon: "📣", label: "Bantuan & Masukan" }] : []),
      ].filter(Boolean) as { id: string; icon: string; label: string }[],
    },
  ];

  // Buang kategori section (seperti "Operasional") jika semua anaknya sudah lenyap akibat toggle dimatikan
  const menus = rawMenus.filter((section: any) => section.items && section.items.length > 0);

  const sidebarWidth = collapsed ? 64 : 256;

  return (
    <div className="app">
      {/* Tombol Buka/Tutup Sidebar */}
      <button
        className="toggle-btn"
        style={{ left: collapsed ? 16 : sidebarWidth - 18 }}
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Buka Sidebar" : "Tutup Sidebar"}
      >
        {collapsed ? "›" : "‹"}
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${collapsed ? "col" : ""}`}>
        <div className="sb-logo">
          <div className="sb-logo-icon">
            <img src={Logo} alt="SiGizi MBG Logo" style={{ width: 32, height: 32, objectFit: "contain" }} />
          </div>
          <div style={{ overflow: "hidden" }}>
            <div className="sb-logo-text">SiGizi MBG</div>
            <div className="sb-logo-sub">v1.0.0-Beta</div>
          </div>
        </div>

        {/* Bagian Profil User Dinamis */}
        <div className="sb-user">
          <div
            className="sb-av"
            style={{ background: user?.color || "#40916c", cursor: "pointer" }}
            onClick={() => setIsProfileModalOpen(true)}
            title="Klik untuk atur Profil"
          >
            {getAvatar(userProfile?.nama_lengkap || user?.user_metadata?.full_name || user?.email || user?.nama)}
          </div>
          <div className="sb-user-info" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div className="sb-user-name" style={{ fontSize: 13, wordBreak: "break-all", fontWeight: 700 }}>
              {userProfile?.nama_lengkap ? `${userProfile.nama_lengkap}${userProfile.gelar ? ', ' + userProfile.gelar : ''} ` : (user?.user_metadata?.full_name || "Pembuat Menu")}
            </div>
            <div style={{ fontSize: 11, color: "var(--txt3)", fontWeight: 600, lineHeight: 1.2 }}>
              {userProfile?.nama_sppg_instansi || "Tanpa Instansi"}
            </div>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              style={{ background: "none", border: "none", color: "var(--g3)", padding: 0, textAlign: "left", fontSize: 10, cursor: "pointer", marginTop: 4, fontWeight: 700 }}
            >
              ⚙️ Atur Profil
            </button>
          </div>
        </div>

        <nav className="sb-nav">
          {menus.map((sec, si) => (
            <div key={si}>
              <div className="sb-section">{sec.section}</div>
              {sec.items.map((m) => (
                <div
                  key={m.id}
                  className={`sb-item ${activePage === m.id ? "active" : ""}`}
                  onClick={() => setActivePage(m.id)}
                  title={collapsed ? m.label : ""}
                >
                  <span className="sb-item-icon">{m.icon}</span>
                  <span className="sb-item-label">{m.label}</span>
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* Tombol Logout */}
        <div
          className="sb-bottom"
          style={{
            padding: "12px",
            borderTop: "1px solid rgba(255,255,255,.07)",
          }}
        >
          <button
            className="sb-logout"
            onClick={onLogout}
            title={collapsed ? "Keluar" : ""}
          >
            <span>⬅</span>
            <span className="sb-logout-t">Keluar</span>
          </button>
        </div>
      </div>

      {/* Area Konten Utama */}
      <main className="main" style={{ marginLeft: sidebarWidth }}>
        {children}
      </main>

      {/* MODAL EDIT PROFIL */}
      {isProfileModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", width: 450, borderRadius: 16, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: "#0f172a" }}>Pengaturan Profil Ahli Gizi</h3>
            <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 20px 0" }}>
              Data profil ini akan dicetak sebagai Tanda Tangan Resmi pada bagian bawah Lembar Laporan Excel MBG Anda.
            </p>

            <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Nama Lengkap</label>
                  <input required value={editProfileForm.nama_lengkap} onChange={e => setEditProfileForm({ ...editProfileForm, nama_lengkap: e.target.value })} type="text" style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, outline: "none" }} placeholder="Misal: Siti Rahmah" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Gelar</label>
                  <input value={editProfileForm.gelar} onChange={e => setEditProfileForm({ ...editProfileForm, gelar: e.target.value })} type="text" style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, outline: "none" }} placeholder="S.Gz" />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Nama SPPG / Tempat Bekerja</label>
                <input required value={editProfileForm.nama_sppg_instansi} onChange={e => setEditProfileForm({ ...editProfileForm, nama_sppg_instansi: e.target.value })} type="text" style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, outline: "none" }} placeholder="Misal: Dapur Umum MBG Sleman 1" />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Nomor STR / NIP (Opsional)</label>
                <input value={editProfileForm.nomor_str_nip} onChange={e => setEditProfileForm({ ...editProfileForm, nomor_str_nip: e.target.value })} type="text" style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, outline: "none" }} placeholder="Kosongkan jika Anda Mahasiswa/Belum Memiliki" />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
                <button type="button" onClick={() => setIsProfileModalOpen(false)} style={{ padding: "10px 16px", background: "#f1f5f9", color: "#475569", borderRadius: 8, fontWeight: 600, border: "none", cursor: "pointer" }}>Batal</button>
                <button type="submit" style={{ padding: "10px 16px", background: "#3b82f6", color: "#fff", borderRadius: 8, fontWeight: 600, border: "none", cursor: "pointer" }}>Simpan Profil</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}