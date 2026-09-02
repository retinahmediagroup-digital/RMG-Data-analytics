export interface Kpi {
  num: string | number;
  lbl: string;
}

export function Kpis({ items }: { items: Kpi[] }) {
  return (
    <div className="kpis">
      {items.map((k) => (
        <div className="kpi" key={k.lbl}>
          <div className="num">{k.num}</div>
          <div className="lbl">{k.lbl}</div>
        </div>
      ))}
    </div>
  );
}
