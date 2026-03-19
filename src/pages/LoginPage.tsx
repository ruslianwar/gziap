import { useState } from "react";
import { supabase } from "../config/supabaseClient";
import loginIllustration from "../assets/login_illustration.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg("Akses ditolak: Silakan periksa kembali email dan kata sandi Anda.");
    }
    setLoading(false);
  };

  const features = [
    {
      title: "Kalkulasi Gizi Presisi",
      desc: "Analisis nutrisi otomatis berbasis standar AKG & Permenkes secara real-time.",
      icon: "🥗",
    },
    {
      title: "Manajemen Siklus Menu",
      desc: "Penyusunan menu harian & mingguan sistematis untuk efisiensi dapur.",
      icon: "📅",
    },
    {
      title: "Otomatisasi Logistik",
      desc: "Agregasi kebutuhan bahan baku belanja langsung dari porsi yang direncanakan.",
      icon: "🛒",
    },
    {
      title: "Laporan Satu Klik",
      desc: "Ekspor rekapitulasi gizi dan belanja ke format Excel & PDF dengan rapi.",
      icon: "📊",
    },
  ];

  return (
    <div className="login-wrap" style={{ animation: "fadeIn 0.8s ease-out" }}>
      {/* Sisi Kiri: Branding & Fitur */}
      <div className="login-left" style={{
        background: "linear-gradient(135deg, var(--g0) 0%, #1a3d2b 100%)",
        color: "#fff",
        padding: "60px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Dekorasi Latar Belakang */}
        <div style={{
          position: "absolute",
          top: "-10%",
          right: "-10%",
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(116, 198, 157, 0.15) 0%, transparent 70%)",
          borderRadius: "50%",
          zIndex: 0
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "40px" }}>
            <div style={{
              width: "50px",
              height: "50px",
              background: "var(--g3)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              boxShadow: "0 10px 20px rgba(0,0,0,0.2)"
            }}>🥬</div>
            <div>
              <h2 style={{ fontSize: "28px", fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>SiGizi <span style={{ color: "var(--g4)" }}>MBG</span></h2>
              <p style={{ fontSize: "12px", color: "var(--g5)", textTransform: "uppercase", letterSpacing: "2px", margin: 0 }}>Smart Nutrition Intelligence</p>
            </div>
          </div>

          <h1 style={{ fontSize: "42px", fontWeight: 300, lineHeight: 1.2, marginBottom: "25px" }}>
            Platform Kalkulasi Gizi <br />
            <em style={{ fontStyle: "normal", color: "var(--g4)", fontWeight: 600 }}>Terbaik untuk Bangsa.</em>
          </h1>

          <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: "45px", maxWidth: "480px" }}>
            Optimalkan manajemen nutrisi dan logistik makanan bergizi gratis dengan sistem cerdas berbasis data yang presisi dan efisien.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
            {features.map((f, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.05)",
                padding: "20px",
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.1)",
                transition: "transform 0.3s",
                cursor: "default"
              }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                <div style={{ fontSize: "24px", marginBottom: "12px" }}>{f.icon}</div>
                <h4 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "6px", color: "var(--g4)" }}>{f.title}</h4>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ilustrasi Flat Design */}
        <div style={{
          position: "absolute",
          bottom: "30px",
          right: "-50px",
          width: "300px",
          opacity: 0.2,
          pointerEvents: "none"
        }}>
          <img src={loginIllustration} alt="Illustration" style={{ width: "100%", height: "auto" }} />
        </div>
      </div>

      {/* Sisi Kanan: Form Login */}
      <div className="login-right" style={{ background: "var(--warm)", padding: "40px" }}>
        <div className="lf-wrap" style={{ animation: "slideUp 0.6s ease-out" }}>
          <div style={{ marginBottom: "40px" }}>
            <h2 className="lf-title" style={{ fontSize: "32px" }}>Selamat Datang</h2>
            <p className="lf-sub">Silakan masuk untuk mengelola nutrisi hari ini.</p>
          </div>

          {errorMsg && (
            <div style={{
              background: "#fff1f0",
              border: "1px solid #ffa39e",
              padding: "12px 16px",
              borderRadius: "10px",
              color: "#cf1322",
              fontSize: "13px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              <span>⚠️</span> {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="fg">
              <label className="fl">ALAMAT EMAIL</label>
              <input
                className="fi"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@sigizi.com"
                autoComplete="email"
              />
            </div>

            <div className="fg">
              <label className="fl">KATA SANDI</label>
              <input
                className="fi"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              className="btn-login"
              type="submit"
              disabled={loading}
              style={{
                background: "var(--g1)",
                height: "54px",
                fontSize: "16px",
                boxShadow: "0 10px 20px rgba(26, 61, 43, 0.15)",
                marginTop: "10px"
              }}
            >
              {loading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                  <span className="loading-spinner"></span> Memverifikasi...
                </div>
              ) : "Masuk ke Dashboard"}
            </button>
          </form>

          <div style={{ marginTop: "40px", paddingTop: "30px", borderTop: "1px solid var(--border)", textAlign: "center" }}>
            <p style={{ fontSize: "12px", color: "var(--txt3)", margin: 0 }}>
              Butuh bantuan akses? Silakan hubungi
              <br />
              <strong style={{ color: "var(--g1)" }}>IT Support SiGizi MBG</strong>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .loading-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          .login-wrap { grid-template-columns: 1fr; }
          .login-left { display: none !important; }
        }
      `}</style>
    </div >
  );
}
