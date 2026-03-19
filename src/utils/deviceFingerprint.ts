// File: src/utils/deviceFingerprint.ts

/**
 * Mengambil Fingerprint Perangkat dari sistem operasi dengan menggunakan Tauri.
 * Di mode Web (browser murni), ini akan mereturn fallback null.
 */
export async function getDeviceFingerprint(): Promise<string | null> {
    // Cek apakah kita berada di lingkungan Tauri (Desktop App)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

    if (!isTauri) {
        console.log("Device Fingerprint: Berjalan di Web, tidak mengambil hardware ID.");
        return null; // Tidak digunakan di versi web
    }

    try {
        // Karena saat ini Tauri belum sepenuhnya diinstall via API client, kita
        // panggil modul invoker buatan nanti.
        // NOTE: ini akan terhubung ke src-tauri/src/main.rs -> 'get_device_fingerprint'
        // @ts-ignore
        const { invoke } = await import('@tauri-apps/api/core');
        const fingerprint = await invoke('get_device_fingerprint');
        return fingerprint as string;
    } catch (error) {
        console.error("Gagal mendapatkan device fingerprint via Tauri:", error);
        // Jika integrasi Rust gagal, generate random fallback agar app tidak stuck
        return 'FALLBACK_FINGERPRINT_' + Math.random().toString(36).substring(2, 10);
    }
}

/**
 * Mengambil nama perangkat/OS untuk ditampilkan ke dalam halaman manajemen
 */
export async function getDeviceName(): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
    if (!isTauri) {
        return 'Web Browser User';
    }

    try {
        // @ts-ignore
        const { invoke } = await import('@tauri-apps/api/core');
        return (await invoke('get_device_name')) as string;
    } catch (error) {
        return 'Unknown Desktop Device';
    }
}
