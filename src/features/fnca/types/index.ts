// File: src/features/fnca/types/index.ts

export interface FoodItem {
  id: number;
  nama: string;
  kategori: string;
  urt: string; // Ukuran Rumah Tangga
  energi: number;
  protein: number;
  lemak: number;
  karbo: number;
  harga_per_100g: number;
}

export interface MenuItem {
  id: string;
  food: FoodItem;
  gram: number;
}
