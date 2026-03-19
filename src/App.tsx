// File: src/App.tsx
import { useState, useEffect } from "react";
import { supabase } from "./config/supabaseClient";

import MainLayout from "./layouts/MainLayout";
import LoginPage from "./pages/LoginPage";

// --- Import Modul Baru Pengganti FncaPage ---
import SusunMenuMBG from "./pages/SusunMenuMBG";
import RekapBelanja from "./pages/RekapBelanja"; // ✅ TAMBAHAN: Import RekapBelanja
import CycleMenuPage from "./pages/CycleMenuPage";
import TargetGiziPage from "./pages/TargetGiziPage";
import DashboardPage from "./pages/DashboardPage";
import SupplyChainPage from "./pages/SupplyChainPage";
import InventarisPage from "./pages/InventarisPage";
import DistribusiPage from "./pages/DistribusiPage";
import QCPage from "./pages/QCPage";
import AntropometriPage from "./pages/AntropometriPage";
import SekolahPage from "./pages/SekolahPage";
import LaporanPage from "./pages/LaporanPage";
import UsersPage from "./pages/UsersPage";
import AboutPage from "./pages/AboutPage";
import FeedbackPage from "./pages/FeedbackPage";
import AdminFeedbackPage from "./pages/AdminFeedbackPage";
import BahanKustomPage from "./pages/BahanKustomPage";
import LicenseManagementPage from "./pages/LicenseManagementPage";
import LicenseActivationPage from "./pages/LicenseActivationPage";
import { getDeviceFingerprint } from "./utils/deviceFingerprint";
import { getLicenseCache } from "./utils/licenseCache";

function App() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [session, setSession] = useState<any>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userProfile, setUserProfile] = useState<any>(null);

  const [isInitializing, setIsInitializing] = useState(true);

  // Mengingat halaman terakhir yang dibuka
  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem("sigizi_page") || "dashboard";
  });

  // State Lisensi
  const [licenseValid, setLicenseValid] = useState<boolean>(true); // Asumsi awal aman (Web/Sudah Aktivasi)
  const [licenseCacheWarning, setLicenseCacheWarning] = useState<string>("");

  useEffect(() => {
    // 1. Cek Lisensi (Khusus Desktop)
    const checkLicense = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
      if (!isTauri) {
        setLicenseValid(true);
        return;
      }

      // Cek cache lokal dulu
      const cache = getLicenseCache();
      if (cache.isValid) {
        setLicenseValid(true);
        return;
      }

      // Jika ada cache tapi usianya sudah expired toleransi
      if (cache.isExpiredCache) {
        setLicenseValid(false);
        setLicenseCacheWarning("Koneksi internet diperlukan untuk memvalidasi ulang lisensi Anda (lebih dari 7 hari offline).");
        return;
      }

      // Jika tidak ada cache, atau valid() mereturn false langsung
      // Validasi ulang secara cloud
      try {
        const fingerprint = await getDeviceFingerprint();
        if (!fingerprint) {
          setLicenseValid(false);
          return;
        }

        // Baca memory lokal atau jika blm ada biarkan UI Activate License jalan
        setLicenseValid(false);
      } catch (err) {
        setLicenseValid(false);
      }
    };
    checkLicense();

    // 2. Cek sesi saat aplikasi pertama kali dibuka
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user);
      else setIsInitializing(false);
    });

    // 2. Pendengar otomatis jika ada aktivitas Login atau Logout
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user);
      } else {
        setUserProfile(null);
        setIsInitializing(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fungsi untuk menarik data dari tabel user_profiles
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchProfile = async (user: any) => {
    try {
      let { data } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      // AUTO-PROFILE: Jika data belum ada di tabel, buatkan otomatis!
      if (!data) {
        const newProfile = {
          id: user.id,
          email: user.email,
          nama_lengkap: "Administrator Utama",
          role: "superadmin",
        };
        await supabase.from("user_profiles").insert([newProfile]);
        data = newProfile;
      }

      // --- SECURITY HARDENING: Account-Device Binding ---
      const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
      if (isTauri && data) {
        const cache = getLicenseCache();
        if (cache.isValid) {
          // Cari data lisensi di server untuk cek binding
          const { data: licenseData } = await supabase
            .from("licenses")
            .select("id, activated_by_email")
            .eq("license_key_hash", cache.licenseHash) // Gunakan hash dari cache
            .single();

          if (licenseData) {
            if (!licenseData.activated_by_email) {
              // BINDING PERTAMA: Kunci lisensi ke akun ini
              await supabase
                .from("licenses")
                .update({ activated_by_email: data.email })
                .eq("id", licenseData.id);
              console.log("Lisensi berhasil diikat ke akun:", data.email);
            } else if (licenseData.activated_by_email !== data.email) {
              // PELANGGARAN: Akun tidak cocok dengan pemilik lisensi di perangkat ini
              await supabase.auth.signOut();
              setUserProfile(null);
              setSession(null);
              alert(`Akses Ditolak: Perangkat ini sudah terikat dengan akun ${licenseData.activated_by_email}. Silakan gunakan akun yang sesuai.`);
              return;
            }
          }
        }
      }
      // --------------------------------------------------

      setUserProfile(data);
    } catch (err) {
      console.error("Gagal memuat profil:", err);
    } finally {
      setIsInitializing(false);
    }
  };

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    localStorage.setItem("sigizi_page", page);
  };

  // Fungsi Logout via Supabase
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("sigizi_page");
  };

  // Layar Loading
  if (isInitializing) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--cream)",
        }}
      >
        <h2 style={{ color: "#1c4d32" }}>⏳ Memuat Keamanan Sistem...</h2>
      </div>
    );
  }

  // Jika aplikasi memanggil jendela aktivasi maka tangkap sebelum masuk layout utama maupun Login Panel
  if (!licenseValid) {
    return (
      <LicenseActivationPage
        cacheWarning={licenseCacheWarning}
        onSuccess={() => {
          setLicenseValid(true);
          setLicenseCacheWarning("");
        }}
      />
    );
  }

  // Jika tidak ada sesi login, paksa ke halaman Login
  if (!session || !userProfile) {
    return <LoginPage />;
  }

  // Jika berhasil login, muat aplikasi utuh
  return (
    <MainLayout
      activePage={currentPage}
      setActivePage={handlePageChange}
      user={userProfile}
      onLogout={handleLogout}
    >
      {currentPage === "dashboard" && <DashboardPage user={userProfile} />}
      {currentPage === "about" && <AboutPage />}
      {currentPage === "feedback" && <FeedbackPage user={userProfile} />}

      {/* Rute ke modul baru SusunMenuMBG menggunakan penanda "fnca" agar sidebar lama tetap berfungsi */}
      {currentPage === "fnca" && <SusunMenuMBG />}
      {currentPage === "bahan_kustom" && <BahanKustomPage user={userProfile} />}

      {/* Rekap Belanja dengan sinkronisasi profil user untuk tanda tangan laporan */}
      {currentPage === "rekap" && <RekapBelanja user={userProfile} />}

      {currentPage === "cycle_menu" && <CycleMenuPage />}
      {currentPage === "target_gizi" && <TargetGiziPage />}
      {currentPage === "supplychain" && <SupplyChainPage />}
      {currentPage === "inventaris" && <InventarisPage />}
      {currentPage === "distribusi" && <DistribusiPage />}
      {currentPage === "qc" && <QCPage />}
      {currentPage === "antropometri" && <AntropometriPage />}
      {currentPage === "sekolah" && <SekolahPage />}
      {currentPage === "laporan" && <LaporanPage />}

      {/* Batasan Akses Halaman User: Hanya Superadmin/Admin */}
      {currentPage === "users" &&
        (userProfile.role === "superadmin" || userProfile.role === "admin") && (
          <UsersPage currentUser={userProfile} />
        )}
      {/* Rute Khusus Kotak Laporan untuk Superadmin/Admin */}
      {currentPage === "admin_feedback" &&
        (userProfile.role === "superadmin" || userProfile.role === "admin") && (
          <AdminFeedbackPage />
        )}
      {/* Rute Khusus Manajemen Lisensi (Hanya Superadmin) */}
      {currentPage === "license_management" &&
        (userProfile.role === "superadmin" ? (
          <LicenseManagementPage />
        ) : (
          <div
            style={{
              padding: 60,
              textAlign: "center",
              background: "#fff",
              borderRadius: 12,
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 16 }}>🚫</div>
            <h2 style={{ margin: "0 0 8px 0", color: "#b91c1c" }}>
              Akses Ditolak
            </h2>
            <p style={{ color: "var(--txt3)" }}>
              Halaman ini bersifat rahasia dan hanya dapat diakses oleh Superadmin Utama.
            </p>
          </div>
        ))}
      {currentPage === "users" &&
        userProfile.role !== "superadmin" &&
        userProfile.role !== "admin" && (
          <div
            style={{
              padding: 60,
              textAlign: "center",
              background: "#fff",
              borderRadius: 12,
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 16 }}>🚫</div>
            <h2 style={{ margin: "0 0 8px 0", color: "#b91c1c" }}>
              Akses Ditolak
            </h2>
            <p style={{ color: "var(--txt3)" }}>
              Hanya Administrator yang memiliki wewenang untuk melihat halaman
              ini.
            </p>
          </div>
        )}
    </MainLayout>
  );
}

export default App;