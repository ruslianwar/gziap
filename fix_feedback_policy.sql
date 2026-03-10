-- SKRIP PENAMBAL (PATCH) RLS SUPERADMIN UNTUK TABEL FEEDBACK
-- Harap jalankan script ini di SQL Editor Supabase Anda

-- Menambahkan kebijakan untuk Superadmin/Admin agar bisa membaca SEMUA isi tabel user_feedback
CREATE POLICY "Superadmin can view all feedback"
ON public.user_feedback
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND (user_profiles.role = 'superadmin' OR user_profiles.role = 'admin')
  )
);

-- Menambahkan kebijakan agar Superadmin/Admin bisa meng-update status tabel (misalnya merubah 'Belum Dibaca' menjadi 'Sudah Dibaca')
CREATE POLICY "Superadmin can update feedback"
ON public.user_feedback
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND (user_profiles.role = 'superadmin' OR user_profiles.role = 'admin')
  )
);
