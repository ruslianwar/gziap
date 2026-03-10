import { useState } from "react";
import { supabase } from "../config/supabaseClient";
import { useUI } from "../contexts/UIContext";

export default function FeedbackPage({ user }: { user?: any }) {
    const { showToast } = useUI();
    const [jenis, setJenis] = useState("🐞 Lapor Bug");
    const [pesan, setPesan] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pesan.trim()) {
            showToast("Pesan tidak boleh kosong!", "error");
            return;
        }

        setIsSubmitting(true);
        // Simpan ke Tabel Supabase (perlu dieksekusi create_feedback_table.sql terlebih dahulu)
        const { error } = await supabase.from("user_feedback").insert({
            dibuat_oleh: user?.id,
            nama_lengkap: user?.nama_lengkap || user?.user_metadata?.full_name || user?.email || "Anonim",
            jenis_masukan: jenis,
            pesan: pesan,
            status: "TERKIRIM"
        });

        setIsSubmitting(false);

        if (error) {
            console.error(error);
            showToast("Gagal mengirim pelaporan: " + error.message, "error");
        } else {
            showToast("Berhasil! Terima kasih, masukan Anda telah terkirim kepada Tim Pengembang.", "success");
            setPesan("");
            setJenis("🐞 Lapor Bug");
        }
    };

    return (
        <div className="ph" style={{ maxWidth: 700, margin: "0 auto", padding: "40px 20px" }}>
            {/* Header Aplikasi */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
                <div style={{ fontSize: 56, marginBottom: 8 }}>💬</div>
                <h1 style={{ fontSize: 26, color: "var(--txt1)", margin: "0 0 8px" }}>Pusat Bantuan & Masukan</h1>
                <p style={{ fontSize: 14, color: "var(--txt3)", fontWeight: 500, margin: 0 }}>
                    Laporkan kendala sistem (*Bug*) atau sampaikan fitur usulan Anda untuk membantu merawat operasional SiGizi MBG.
                </p>
            </div>

            <div className="card" style={{ padding: "32px", borderRadius: 12, borderTop: "4px solid var(--g3)", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" }}>
                <form onSubmit={handleSubmit}>
                    {/* Opsi Jenis Masukan */}
                    <div className="fg" style={{ marginBottom: 24 }}>
                        <label className="fl" style={{ fontSize: 14, color: "var(--txt2)", marginBottom: 12, display: "block", fontWeight: 600 }}>1. Kategori Jenis Masukan</label>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                            {["🐞 Lapor Bug", "💡 Usulan Fitur", "❓ Pertanyaan"].map(opt => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setJenis(opt)}
                                    style={{
                                        padding: "12px 8px",
                                        borderRadius: 8,
                                        border: jenis === opt ? "2px solid var(--g3)" : "1px solid var(--b3)",
                                        background: jenis === opt ? "#f0fdf4" : "#fff",
                                        color: jenis === opt ? "var(--g1)" : "var(--txt3)",
                                        fontWeight: jenis === opt ? 700 : 600,
                                        fontSize: 13,
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Kolom Teks Pesan */}
                    <div className="fg" style={{ marginBottom: 28 }}>
                        <label className="fl" style={{ fontSize: 14, color: "var(--txt2)", marginBottom: 8, display: "block", fontWeight: 600 }}>2. Rincian Laporan / Pesan</label>
                        <textarea
                            className="fi"
                            rows={7}
                            value={pesan}
                            onChange={(e) => setPesan(e.target.value)}
                            placeholder="Jelaskan secara detail kendala yang dialami, usulan fitur, atau pertanyaan Anda..."
                            style={{ width: "100%", padding: 16, fontSize: 14, lineHeight: 1.6, resize: "vertical", background: "#f8fafc", border: "1px solid #cbd5e1" }}
                        />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 16 }}>
                        <span style={{ fontSize: 12, color: "var(--txt3)", fontStyle: "italic" }}>
                            Identitas & Email pengirim akan tercatat otomatis.
                        </span>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting || !pesan.trim()}
                            style={{ padding: "12px 32px", fontSize: 15, fontWeight: 700, opacity: (!pesan.trim() || isSubmitting) ? 0.6 : 1 }}
                        >
                            {isSubmitting ? "MENGIRIM..." : "KIRIM MASUKAN 🚀"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
