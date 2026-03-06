// File: src/config/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

// Mengambil kunci rahasia dari file .env secara aman
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Memastikan aplikasi tidak berjalan jika kunci lupa dimasukkan
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL dan Anon Key harus diisi di file .env!");
}

// Mengekspor koneksi agar bisa dipakai di seluruh halaman aplikasi
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
