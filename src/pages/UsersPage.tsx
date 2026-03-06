// File: src/pages/UsersPage.tsx
import { useState, useEffect } from "react";
import { supabase } from "../config/supabaseClient";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("staff");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State untuk fitur Show/Hide Password
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Trik Arsitek: Bersihkan spasi gaib dan paksa huruf kecil semua
    const cleanEmail = email.trim().toLowerCase();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password, // Password jangan dibersihkan, spasi bisa jadi bagian sandi
    });

    if (authError) {
      alert("Gagal membuat akses login: " + authError.message);
      setIsSubmitting(false);
      return;
    }

    const newUserId = authData.user?.id;

    if (newUserId) {
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert([
          { id: newUserId, nama_lengkap: nama, email: email, role: role },
        ]);

      if (!profileError) {
        setNama("");
        setEmail("");
        setPassword("");
        setRole("staff");
        setShowPassword(false); // Kembalikan ke mode tersembunyi
        fetchUsers();
        alert(`Berhasil! Akun ${email} sekarang bisa digunakan untuk Login.`);
      } else {
        alert("Akses berhasil dibuat, tapi gagal menyimpan profil.");
        console.error(profileError);
      }
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (id: string, namaUser: string) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus permanen akses untuk ${namaUser}?`,
      )
    ) {
      const { error } = await supabase
        .from("user_profiles")
        .delete()
        .eq("id", id);
      if (!error) {
        setUsers(users.filter((u) => u.id !== id));
      } else {
        alert("Gagal menghapus pengguna!");
      }
    }
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      <div className="topbar">
        <div className="tb-bread">
          SiGizi MBG / <span>Manajemen Pengguna</span>
        </div>
      </div>

      <div className="ph" style={{ marginBottom: 24 }}>
        <div className="ph-title">Manajemen Hak Akses Sistem</div>
        <div className="ph-sub">
          Kelola akun administrator, ahli gizi, dan staf operasional.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* Form Tambah User */}
        <div className="card" style={{ borderRadius: 12 }}>
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: 16 }}>+ Tambah Pengguna</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleAddUser}>
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  Nama Lengkap
                </label>
                <input
                  required
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    fontSize: 14,
                  }}
                  placeholder="Misal: Budi Santoso"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  Email Sistem
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    fontSize: 14,
                  }}
                  placeholder="budi@sigizi.com"
                />
              </div>

              {/* Kolom Password dengan Toggle Show/Hide */}
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  Kata Sandi (Min. 6 Karakter)
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 40px 10px 14px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      fontSize: 14,
                    }}
                    placeholder="••••••••"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1} // Agar tidak terfokus saat menekan tombol Tab
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 16,
                      color: "var(--txt3)",
                    }}
                    title={
                      showPassword ? "Sembunyikan Sandi" : "Tampilkan Sandi"
                    }
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  Hak Akses (Role)
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    fontSize: 14,
                  }}
                >
                  <option value="admin">Administrator (Akses Penuh)</option>
                  <option value="ahligizi">Ahli Gizi (Akses FNCA)</option>
                  <option value="staff">Staf Gudang (Supply Chain)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#1c4d32",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
              >
                {isSubmitting ? "⏳ Membuat Akun..." : "Buat Akun Login"}
              </button>
            </form>
          </div>
        </div>

        {/* Tabel Daftar User */}
        <div className="card" style={{ borderRadius: 12 }}>
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: 16 }}>
              👥 Daftar Pengguna Aktif
            </h3>
          </div>
          <div className="tw" style={{ margin: 0 }}>
            {loading ? (
              <div
                style={{
                  padding: 40,
                  textAlign: "center",
                  color: "var(--txt3)",
                }}
              >
                ⏳ Mengambil data dari server...
              </div>
            ) : (
              <table style={{ margin: 0 }}>
                <thead style={{ background: "#fafafa" }}>
                  <tr>
                    <th>NAMA LENGKAP</th>
                    <th>EMAIL</th>
                    <th>HAK AKSES</th>
                    <th>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        style={{ textAlign: "center", padding: 30 }}
                      >
                        Belum ada data pengguna.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600 }}>{u.nama_lengkap}</td>
                        <td style={{ color: "var(--txt2)" }}>{u.email}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              background:
                                u.role === "superadmin"
                                  ? "#fee2e2"
                                  : u.role === "admin"
                                    ? "#fef3c7"
                                    : "#dcfce7",
                              color:
                                u.role === "superadmin"
                                  ? "#991b1b"
                                  : u.role === "admin"
                                    ? "#92400e"
                                    : "#166534",
                              borderRadius: 6,
                            }}
                          >
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {u.role !== "superadmin" && (
                            <button
                              onClick={() => handleDelete(u.id, u.nama_lengkap)}
                              style={{
                                background: "#fef2f2",
                                border: "1px solid #fecaca",
                                color: "#b91c1c",
                                padding: "6px 10px",
                                borderRadius: 6,
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              Hapus
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
