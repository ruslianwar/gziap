// File: src/components/ProgBar.tsx

interface Props {
  val: number;
  max: number;
  color?: string;
  className?: string;
}

export const ProgBar = ({
  val,
  max,
  color = "#40916c",
  className = "prog-sm",
}: Props) => {
  const pct = max > 0 ? Math.min(100, Math.round((val / max) * 100)) : 0;
  // Logika warna otomatis jika tidak di-override
  const c =
    pct > 100 ? "#e76f51" : pct > 80 ? color : pct > 50 ? color : "#e9c46a";

  return (
    <div className={`prog-wrap ${className}`}>
      <div
        className="prog-fill"
        style={{
          width: `${Math.min(pct, 100)}%`,
          background: c,
          height: "100%",
        }}
      ></div>
    </div>
  );
};
