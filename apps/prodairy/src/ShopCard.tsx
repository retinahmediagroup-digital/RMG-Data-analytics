import { useState } from "react";
import { ActionBadge } from "@prolife/ui/components/ActionBadge";
import { metricsKey, type ShopMetrics } from "@prolife/ui/types";

interface ShopCardProps {
  metrics: ShopMetrics;
  qty: number;
  isOverridden: boolean;
  onSave: (shop: string, product: string, qty: number) => void;
  highlighted?: boolean;
  onSelect?: (shop: string, product: string) => void;
  /** Show the product name under the shop name - only needed once more than one product is in view. */
  showProduct?: boolean;
}

export function shopCardId(shop: string, product: string): string {
  return `shopcard-${metricsKey(shop, product).replace(/\s+/g, "_")}`;
}

export function ShopCard({ metrics: m, qty, isOverridden, onSave, highlighted, onSelect, showProduct }: ShopCardProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(String(qty));

  function save() {
    const val = Number(draft);
    if (!isNaN(val) && val >= 0) {
      onSave(m.shop, m.product, Math.round(val));
    }
  }

  return (
    <div id={shopCardId(m.shop, m.product)} className={`shopcard${highlighted ? " highlighted" : ""}`}>
      <h3 style={onSelect ? { cursor: "pointer" } : undefined} onClick={() => onSelect?.(m.shop, m.product)}>
        {m.shop}
      </h3>
      {showProduct && <p className="shopcard-product">{m.product}</p>}
      <div className="metric-row"><span>Sell-through</span><span className="v">{Math.round(m.sellThrough)}%</span></div>
      <div className="metric-row"><span>Avg stock-out days</span><span className="v">{m.avgStockout.toFixed(1)}</span></div>
      <div className="metric-row"><span>Weeks of cover</span><span className="v">{m.weeksCover !== null ? m.weeksCover.toFixed(1) : "—"}</span></div>
      <div className="metric-row"><span>Demand trend</span><span className="v">{m.trend}</span></div>
      <ActionBadge action={m.action} />
      <div className="allocrow">
        <div>
          <div className="lbl">Recommended next order</div>
          <div className="qty">{qty} pouches</div>
          {isOverridden && <div className="adjusted-note">Adjusted from {m.recommendedQty} (Retinah's recommendation)</div>}
        </div>
        <button className="editbtn" onClick={() => { setDraft(String(qty)); setOpen((o) => !o); }}>Edit</button>
      </div>
      {open && (
        <div className="editbox" style={{ display: "flex" }}>
          <input type="number" min={0} value={draft} onChange={(e) => setDraft(e.target.value)} />
          <button onClick={save}>Save</button>
        </div>
      )}
    </div>
  );
}
