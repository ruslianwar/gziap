-- SKRIP PEMBUATAN TABEL FEEDBACK (Untuk dijalankan Superadmin di Supabase SQL Editor)
-- ----------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dibuat_oleh UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    nama_lengkap TEXT NOT NULL,
    jenis_masukan TEXT NOT NULL,
    pesan TEXT NOT NULL,
    status TEXT DEFAULT 'TERKIRIM',
    dibaca BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aturan Keamanan (RLS)
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Pengguna hanya bisa melihat laporan miliknya sendiri, KECUALI superadmin yang bisa melihat semua
CREATE POLICY "Users can view own feedback"
ON public.user_feedback
FOR SELECT
USING ( auth.uid() = dibuat_oleh );

-- Pengguna diizinkan menyisipkan (insert) laporan mereka ke tabel ini
CREATE POLICY "Users can insert own feedback"
ON public.user_feedback
FOR INSERT
WITH CHECK ( auth.uid() = dibuat_oleh );

-- Admin bisa membaca semuanya (jika tabel policy memungkinkan)
-- Tapi asumsi fungsi ini hanya menampung laporan masuk.

-- Menjadikan Waktu Eksekusi Lebih Cepat
CREATE INDEX IF NOT EXISTS idx_user_feedback_dibuat_oleh ON public.user_feedback(dibuat_oleh);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON public.user_feedback(status);
