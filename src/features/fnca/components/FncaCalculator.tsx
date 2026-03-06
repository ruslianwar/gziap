import { useState } from "react";
import type { FoodItem, MenuItem } from "../types";

export const FncaCalculator = () => {
  const [selectedMeals, setSelectedMeals] = useState<MenuItem[]>([]);
  const [targetKalori] = useState(2000);

  const handleAddDummyFood = () => {
    const dummyFood: FoodItem = {
      id: 1,
      nama: "Nasi Putih",
      kategori: "Makanan Pokok",
      urt: "1 centong",
      energi: 175,
      protein: 3.7,
      lemak: 0.1,
      karbo: 40.6,
      harga_per_100g: 800,
    };

    setSelectedMeals((prev) => [
      ...prev,
      { id: Date.now().toString(), food: dummyFood, gram: 100 },
    ]);
  };

  const totalKalori = selectedMeals.reduce(
    (total, item) => total + item.food.energi * (item.gram / 100),
    0,
  );

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <div
        style={{
          background: "#1a3d2b",
          color: "white",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: 0 }}>FNCA - Food Nutrition Content Analysis</h2>
        <p style={{ margin: 0, opacity: 0.8 }}>
          Kalkulator Gizi & Perencanaan Menu MBG
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: "20px",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "20px",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
          }}
        >
          <h3>Menu Makan Siang</h3>
          <button
            onClick={handleAddDummyFood}
            style={{
              padding: "10px 15px",
              background: "#40916c",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              marginBottom: "15px",
            }}
          >
            + Tambah Nasi Putih (Contoh)
          </button>

          {selectedMeals.length === 0 ? (
            <p style={{ color: "#64748b" }}>
              Belum ada makanan yang ditambahkan.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {selectedMeals.map((item) => (
                <li
                  key={item.id}
                  style={{
                    padding: "10px",
                    borderBottom: "1px solid #f1f5f9",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    <strong>{item.food.nama}</strong> ({item.gram}g)
                  </span>
                  <span>{item.food.energi * (item.gram / 100)} kkal</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          style={{
            background: "white",
            padding: "20px",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
          }}
        >
          <h3>🎯 Ringkasan Gizi</h3>
          <div style={{ marginBottom: "10px" }}>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Total Energi / Target:
            </span>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: totalKalori >= targetKalori ? "#e76f51" : "#40916c",
              }}
            >
              {totalKalori} / {targetKalori} kkal
            </div>
          </div>
          <div
            style={{
              background: "#f8fafc",
              padding: "10px",
              borderRadius: "8px",
              fontSize: "13px",
            }}
          >
            <p>
              <strong>Status:</strong>{" "}
              {totalKalori >= targetKalori
                ? "Target Tercapai/Melebihi"
                : "Belum Mencapai Target"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
