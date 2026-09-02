export type StatAccent = "ink" | "teal" | "gold" | "purple" | "good";

interface StatTileProps {
  label: string;
  value: string | number;
  accent?: StatAccent;
  /** A short run of real values (e.g. per week) drawn as a small sparkline. */
  sparkline?: number[];
  /** e.g. "+4% vs W33" - sign decides the arrow and color. */
  delta?: { text: string; direction: "up" | "down" | "flat" };
  /** One line of context under the value - the "why this number" story. */
  note?: string;
  onClick?: () => void;
  active?: boolean;
}

function sparklinePoints(values: number[], width: number, height: number): string {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / span) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function StatTile({ label, value, accent = "ink", sparkline, delta, note, onClick, active }: StatTileProps) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={`stattile stattile-${accent}${active ? " active" : ""}${onClick ? " clickable" : ""}`}
      onClick={onClick}
    >
      <div className="stattile-top">
        <span className="lbl">{label}</span>
        {sparkline && sparkline.length > 1 && (
          <svg className="stattile-spark" viewBox="0 0 60 20" preserveAspectRatio="none">
            <polyline points={sparklinePoints(sparkline, 60, 20)} fill="none" strokeWidth="2" />
          </svg>
        )}
      </div>
      <div className="num">{value}</div>
      {delta && (
        <div className={`stattile-delta stattile-delta-${delta.direction}`}>
          {delta.direction === "up" ? "▲" : delta.direction === "down" ? "▼" : "–"} {delta.text}
        </div>
      )}
      {note && <div className="stattile-note">{note}</div>}
    </Tag>
  );
}
