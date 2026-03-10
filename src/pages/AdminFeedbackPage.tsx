import { useState, useEffect } from "react";
import { supabase } from "../config/supabaseClient";

export default function AdminFeedbackPage() {
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFeedbacks = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("user_feedback")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) console.error("Error fetching feedback:", error);
        else setFeedbacks(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const markAsRead = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from("user_feedback")
            .update({ dibaca: !currentStatus })
            .eq("id", id);
        if (!error) {
            fetchFeedbacks();
        }
    };

    const deleteFeedback = async (id: string) => {
        if (window.confirm("Yakin ingin menghapus laporan ini secara permanen?")) {
            await supabase.from("user_feedback").delete().eq("id", id);
            fetchFeedbacks();
        }
    }

    return (
        <div className="ph" style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 24, margin: "0 0 8px", color: "var(--txt1)" }}>📥 Kotak Masuk Laporan (Superadmin)</h1>
                    <p style={{ margin: 0, color: "var(--txt3)", fontSize: 14 }}>
                        Semua laporan Bug, Usulan Fitur, dan Pertanyaan dari berbagai Ahli Gizi bermuara di sini.
                    </p>
                </div>
                <button className="btn btn-secondary" onClick={fetchFeedbacks}>
                    🔄 Refresh
                </button>
            </div>

            <div className="card">
                {loading ? (
                    <div style={{ padding: 40, textAlign: "center", color: "var(--txt3)" }}>⏳ Memuat data pelaporan...</div>
                ) : feedbacks.length === 0 ? (
                    <div style={{ padding: 60, textAlign: "center", color: "var(--txt3)" }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>Kotak masuk bersih!</div>
                        <div>Belum ada laporan dari pengguna saat ini.</div>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: 40 }}>Status</th>
                                <th style={{ width: 150 }}>Tanggal</th>
                                <th style={{ width: 140 }}>Pengirim</th>
                                <th style={{ width: 130 }}>Jenis</th>
                                <th>Pesan / Laporan</th>
                                <th style={{ width: 100, textAlign: "center" }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {feedbacks.map((f) => (
                                <tr key={f.id} style={{ background: f.dibaca ? "transparent" : "#f1f5f9", fontWeight: f.dibaca ? 400 : 600 }}>
                                    <td style={{ textAlign: "center" }}>
                                        <button
                                            onClick={() => markAsRead(f.id, f.dibaca)}
                                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, opacity: f.dibaca ? 0.3 : 1 }}
                                            title={f.dibaca ? "Tandai Belum Dibaca" : "Tandai Sudah Dibaca"}
                                        >
                                            {f.dibaca ? "📭" : "📬"}
                                        </button>
                                    </td>
                                    <td style={{ fontSize: 13, color: "var(--txt2)" }}>
                                        {new Date(f.created_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                    </td>
                                    <td style={{ fontSize: 13 }}>{f.nama_lengkap}</td>
                                    <td>
                                        <span style={{
                                            padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700,
                                            background: f.jenis_masukan.includes("Bug") ? "#fee2e2" : f.jenis_masukan.includes("Fitur") ? "#e0f2fe" : "#f3f4f6",
                                            color: f.jenis_masukan.includes("Bug") ? "#991b1b" : f.jenis_masukan.includes("Fitur") ? "#075985" : "#374151"
                                        }}>
                                            {f.jenis_masukan}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: 13, lineHeight: 1.5, color: "var(--txt2)", whiteSpace: "pre-wrap" }}>
                                        {f.pesan}
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                        <button
                                            className="btn btn-sm"
                                            onClick={() => deleteFeedback(f.id)}
                                            style={{ background: "#fee2e2", color: "#b91c1c", padding: "4px 8px", fontSize: 12 }}
                                        >
                                            🗑️ Hapus
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
