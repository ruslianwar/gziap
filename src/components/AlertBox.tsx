// File: src/components/AlertBox.tsx

interface Props {
  type?: "ok" | "warn" | "err" | "info";
  icon?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const AlertBox = ({ type = "ok", icon, children, style }: Props) => {
  const cls = {
    ok: "alert-ok",
    warn: "alert-warn",
    err: "alert-err",
    info: "alert-info",
  };
  const ic = { ok: "✅", warn: "⚠️", err: "🚫", info: "ℹ️" };

  return (
    <div className={`alert ${cls[type]}`} style={style}>
      <span>{icon || ic[type]}</span>
      <div>{children}</div>
    </div>
  );
};
