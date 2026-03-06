// File: src/pages/QCPage.tsx
import { useState } from "react";
import { ProgBar } from "../components/ProgBar";
import { AlertBox } from "../components/AlertBox";

export default function QCPage() {
  const [activeTab, setActiveTab] = useState<"checklist" | "organo" | "sample">(
    "checklist",
  );
  const todayISO = new Date().toISOString().split("T")[0];

  // State untuk Checklist
  const [checklist, setChecklist] = useState([
    {
      id: 1,
      label: "Bahan pangan segar, tidak berlendir/bau",
      sub: "Periksa setiap bahan satu per satu",
      checked: false,
      kategori: "Bahan Mentah",
    },
    {
      id: 2,
      label: "Sayuran segar, warna cerah, tidak layu",
      sub: "Tidak ada tanda pembusukan",
      checked: false,
      kategori: "Bahan Mentah",
    },
    {
      id: 3,
      label: "Suhu penyimpanan sesuai standar",
      sub: "Kulkas ≤4°C, freezer ≤-18°C",
      checked: false,
      kategori: "Sanitasi",
    },
  ]);

  // State untuk Organoleptik
  const [organo, setOrgano] = useState({
    rasa: 0,
    warna: 0,
    aroma: 0,
    tekstur: 0,
  });

  const toggleCheck = (id: number) => {
    setChecklist((prev) =>
      prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c)),
    );
  };

  const passedCount = checklist.filter((c) => c.checked).length;
  const pct = Math.round((passedCount / checklist.length) * 100);

  const avgOrgano =
    organo.rasa && organo.warna && organo.aroma && organo.tekstur
      ? (
          (organo.rasa + organo.warna + organo.aroma + organo.tekstur) /
          4
        ).toFixed(1)
      : 0;

  return (
    <div>
      <div className="topbar">
        <div className="tb-bread">
          SiGizi MBG / <span>QC & Organoleptik</span>
        </div>
      </div>

      <div className="ph">
        <div className="ph-title">Quality Control & Uji Organoleptik</div>
        <div className="ph-sub">
          Inspeksi bahan pangan, uji sensori, dan pendataan food sample
        </div>
      </div>

      {/* Grid Statistik Atas */}
      <div className="sg sg-4">
        {[
          {
            icon: "✅",
            color: "#d8f3dc",
            val: `${passedCount}/${checklist.length}`,
            lbl: "Checklist Passed",
          },
          {
            icon: "📊",
            color: pct >= 80 ? "#d8f3dc" : "#fef3c7",
            val: `${pct}%`,
            lbl: "Skor QC Hari Ini",
          },
          {
            icon: "🧪",
            color: "#e0e7ff",
            val: avgOrgano || "—",
            lbl: "Skor Organoleptik",
          },
          { icon: "🧊", color: "#fce7f3", val: "2", lbl: "Sample Tersimpan" },
        ].map((s, i) => (
          <div key={i} className="sc">
            <div className="sc-icon" style={{ background: s.color }}>
              {s.icon}
            </div>
            <div className="sc-val">{s.val}</div>
            <div className="sc-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Navigasi TABS */}
      <div className="tabs">
        {[
          { id: "checklist", label: "📋 Checklist Inspeksi" },
          { id: "organo", label: "🧪 Uji Organoleptik" },
          { id: "sample", label: "🧊 Food Sample" },
        ].map((tab) => (
          <div
            key={tab.id}
            className={`tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {/* KONTEN TAB: CHECKLIST */}
      {activeTab === "checklist" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: 18,
            alignItems: "start",
          }}
        >
          <div className="card">
            <div className="card-header">
              <div>
                <div className="ch-title">📋 Checklist Inspeksi Harian</div>
                <div className="ch-sub">{todayISO}</div>
              </div>
            </div>
            <div className="card-body">
              {["Bahan Mentah", "Sanitasi"].map((kat) => (
                <div key={kat} style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--txt3)",
                      marginBottom: 8,
                      textTransform: "uppercase",
                    }}
                  >
                    {kat}
                  </div>
                  {checklist
                    .filter((c) => c.kategori === kat)
                    .map((c) => (
                      <div
                        key={c.id}
                        className={`qc-checklist-item ${c.checked ? "checked" : ""}`}
                        onClick={() => toggleCheck(c.id)}
                      >
                        <div className="qc-check-box">{c.checked && "✓"}</div>
                        <div>
                          <div className="qc-check-text">{c.label}</div>
                          <div className="qc-check-sub">{c.sub}</div>
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <div className="ch-title">📊 Hasil QC</div>
            </div>
            <div className="card-body" style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 52,
                  fontWeight: 600,
                  color: pct >= 80 ? "#22c55e" : "#f59e0b",
                }}
              >
                {pct}%
              </div>
              <div
                style={{ fontSize: 13, color: "var(--txt3)", marginBottom: 16 }}
              >
                Skor Checklist
              </div>
              <ProgBar
                val={pct}
                max={100}
                color={pct >= 80 ? "#22c55e" : "#f59e0b"}
                className="prog-lg"
              />
              <div style={{ marginTop: 14 }}>
                <AlertBox type={pct >= 80 ? "ok" : "warn"}>
                  {pct >= 80
                    ? "Kualitas BAIK — Makanan layak didistribusikan"
                    : "Kualitas CUKUP — Penuhi sisa checklist"}
                </AlertBox>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KONTEN TAB: ORGANOLEPTIK */}
      {activeTab === "organo" && (
        <div className="card">
          <div className="card-header">
            <div className="ch-title">🧪 Uji Sensori (Organoleptik)</div>
          </div>
          <div className="card-body">
            <AlertBox type="info" style={{ marginBottom: 20 }}>
              Klik bintang untuk memberikan penilaian rasa, aroma, warna, dan
              tekstur makanan hari ini.
            </AlertBox>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
              }}
            >
              {(["rasa", "warna", "aroma", "tekstur"] as const).map((k) => (
                <div key={k} className="fg">
                  <label className="fl" style={{ textTransform: "capitalize" }}>
                    {k} (1-5)
                  </label>
                  <div className="organo-score">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className={`organo-star ${organo[k] >= n ? "active" : ""}`}
                        onClick={() => setOrgano((p) => ({ ...p, [k]: n }))}
                      >
                        {organo[k] >= n ? "⭐" : "☆"}
                      </div>
                    ))}
                    <span
                      style={{ fontSize: 13, fontWeight: 700, marginLeft: 8 }}
                    >
                      {organo[k] ? `${organo[k]}/5` : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KONTEN TAB: SAMPLE */}
      {activeTab === "sample" && (
        <div className="card">
          <div className="card-header">
            <div className="ch-title">🧊 Food Sample</div>
          </div>
          <div className="card-body">
            <AlertBox type="info">
              Fitur pendataan lokasi dan suhu penyimpanan Food Sample akan
              terhubung dengan sensor suhu IoT di pengembangan fase 3.
            </AlertBox>
          </div>
        </div>
      )}
    </div>
  );
}
