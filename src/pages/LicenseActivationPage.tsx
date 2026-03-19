// File: src/pages/LicenseActivationPage.tsx
import React, { useState } from 'react';
import { getDeviceFingerprint, getDeviceName } from '../utils/deviceFingerprint';
import { setLicenseCache } from '../utils/licenseCache';

interface Props {
    onSuccess: () => void;
    cacheWarning?: string;
}

export default function LicenseActivationPage({ onSuccess, cacheWarning }: Props) {
    const [licenseKey, setLicenseKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');

        if (val.length > 5 && val.charAt(5) !== '-') val = val.replace(/^(.{5})(.+)$/, '$1-$2');
        if (val.length > 10 && val.charAt(10) !== '-') val = val.replace(/^(.{10})(.+)$/, '$1-$2');
        if (val.length > 15 && val.charAt(15) !== '-') val = val.replace(/^(.{15})(.+)$/, '$1-$2');
        if (val.length > 20 && val.charAt(20) !== '-') val = val.replace(/^(.{20})(.+)$/, '$1-$2');

        if (val.length <= 25) setLicenseKey(val);
    };

    const hashKey = async (key: string) => {
        const msgUint8 = new TextEncoder().encode(key);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (licenseKey.length < 25) {
            setErrorMsg('Format License Key tidak lengkap');
            return;
        }

        setErrorMsg('');
        setLoading(true);

        try {
            const fingerprint = await getDeviceFingerprint();
            const deviceName = await getDeviceName();

            if (!fingerprint) {
                throw new Error("Gagal mengenali identitas komputer ini.");
            }

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/activate-license`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    license_key: licenseKey,
                    device_fingerprint: fingerprint,
                    device_name: deviceName
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || result.reason || 'Sistem aktivasi gagal.');
            }

            const hashedKey = await hashKey(licenseKey);
            const expiresAt = new Date(result.expires_at);
            const daysRemaining = Math.ceil((expiresAt.getTime() - new Date().getTime()) / (1000 * 3600 * 24));

            // Simpan cache termasuk hash untuk binding
            setLicenseCache(true, result.expires_at, daysRemaining, hashedKey);

            setIsSuccess(true);
            setTimeout(() => {
                onSuccess();
            }, 2000);
        } catch (err: any) {
            setErrorMsg(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #1c4d32 0%, #065f46 100%)', color: '#fff'
            }}>
                <div style={{ textAlign: 'center', animation: 'fadeInUp 0.6s ease' }}>
                    <div style={{ fontSize: 80, marginBottom: 24, animation: 'bounceIn 0.8s' }}>✅</div>
                    <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 16px 0' }}>Aktivasi Berhasil!</h1>
                    <p style={{ fontSize: 18, opacity: 0.9 }}>Sedang menyiapkan gerbang login...</p>
                    <style>{`
                        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                        @keyframes bounceIn { 0% { transform: scale(0.3); opacity: 0; } 50% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(1); } }
                    `}</style>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            padding: 24, fontFamily: '"Outfit", sans-serif'
        }}>
            <div style={{
                width: '100%', maxWidth: 480, background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(20px)', borderRadius: 24, padding: 48,
                boxShadow: '0 20px 50px rgba(0, 78, 56, 0.1)', border: '1px solid rgba(255, 255, 255, 0.5)',
                textAlign: 'center'
            }}>
                <div style={{
                    width: 80, height: 80, background: '#1c4d32', borderRadius: 20,
                    margin: '0 auto 32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 40, boxShadow: '0 10px 20px rgba(28, 77, 50, 0.3)'
                }}>🔑</div>

                <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 12px 0', color: '#1c4d32' }}>
                    Aktivasi SaaS SiGizi
                </h1>
                <p style={{ color: '#4b5563', fontSize: 16, margin: '0 0 32px 0', lineHeight: 1.6 }}>
                    {cacheWarning ? (
                        <span style={{ color: '#dc2626', fontWeight: 600 }}>⚠️ {cacheWarning}</span>
                    ) : (
                        "Masukkan Kunci Lisensi Anda untuk membuka akses penuh pada perangkat ini."
                    )}
                </p>

                <form onSubmit={handleActivate}>
                    <div style={{ marginBottom: 24, textAlign: 'left' }}>
                        <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#1c4d32', marginBottom: 12, marginLeft: 4 }}>
                            LICENSE KEY
                        </label>
                        <input
                            type="text"
                            placeholder="SGIZI-XXXX-XXXX-XXXX-XXXX"
                            value={licenseKey}
                            onChange={handleInputChange}
                            autoFocus
                            autoComplete="off"
                            disabled={loading}
                            style={{
                                width: '100%', padding: '16px 20px', borderRadius: 16, border: '2px solid #e5e7eb',
                                fontSize: 20, fontFamily: 'monospace', textAlign: 'center', letterSpacing: '4px',
                                transition: 'all 0.3s ease', outline: 'none', background: '#fff'
                            }}
                        />
                    </div>

                    {errorMsg && (
                        <div style={{
                            background: '#fef2f2', color: '#dc2626', padding: '16px',
                            borderRadius: 16, fontSize: 14, marginBottom: 24, border: '1px solid #fee2e2'
                        }}>
                            <strong>Gagal:</strong> {errorMsg}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || licenseKey.length < 25}
                        style={{
                            width: '100%', padding: '18px', background: '#1c4d32', color: '#fff',
                            border: 'none', borderRadius: 16, fontSize: 16, fontWeight: 700,
                            cursor: (loading || licenseKey.length < 25) ? 'not-allowed' : 'pointer',
                            boxShadow: '0 10px 20px rgba(28, 77, 50, 0.2)', transition: 'all 0.3s',
                            opacity: (loading || licenseKey.length < 25) ? 0.6 : 1
                        }}
                    >
                        {loading ? 'Sedang Memvalidasi...' : 'Aktifkan Perangkat Sekarang'}
                    </button>

                    <p style={{ marginTop: 24, fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
                        * Aktivasi ini mengunci lisensi ke perangkat Anda.<br />
                        Anda tetap perlu login setelah tahap ini.
                    </p>
                </form>
            </div>
        </div>
    );
}
