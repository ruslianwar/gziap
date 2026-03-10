import { useState, useEffect } from "react";
import { supabase } from "../config/supabaseClient";
import { useUI } from "../contexts/UIContext";

export default function BahanKustomPage({ user }: { user?: any }) {
    const { showToast, showConfirm } = useUI();
    const [bahanList, setBahanList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter & Pagination States
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Form State
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        nama: "",
        bdd: 100,
        energi: 0,
        protein: 0,
        lemak: 0,
        karbo: 0,
        serat: 0
    });

    const loadBahanKustom = async () => {
        if (!user?.id) return;
        setLoading(true);
        const { data, error } = await supabase
            .from("data_tkpi")
            .select("*")
            .eq("dibuat_oleh", user.id)
            .eq("sumber", "Kustom / Lokal");

        if (!error && data) {
            setBahanList(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadBahanKustom();
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "nama" ? value : parseFloat(value) || 0
        }));
    };

    const openAddModal = () => {
        setFormData({ nama: "", bdd: 100, energi: 0, protein: 0, lemak: 0, karbo: 0, serat: 0 });
        setIsEditing(false);
        setEditId(null);
        setShowModal(true);
    };

    const openEditModal = (bahan: any) => {
        setFormData({
            nama: bahan.nama,
            bdd: bahan.bdd || 100,
            energi: bahan.energi || 0,
            protein: bahan.protein || 0,
            lemak: bahan.lemak || 0,
            karbo: bahan.karbohidrat || bahan.karbo || 0,
            serat: bahan.serat || 0
        });
        setIsEditing(true);
        setEditId(bahan.kode);
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nama.trim()) {
            showToast("Nama bahan tidak boleh kosong!", "error");
            return;
        }

        const payload: any = {
            nama: formData.nama.trim(),
            bdd: formData.bdd,
            energi: formData.energi,
            protein: formData.protein,
            lemak: formData.lemak,
            karbohidrat: formData.karbo,
            serat: formData.serat,
            sumber: "Kustom / Lokal",
            dibuat_oleh: user.id
        };

        if (isEditing && editId) {
            // Update
            const { error } = await supabase
                .from("data_tkpi")
                .update(payload)
                .eq("kode", editId)
                .eq("dibuat_oleh", user.id);

            if (error) {
                showToast("Gagal memperbarui bahan: " + error.message, "error");
            } else {
                showToast("Bahan kustom berhasil diperbarui!", "success");
                setShowModal(false);
                loadBahanKustom();
            }
        } else {
            // Insert
            const newKode = `LOKAL-${Date.now()}`;
            payload.kode = newKode;
            payload.besi = 0; payload.retinol = 0; payload.kalsium = 0; payload.seng = 0; payload.vitamin_c = 0;

            const { error } = await supabase
                .from("data_tkpi")
                .insert([payload]);

            if (error) {
                showToast("Gagal menyimpan bahan hustom baru: " + error.message, "error");
            } else {
                showToast("Bahan kustom baru berhasil ditambahkan!", "success");
                setShowModal(false);
                loadBahanKustom();
            }
        }
    };

    const handleDelete = (id: string, nama: string) => {
        showConfirm(`Apakah Anda yakin ingin menghapus bahan kustom "${nama}" secara permanen? Data yang dihapus tidak dapat dipulihkan.`, async () => {
            const { error } = await supabase
                .from("data_tkpi")
                .delete()
                .eq("kode", id)
                .eq("dibuat_oleh", user.id);

            if (error) {
                showToast("Gagal menghapus bahan: " + error.message, "error");
            } else {
                showToast("Bahan pangan kustom berhasil dihapus.", "success");
                loadBahanKustom();
            }
        });
    };

    // --- LOGIKA FILTER & PAGINATION ---
    const filteredBahan = bahanList.filter(b =>
        (b.nama || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    const totalPages = Math.ceil(filteredBahan.length / itemsPerPage) || 1;
    const paginatedBahan = filteredBahan.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    return (
        <div className="ph">
            <div className="ph-header" style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 280, paddingRight: 16 }}>
                    <h1 className="ph-title">🍎 Manajemen Bahan Kustom</h1>
                    <p className="ph-desc" style={{ marginTop: 6, lineHeight: "1.5" }}>
                        Kelola database pangkalan makanan kreasi (lokal) yang Anda tambahkan ke dalam sistem.
                        Data ini diisolasi dan hanya dapat diakses oleh Anda.
                    </p>
                </div>
                <div style={{ paddingTop: 4 }}>
                    <button className="btn btn-primary" onClick={openAddModal} style={{ whiteSpace: "nowrap", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}>
                        + Tambah Bahan Kustom Baru
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="card-header" style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                        <div className="ch-title" style={{ margin: 0 }}>Daftar Bahan ({filteredBahan.length})</div>
                        <select
                            className="fi"
                            style={{ width: "auto", margin: 0, padding: "4px 8px", backgroundColor: "var(--bg1)" }}
                            value={itemsPerPage}
                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        >
                            <option value={10}>10 Baris</option>
                            <option value={20}>20 Baris</option>
                            <option value={50}>50 Baris</option>
                            <option value={100}>100 Baris</option>
                        </select>
                    </div>
                    <div style={{ position: "relative", width: 300, maxWidth: "100%" }}>
                        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--txt3)" }}>🔍</span>
                        <input
                            type="text"
                            className="fi"
                            placeholder="Cari nama bahan pangan..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            style={{ paddingLeft: 36, margin: 0 }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: 40, textAlign: "center", color: "var(--txt3)" }}>Memuat database bahan...</div>
                ) : filteredBahan.length === 0 ? (
                    <div style={{ padding: 60, textAlign: "center", color: "var(--txt3)" }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>🍎</div>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>Tidak Ada Bahan Kustom</div>
                        <div style={{ marginTop: 8 }}>{bahanList.length === 0 ? "Anda belum menempatkan bahan pangan lokal ke dalam pangkalan data. Mulailah dengan mengeklik tombol Tambah Bahan." : "Pencarian tidak cocok dengan bahan manapun."}</div>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Nama Bahan</th>
                                    <th style={{ textAlign: "right" }}>BDD (%)</th>
                                    <th style={{ textAlign: "right" }}>Energi (Kkal)</th>
                                    <th style={{ textAlign: "right" }}>Protein (g)</th>
                                    <th style={{ textAlign: "right" }}>Lemak (g)</th>
                                    <th style={{ textAlign: "right" }}>Karbo (g)</th>
                                    <th style={{ textAlign: "right" }}>Serat (g)</th>
                                    <th style={{ textAlign: "center", width: 100 }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedBahan.map((bahan) => (
                                    <tr key={bahan.kode}>
                                        <td style={{ fontWeight: 600, color: "var(--txt1)" }}>{bahan.nama}</td>
                                        <td style={{ textAlign: "right" }}>{bahan.bdd}</td>
                                        <td style={{ textAlign: "right" }}>{bahan.energi}</td>
                                        <td style={{ textAlign: "right" }}>{bahan.protein}</td>
                                        <td style={{ textAlign: "right" }}>{bahan.lemak}</td>
                                        <td style={{ textAlign: "right" }}>{bahan.karbohidrat || bahan.karbo}</td>
                                        <td style={{ textAlign: "right" }}>{bahan.serat}</td>
                                        <td style={{ textAlign: "center" }}>
                                            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                                                <button
                                                    className="btn btn-sm"
                                                    style={{ background: "#e0f2fe", color: "#0369a1", padding: "4px 8px" }}
                                                    onClick={() => openEditModal(bahan)}
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="btn btn-sm"
                                                    style={{ background: "#fee2e2", color: "#b91c1c", padding: "4px 8px" }}
                                                    onClick={() => handleDelete(bahan.kode, bahan.nama)}
                                                    title="Hapus"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {!loading && filteredBahan.length > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderTop: "1px solid var(--b3)", flexWrap: "wrap", gap: 12 }}>
                        <div style={{ fontSize: 14, color: "var(--txt2)" }}>
                            Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredBahan.length)} dari {filteredBahan.length} bahan
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <button
                                className="btn btn-secondary btn-sm"
                                style={{ padding: "6px 12px" }}
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                ← Seb.
                            </button>
                            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--txt1)", padding: "0 8px" }}>
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                className="btn btn-secondary btn-sm"
                                style={{ padding: "6px 12px" }}
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Lanjut →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL FORM EDIT / ADD */}
            {showModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 9999
                }}>
                    <div className="card" style={{ width: 600, maxWidth: "90%", maxHeight: "90vh", overflowY: "auto", margin: 0 }}>
                        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div className="ch-title">{isEditing ? "✏️ Edit Bahan Kustom" : "🍎 Tambah Bahan Kustom"}</div>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--txt3)" }}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="card-body">
                            <div className="fg">
                                <label className="fl">Nama Bahan Pangan</label>
                                <input
                                    type="text"
                                    name="nama"
                                    className="fi"
                                    value={formData.nama}
                                    onChange={handleInputChange}
                                    placeholder="Misal: Ikan Kembung Kukus..."
                                    required
                                />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <div className="fg">
                                    <label className="fl">BDD (%)</label>
                                    <input
                                        type="number"
                                        name="bdd"
                                        className="fi"
                                        value={formData.bdd}
                                        onChange={handleInputChange}
                                        min="1"
                                        max="100"
                                    />
                                    <div style={{ fontSize: 11, color: "var(--txt3)", marginTop: 4 }}>Berat Dapat Dimakan. Umumnya 100 untuk masakan matang.</div>
                                </div>

                                <div className="fg">
                                    <label className="fl">Energi (Kkal)</label>
                                    <input
                                        type="number"
                                        name="energi"
                                        className="fi"
                                        value={formData.energi}
                                        onChange={handleInputChange}
                                        step="0.1"
                                    />
                                </div>

                                <div className="fg">
                                    <label className="fl">Protein (Gram)</label>
                                    <input
                                        type="number"
                                        name="protein"
                                        className="fi"
                                        value={formData.protein}
                                        onChange={handleInputChange}
                                        step="0.1"
                                    />
                                </div>

                                <div className="fg">
                                    <label className="fl">Lemak (Gram)</label>
                                    <input
                                        type="number"
                                        name="lemak"
                                        className="fi"
                                        value={formData.lemak}
                                        onChange={handleInputChange}
                                        step="0.1"
                                    />
                                </div>

                                <div className="fg">
                                    <label className="fl">Karbohidrat (Gram)</label>
                                    <input
                                        type="number"
                                        name="karbo"
                                        className="fi"
                                        value={formData.karbo}
                                        onChange={handleInputChange}
                                        step="0.1"
                                    />
                                </div>

                                <div className="fg">
                                    <label className="fl">Serat (Gram)</label>
                                    <input
                                        type="number"
                                        name="serat"
                                        className="fi"
                                        value={formData.serat}
                                        onChange={handleInputChange}
                                        step="0.1"
                                    />
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--b3)" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Batal
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {isEditing ? "Simpan Perubahan" : "Simpan Bahan Baru"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
