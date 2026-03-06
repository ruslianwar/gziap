// File: src/pages/LoginPage.tsx
import { useState } from "react";
import { supabase } from "../config/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    // Proses autentikasi ASLI ke Supabase
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg("Autentikasi gagal: Email atau password salah!");
    }
    setLoading(false);
  };

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
      <div
        style={{
          background: "#fff",
          padding: 40,
          borderRadius: 16,
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 10px 25px rgba(28, 77, 50, 0.1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <h1
            style={{
              color: "#1c4d32",
              margin: "0 0 8px 0",
              fontSize: 28,
              fontFamily: "serif",
            }}
          >
            SiGizi MBG
          </h1>
          <p style={{ color: "var(--txt3)", margin: 0, fontSize: 14 }}>
            Sistem Informasi Gizi Makan Bergizi Gratis
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              background: "#fef2f2",
              color: "#b91c1c",
              padding: 12,
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 20,
              border: "1px solid #fecaca",
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--txt2)",
                marginBottom: 8,
              }}
            >
              Email Pengguna
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                fontSize: 14,
                outline: "none",
              }}
              placeholder="contoh: admin@sigizi.com"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--txt2)",
                marginBottom: 8,
              }}
            >
              Kata Sandi
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                fontSize: 14,
                outline: "none",
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 14,
              background: "#1c4d32",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "⏳ Memeriksa Kredensial..." : "Masuk ke Sistem"}
          </button>
        </form>
      </div>
    </div>
  );
}
