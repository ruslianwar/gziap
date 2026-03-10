-- =====================================================
-- SQL POLICIES UNTUK RLS (Row Level Security)
-- Tabel: rencana_menu
-- Jalankan di Supabase Dashboard → SQL Editor
-- =====================================================

-- Hapus policy lama jika ada (agar tidak bentrok)
DROP POLICY IF EXISTS "Users can view own menus" ON rencana_menu;
DROP POLICY IF EXISTS "Admin can view all menus" ON rencana_menu;
DROP POLICY IF EXISTS "Users can insert own menus" ON rencana_menu;
DROP POLICY IF EXISTS "Users can update own menus" ON rencana_menu;
DROP POLICY IF EXISTS "Users can delete own menus" ON rencana_menu;

-- 1. SELECT: User biasa hanya bisa lihat menu miliknya sendiri
CREATE POLICY "Users can view own menus" ON rencana_menu
  FOR SELECT USING (auth.uid() = dibuat_oleh);

-- 2. SELECT: Admin/Superadmin bisa lihat SEMUA menu dari semua user
CREATE POLICY "Admin can view all menus" ON rencana_menu
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE role IN ('superadmin', 'admin')
    )
  );

-- 3. INSERT: User hanya bisa membuat menu atas nama dirinya
CREATE POLICY "Users can insert own menus" ON rencana_menu
  FOR INSERT WITH CHECK (auth.uid() = dibuat_oleh);

-- 4. UPDATE: User hanya bisa mengedit menu miliknya
CREATE POLICY "Users can update own menus" ON rencana_menu
  FOR UPDATE USING (auth.uid() = dibuat_oleh);

-- 5. DELETE: User hanya bisa menghapus menu miliknya
CREATE POLICY "Users can delete own menus" ON rencana_menu
  FOR DELETE USING (auth.uid() = dibuat_oleh);


-- =====================================================
-- Tabel: user_profiles (Manajemen Identitas Ahli Gizi / Mahasiswa)
-- =====================================================

-- Pastikan tabel ada terlebih dahulu (untuk instalasi baru)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  nama_lengkap TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Eksekusi aman untuk penambahan kolom profil secara bertahap
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS gelar TEXT,
  ADD COLUMN IF NOT EXISTS nama_sppg_instansi TEXT,
  ADD COLUMN IF NOT EXISTS nomor_str_nip TEXT;

-- Atur Row Level Security Profil Pengguna
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pengguna dapat melihat profilnya sendiri" ON user_profiles;
DROP POLICY IF EXISTS "Pengguna dapat mengupdate profilnya sendiri" ON user_profiles;

CREATE POLICY "Pengguna dapat melihat profilnya sendiri" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Pengguna dapat mengupdate profilnya sendiri" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger untuk membuat Profil Dasar ketika User Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, nama_lengkap, role)
  VALUES (new.id, new.email, split_part(new.email, '@', 1), 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Jatuhkan trigger lama jika ada, lalu lekatkan trigger baru ke auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- =====================================================
-- Tabel: app_settings (Untuk Pengaturan Global Superadmin)
-- =====================================================

CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value boolean DEFAULT true
);

-- Inisialisasi data default
INSERT INTO app_settings (key, value) VALUES
  ('supplychain', false),
  ('inventaris', false),
  ('distribusi', false),
  ('qc', false),
  ('antropometri', false),
  ('sekolah', false)
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Semua orang / user login bisa melihat
CREATE POLICY "Anyone can view app settings" ON app_settings
  FOR SELECT USING (true);

-- 2. ALL: Hanya role superadmin yang bisa mengubah
CREATE POLICY "Only superadmin can update settings" ON app_settings
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'superadmin'
    )
  );

-- =====================================================
-- Tabel: data_tkpi (Keamanan Kustom Multi-Tenant)
-- =====================================================

-- Tambahkan kolom owner/pembuat bila belum ada
ALTER TABLE IF EXISTS data_tkpi 
  ADD COLUMN IF NOT EXISTS dibuat_oleh UUID REFERENCES auth.users(id);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE data_tkpi ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada (agar tidak bentrok saat dieksekus ulang)
DROP POLICY IF EXISTS "Semua orang bisa baca TKPI Publik atau miliknya" ON data_tkpi;
DROP POLICY IF EXISTS "Hanya Pembuat yang bisa input Bahan Kustom" ON data_tkpi;
DROP POLICY IF EXISTS "Hanya Pembuat yang bisa ubah Kustom Lokal" ON data_tkpi;
DROP POLICY IF EXISTS "Hanya Pembuat yang bisa hapus Kustom Lokal" ON data_tkpi;

-- ATURAN: READ (SELECT)
-- Ahli gizi bisa membaca bahan jika bahan itu sifatnya publik (dibuat_oleh = NULL) 
-- ATAU bahan itu miliknya sendiri
CREATE POLICY "Semua orang bisa baca TKPI Publik atau miliknya" ON data_tkpi
  FOR SELECT USING (
    dibuat_oleh IS NULL OR auth.uid() = dibuat_oleh
  );

-- ATURAN: INSERT
-- Ahli gizi hanya diizinkan membuat bahan kustom apabila ia "menandatangani" kolom dibuat_oleh dengan id-nya sendiri
CREATE POLICY "Hanya Pembuat yang bisa input Bahan Kustom" ON data_tkpi
  FOR INSERT WITH CHECK (
    auth.uid() = dibuat_oleh
  );

-- ATURAN: UPDATE & DELETE
CREATE POLICY "Hanya Pembuat yang bisa ubah Kustom Lokal" ON data_tkpi
  FOR UPDATE USING (auth.uid() = dibuat_oleh);

CREATE POLICY "Hanya Pembuat yang bisa hapus Kustom Lokal" ON data_tkpi
  FOR DELETE USING (auth.uid() = dibuat_oleh);
