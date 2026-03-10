import { AlertBox } from "../components/AlertBox";

export default function AboutPage() {
    return (
        <div className="ph" style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
            {/* Header Aplikasi */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
                <div style={{ fontSize: 64, marginBottom: 8 }}>🥗</div>
                <h1 style={{ fontSize: 28, color: "var(--txt1)", margin: "0 0 8px" }}>
                    SiGizi MBG <span style={{ color: "var(--g3)", fontWeight: 500 }}>(Makan Bergizi Gratis)</span>
                </h1>
                <div style={{ fontSize: 14, color: "var(--txt3)", fontWeight: 600, letterSpacing: 1 }}>
                    VERSION 1.0.0-BETA
                </div>
            </div>

            {/* Box Deskripsi & Tujuan Platform */}
            <div className="card" style={{ marginBottom: 24, borderTop: "4px solid var(--g3)" }}>
                <div className="card-header" style={{ paddingBottom: 12 }}>
                    <div className="ch-title" style={{ fontSize: 18 }}>💡 Tentang Aplikasi oleh @templatesppg</div>
                </div>
                <div className="card-body" style={{ fontSize: 15, lineHeight: 1.6, color: "var(--txt2)" }}>
                    <p style={{ marginTop: 0 }}>
                        <strong>SiGizi MBG</strong> adalah platform kalkulasi, manajemen menu, dan integrasi logistik modern yang
                        dirancang khusus sebagai alat bantu cerdas (kalkulator pintar) bagi para Ahli Gizi yang bertugas di
                        <strong> Satuan Pelayanan Pemenuhan Gizi (SPPG)</strong> serta Mahasiswa Ilmu Gizi.
                    </p>
                    <p style={{ marginBottom: 0 }}>
                        Tujuan utama berdirinya sistem ini adalah untuk menstandardisasi, mempercepat, dan mempermudah perhitungan
                        Angka Kecukupan Gizi (AKG) berdasarkan pedoman resmi <strong>Permenkes No. 28 Tahun 2019</strong> dengan
                        otomatisasi berbasis digital secara <i>real-time</i>.
                    </p>
                </div>
            </div>

            {/* Peringatan Independensi (Merah Tegas) */}
            <div style={{ marginBottom: 24 }}>
                <AlertBox type="err" style={{ padding: 24, borderRadius: 12 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                        <div style={{ fontSize: 32, lineHeight: 1 }}>🚨</div>
                        <div>
                            <h3 style={{ margin: "0 0 8px", color: "var(--red)", fontSize: 16, borderBottom: "1px solid rgba(239, 68, 68, 0.2)", paddingBottom: 8 }}>
                                PERNYATAAN INDEPENDENSI MULTLAK (DISCLAIMER)
                            </h3>
                            <div style={{ color: "#7f1d1d", fontSize: 14, lineHeight: 1.6, textAlign: "justify" }}>
                                Aplikasi <b>"SiGizi MBG"</b> murni merupakan inisiatif independen karya akademis/komunitas dan
                                <strong style={{ textDecoration: "underline" }}> TIDAK MEMILIKI AFILIASI, IKATAN BENTUKAN, ATAUPUN KONTRAK KERJA SAMA</strong> dengan
                                Badan Gizi Nasional (BGN), Kementerian Kesehatan, maupun institusi resmi Pemerintah Republik Indonesia manapun.
                                Segala bentuk hasil perhitungan (kalori, analisis <i>food cost</i>, dll.) yang keluar dari aplikasi ini
                                direkomendasikan untuk divalidasi ulang secara empiris oleh tenaga ahli yang bertanggung jawab atas program di lapangan,
                                serta <b>sama sekali tidak dapat digunakan sebagai acuan hukum negara</b>.
                            </div>
                        </div>
                    </div>
                </AlertBox>
            </div>

            {/* Hak Cipta & Kekayaan Intelektual */}
            <div className="card" style={{ background: "#f8fafc", border: "1px solid #cbd5e1" }}>
                <div className="card-body" style={{ display: "flex", gap: 16 }}>
                    <div style={{ fontSize: 28 }}>⚖️</div>
                    <div>
                        <h3 style={{ margin: "0 0 6px", fontSize: 15, color: "#334155" }}>HAK CIPTA & KEKAYAAN INTELEKTUAL (HAKI)</h3>
                        <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.6, textAlign: "justify" }}>
                            Seluruh arsitektur basis data, kode sumber perangkat lunak, algoritma logika perhitungan gizi matematis, dan
                            desain rekayasa antarmuka pengguna platform SiGizi MBG ini diikat dan dilindungi secara sah oleh
                            <strong> Undang-Undang Nomor 28 Tahun 2014 Tentang Hak Cipta</strong>. Aplikasi ini disebarluaskan dan diedarkan
                            terbatas murni sebagai sarana edukasi riset dan utilitas alat bantu profesi.
                            <br /><br />
                            <span style={{ color: "#b91c1c", fontWeight: 700 }}>
                                DILARANG KERAS memperbanyak, memodifikasi, mengomersialkan lisensi, atau mengklaim kepemilikan platform
                                ini untuk keperluan tender pengadaan pemerintah, lelang proyek komersial, atau praktik monetisasi
                                tanpa izin lisensi tertulis Pencipta. Berbagai rekam digital aplikasi ini diaudit mutlak secara tertutup.
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ textAlign: "center", marginTop: 40, fontSize: 12, color: "var(--txt3)", fontWeight: 500 }}>
                Dibuat dari Indonesia, demi Kedaulatan Gizi Nusantara. <br />
                © 2026 SiGizi MBG Project. All rights reserved.
            </div>

        </div>
    );
}
