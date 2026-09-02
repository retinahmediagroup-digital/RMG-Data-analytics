import { useMemo, useState } from "react";
import { metricsKey, type ShopMetrics } from "../types";
import { readableInkOn, sequentialTealColor } from "../palette";

interface SalesHeatmapProps {
  metrics: ShopMetrics[];
  /** Called with (shop, product) when a row is activated. */
  onSelectShop?: (shop: string, product: string) => void;
  /** metricsKey(shop, product) of the row to visually highlight. */
  selectedRowKey?: string | null;
}

type SortKey = "total" | number;

interface Tooltip {
  shop: string;
  product: string;
  week: string;
  value: number;
  x: number;
  y: number;
}

function totalOf(m: ShopMetrics): number {
  return m.sold.reduce((s, v) => s + v, 0);
}

/**
 * Shops x weeks grid, cell color = units sold (one-hue sequential, light->dark).
 * Replaces a multi-line trend chart for this data: with many shops there's no
 * categorical palette that keeps that many lines distinct (the ceiling is ~8
 * series before colors start repeating), and a heatmap scales to any shop count
 * while still showing both magnitude and the week-over-week pattern per row.
 *
 * One row per shop+product pair - a shop carrying two product lines gets two rows,
 * distinguished in the label, rather than merging their numbers.
 *
 * Interactive: click a column header to sort by that week instead of the total;
 * hover/focus a cell for a tooltip; click a row to select it (see onSelectShop).
 */
export function SalesHeatmap({ metrics, onSelectShop, selectedRowKey }: SalesHeatmapProps) {
  const weeks = metrics[0]?.weeks ?? [];
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  const multiProduct = useMemo(() => new Set(metrics.map((m) => m.product)).size > 1, [metrics]);

  const sorted = useMemo(() => {
    const value = (m: ShopMetrics) => (sortKey === "total" ? totalOf(m) : m.sold[sortKey] ?? 0);
    const dir = sortDir === "desc" ? -1 : 1;
    return [...metrics].sort((a, b) => dir * (value(a) - value(b)));
  }, [metrics, sortKey, sortDir]);

  const allValues = sorted.flatMap((m) => m.sold);
  const min = allValues.length ? Math.min(...allValues) : 0;
  const max = allValues.length ? Math.max(...allValues) : 1;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function showTooltipAt(x: number, y: number, shop: string, product: string, week: string, value: number) {
    setTooltip({ shop, product, week, value, x, y });
  }

  return (
    <div className="heatmap">
      <div className="heatmap-scroll">
        <table className="heatmap-table">
          <thead>
            <tr>
              <th className="heatmap-rowlabel">
                <button
                  type="button"
                  className={`heatmap-sortbtn${sortKey === "total" ? " active" : ""}`}
                  onClick={() => toggleSort("total")}
                >
                  Total {sortKey === "total" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                </button>
              </th>
              {weeks.map((w, i) => (
                <th key={w}>
                  <button
                    type="button"
                    className={`heatmap-sortbtn${sortKey === i ? " active" : ""}`}
                    onClick={() => toggleSort(i)}
                  >
                    {w} {sortKey === i ? (sortDir === "desc" ? "↓" : "↑") : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((m) => {
              const rowKey = metricsKey(m.shop, m.product);
              return (
                <tr
                  key={rowKey}
                  className={`heatmap-row${selectedRowKey === rowKey ? " selected" : ""}`}
                  onClick={() => onSelectShop?.(m.shop, m.product)}
                >
                  <th className="heatmap-rowlabel" scope="row">
                    {m.shop}
                    {multiProduct && <span className="heatmap-rowproduct"> · {m.product}</span>}
                  </th>
                  {m.sold.map((v, i) => {
                    const bg = sequentialTealColor(v, min, max);
                    return (
                      <td
                        key={i}
                        tabIndex={0}
                        style={{ background: bg, color: readableInkOn(bg) }}
                        onMouseMove={(e) => showTooltipAt(e.clientX, e.clientY, m.shop, m.product, weeks[i], v)}
                        onMouseLeave={() => setTooltip(null)}
                        onFocus={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          showTooltipAt(rect.left, rect.bottom, m.shop, m.product, weeks[i], v);
                        }}
                        onBlur={() => setTooltip(null)}
                      >
                        {v}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="heatmap-scale">
        <span>{min} units</span>
        <div className="heatmap-scale-bar" />
        <span>{max} units</span>
      </div>
      {tooltip && (
        <div className="heatmap-tooltip" style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}>
          <strong>{tooltip.value} units</strong>
          <span>
            {tooltip.shop} · {tooltip.week}
            {multiProduct && <> · {tooltip.product}</>}
          </span>
        </div>
      )}
    </div>
  );
}
