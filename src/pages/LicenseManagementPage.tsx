import { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { useUI } from '../contexts/UIContext';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface License {
    id: string;
    license_prefix: string;
    duration_months: number;
    max_devices: number;
    created_at: string;
    expires_at: string;
    is_active: boolean;
    is_revoked: boolean;
    activations?: any[];
}

export default function LicenseManagementPage() {
    const { showToast, showConfirm } = useUI();
    const [licenses, setLicenses] = useState<License[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [newKey, setNewKey] = useState<string | null>(null);

    // States untuk filter / search
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const loadLicenses = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('licenses')
                .select(`
          *,
          activations:license_activations(id, device_name, device_fingerprint, activated_at)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLicenses(data || []);
        } catch (error: any) {
            console.error('Bountiful License Error:', error);
            showToast(`Gagal memuat lisensi: ${error.message}${error.details ? ' (' + error.details + ')' : ''}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLicenses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleGenerateLicense = async (duration: number) => {
        try {
            setGenerating(true);
            setNewKey(null);
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) throw new Error('Anda harus login');

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-license`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        action: 'generate',
                        payload: { duration_months: duration, prefix_label: 'SGIZI' }
                    })
                }
            );

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Gagal generate lisensi');
            }

            setNewKey(result.license_key);
            showToast('Lisensi berhasil dibuat!', 'success');
            loadLicenses();
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setGenerating(false);
        }
    };

    const handleRevoke = async (id: string, isCurrentlyRevoked: boolean) => {
        const actionText = isCurrentlyRevoked ? "mengaktifkan kembali" : "mencabut/revoke";
        showConfirm(`Apakah Anda yakin ingin ${actionText} lisensi ini?`, async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const response = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-license`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`,
                        },
                        body: JSON.stringify({
                            action: 'revoke',
                            payload: { license_id: id, status: !isCurrentlyRevoked }
                        })
                    }
                );

                const result = await response.json();
                if (!response.ok || !result.success) throw new Error(result.error);

                showToast('Berhasil mengubah status lisensi', 'success');
                loadLicenses();
            } catch (error: any) {
                showToast(error.message, 'error');
            }
        });
    };

    const handleResetDevice = async (activationId: string) => {
        showConfirm('Reset tautan perangkat ini? Lisensi dapat digunakan di PC lain.', async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const response = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-license`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`,
                        },
                        body: JSON.stringify({
                            action: 'reset_device',
                            payload: { activation_id: activationId }
                        })
                    }
                );

                const result = await response.json();
                if (!response.ok || !result.success) throw new Error(result.error);

                showToast('Perangkat berhasil di-reset', 'success');
                loadLicenses();
            } catch (error: any) {
                showToast(error.message, 'error');
            }
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast('Lisensi disalin ke clipboard!', 'success');
    };

    // Filter & Pagination Logic
    const filteredData = licenses.filter(l => l.license_prefix.toLowerCase().includes(searchTerm.toLowerCase()));
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    if (loading && licenses.length === 0) return <div className="p-xl">Memuat data lisensi...</div>;

    return (
        <div className="page-container p-xl">
            <div className="ph-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 className="ph-title text-2xl font-bold">🔑 Manajemen Lisensi (SaaS)</h1>
                    <p className="subtitle text-sm text-gray-500 mt-1">
                        Kelola distribusi kunci aktivasi untuk aplikasi Desktop versi Offline.
                        <br /><span style={{ color: 'var(--primary)' }}>Catatan: Masa berlaku (Expired) dihitung statis sejak tanggal lisensi di-generate.</span>
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => handleGenerateLicense(6)}
                        disabled={generating}
                    >
                        + Generate Lisensi (6 Bulan)
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => handleGenerateLicense(12)}
                        disabled={generating}
                    >
                        + Generate Lisensi (12 Bulan)
                    </button>
                </div>
            </div>

            {newKey && (
                <div className="card mt-xl" style={{ backgroundColor: 'var(--bg-card)', border: '2px solid var(--primary)', padding: 24, borderRadius: 12 }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: 16, color: 'var(--txt1)' }}>Lisensi Berhasil Dibuat!</h3>
                    <p style={{ margin: '0 0 16px 0', fontSize: 14, color: 'var(--txt2)' }}>
                        Simpan kunci ini segera. Kunci ini tidak akan ditampilkan lagi secara utuh (diacak hash SHA-256).
                    </p>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <code style={{ padding: '8px 16px', background: 'var(--bg-body)', borderRadius: 6, fontSize: 18, fontWeight: 'bold', color: 'var(--primary)', flex: 1, letterSpacing: 2 }}>
                            {newKey}
                        </code>
                        <button className="btn btn-primary" onClick={() => copyToClipboard(newKey)}>Copy</button>
                    </div>
                </div>
            )}

            <div className="card mt-xl">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="ch-title">Daftar Lisensi</div>
                    <div>
                        <input
                            type="text"
                            className="input"
                            placeholder="Cari Prefix Lisensi..."
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            style={{ width: 250, padding: '6px 12px' }}
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Prefix Lisensi</th>
                                <th>Durasi</th>
                                <th>Kadaluarsa (Expired)</th>
                                <th>Status Aktif</th>
                                <th>Perangkat Terdaftar</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.map(license => {
                                const isExpired = new Date(license.expires_at) < new Date();

                                return (
                                    <tr key={license.id} style={{ opacity: license.is_revoked ? 0.6 : 1 }}>
                                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{license.license_prefix}</td>
                                        <td>{license.duration_months} Bulan</td>
                                        <td>
                                            <div>{format(new Date(license.expires_at), 'dd MMM yyyy', { locale: idLocale })}</div>
                                            {isExpired ? (
                                                <span style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>Kadaluarsa</span>
                                            ) : (
                                                <span style={{ fontSize: 12, color: 'var(--success)' }}>
                                                    Sisa {Math.ceil((new Date(license.expires_at).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} hari
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            {license.is_revoked ? (
                                                <span style={{ padding: '4px 8px', background: 'var(--danger)', color: 'white', borderRadius: 4, fontSize: 12 }}>Revoked</span>
                                            ) : (
                                                <span style={{ padding: '4px 8px', background: isExpired ? 'var(--g3)' : 'var(--success)', color: isExpired ? 'var(--txt2)' : 'white', borderRadius: 4, fontSize: 12 }}>
                                                    {isExpired ? 'Expired' : 'Aktif'}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            {!license.activations || license.activations.length === 0 ? (
                                                <em style={{ color: 'var(--txt3)' }}>Belum digunakan</em>
                                            ) : (
                                                license.activations.map(act => (
                                                    <div key={act.id} style={{ marginBottom: 4, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <span title={act.device_fingerprint}>💻 {act.device_name || 'PC'}</span>
                                                        <button
                                                            onClick={() => handleResetDevice(act.id)}
                                                            style={{ background: 'none', border: '1px solid var(--danger)', padding: '2px 6px', fontSize: 11, borderRadius: 4, color: 'var(--danger)', cursor: 'pointer' }}
                                                        >
                                                            Reset
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </td>
                                        <td>
                                            <button
                                                className={`btn ${license.is_revoked ? 'btn-secondary' : 'btn-danger'}`}
                                                style={{ padding: '6px 12px', fontSize: 13 }}
                                                onClick={() => handleRevoke(license.id, license.is_revoked)}
                                            >
                                                {license.is_revoked ? 'Pulihkan' : 'Revoke'}
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                            {currentData.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--txt3)' }}>
                                        Tidak ada data lisensi ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16, borderTop: '1px solid var(--border-color)' }}>
                        <button
                            className="btn btn-secondary"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                        >
                            Prev
                        </button>
                        <span style={{ padding: '6px 12px' }}>Halaman {currentPage} dari {totalPages}</span>
                        <button
                            className="btn btn-secondary"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
