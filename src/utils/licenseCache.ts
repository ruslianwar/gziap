// File: src/utils/licenseCache.ts

interface LicenseCache {
    valid: boolean;
    expires_at: string;
    days_remaining: number;
    last_checked: number; // timestamp
    licenseHash?: string; // TAMBAHAN: Menyimpan hash lisensi untuk validasi akun
}

const CACHE_KEY = 'sigizi_license_cache';
const CACHE_VALIDITY_DAYS = 7;

/**
 * Menyimpan status lisensi ke localStorage
 */
export function setLicenseCache(valid: boolean, expires_at: string, days_remaining: number, licenseHash?: string) {
    const cache: LicenseCache = {
        valid,
        expires_at,
        days_remaining,
        last_checked: Date.now(),
        licenseHash
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

/**
 * Menghapus/membersihkan status lisensi
 */
export function clearLicenseCache() {
    localStorage.removeItem(CACHE_KEY);
}

/**
 * Membaca status lisensi secara lokal (offline)
 * Mengembalikan cache jika usianya masih dalam toleransi (misal 7 hari)
 */
export function getLicenseCache(): { isValid: boolean, isExpiredCache: boolean, licenseHash?: string, data?: LicenseCache } {
    const str = localStorage.getItem(CACHE_KEY);
    if (!str) return { isValid: false, isExpiredCache: false };

    try {
        const cache: LicenseCache = JSON.parse(str);
        if (!cache.valid) return { isValid: false, isExpiredCache: false, data: cache };

        // Cek umur cache
        const daysSinceChecked = (Date.now() - cache.last_checked) / (1000 * 3600 * 24);

        // Cek apakah lisensi sendiri sudah kadaluarsa secara tanggal absolut
        const isLicenseExpiredNow = new Date(cache.expires_at) < new Date();

        if (isLicenseExpiredNow) {
            return { isValid: false, isExpiredCache: false, data: cache };
        }

        if (daysSinceChecked > CACHE_VALIDITY_DAYS) {
            return { isValid: false, isExpiredCache: true, data: cache, licenseHash: cache.licenseHash };
        }

        return { isValid: true, isExpiredCache: false, data: cache, licenseHash: cache.licenseHash };
    } catch (err) {
        return { isValid: false, isExpiredCache: false };
    }
}
