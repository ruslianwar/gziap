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
