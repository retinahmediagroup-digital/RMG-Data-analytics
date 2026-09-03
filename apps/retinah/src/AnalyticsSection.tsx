import { useMemo, useState } from "react";
import type { ChartConfiguration } from "chart.js/auto";
import { StatTile } from "@prolife/ui/components/StatTile";
import { ChartCanvas } from "@prolife/ui/components/ChartCanvas";
import { SalesHeatmap } from "@prolife/ui/components/SalesHeatmap";
import { metricsKey, type ShopMetrics } from "@prolife/ui/types";
import { COLORS, actionColor } from "@prolife/ui/palette";

interface AnalyticsSectionProps {
  metrics: ShopMetrics[];
  overrides: Record<string, number>;
  onExport: () => void;
}

export function AnalyticsSection({ metrics, overrides, onExport }: AnalyticsSectionProps) {
  const qtyFor = (shop: string, product: string, recommended: number) =>
    overrides[metricsKey(shop, product)] ?? recommended;

  const products = useMemo(() => [...new Set(metrics.map((m) => m.product))], [metrics]);
  const multiProduct = products.length > 1;
  const [productFilter, setProductFilter] = useState<string>("All");

  // Every stat and chart below reads off this, not the raw metrics - selecting one
  // product gives a genuinely isolated view of it (KPIs included), not just a filtered
  // chart under still-blended headline numbers.
  const view = useMemo(
    () => (productFilter === "All" ? metrics : metrics.filter((m) => m.product === productFilter)),
    [metrics, productFilter]
  );
  const labelFor = (m: ShopMetrics) => (multiProduct && productFilter === "All" ? `${m.shop} · ${m.product}` : m.shop);

  const totalStockouts = view.filter((m) => m.avgStockout > 0).length;
  const totalIncrease = view
    .filter((m) => m.action === "Increase")
    .reduce((a, m) => a + qtyFor(m.shop, m.product, m.recommendedQty), 0);
  const avgSellThrough = view.length ? Math.round(view.reduce((a, m) => a + m.sellThrough, 0) / view.length) : 0;

  // Total units sold per week across shops in view - a genuine trend read straight off
  // the editable stock data below, so it moves the moment you add/edit a row.
  const weeklyTotalSold = (view[0]?.weeks ?? []).map((_, i) => view.reduce((a, m) => a + (m.sold[i] ?? 0), 0));

  const sellConfig: ChartConfiguration = {
    type: "bar",
    data: {
      labels: view.map(labelFor),
      datasets: [{ data: view.map((m) => Math.round(m.sellThrough)), backgroundColor: COLORS.purple, borderRadius: 4 }],
    },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100 } } },
  };

  const allocConfig: ChartConfiguration = {
    type: "bar",
    data: {
      labels: view.map(labelFor),
      datasets: [
        {
          data: view.map((m) => qtyFor(m.shop, m.product, m.recommendedQty)),
          backgroundColor: view.map((m) => actionColor(m.action)),
          borderRadius: 4,
        },
      ],
    },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
  };

  return (
    <section id="analytics">
      <div className="section-title">
        Analytics
        <div className="section-actions">
          {multiProduct && (
            <select className="product-filter" value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
              <option value="All">All products</option>
              {products.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          )}
          <button className="exportbtn" onClick={onExport}>Export allocation plan</button>
        </div>
      </div>
      <div className="kpis">
        <StatTile label="Shops reporting" value={view.length} accent="ink" note="Rows in the table below" />
        <StatTile
          label="Avg sell-through"
          value={`${avgSellThrough}%`}
          accent="purple"
          sparkline={weeklyTotalSold}
          note="Sparkline = total units sold per week"
        />
        <StatTile
          label="Shops with stock-outs"
          value={totalStockouts}
          accent={totalStockouts > 0 ? "gold" : "good"}
          note={totalStockouts > 0 ? "Needs attention this week" : "No shop reported a stock-out this week"}
        />
        <StatTile
          label="Pouches to reallocate"
          value={totalIncrease}
          accent="gold"
          note={totalIncrease > 0 ? "Sum across Increase-flagged shops" : "None flagged yet"}
        />
      </div>
      <div className="chartcard" style={{ marginBottom: 16 }}>
        <h3>Weekly units sold</h3>
        <p className="cap">Units sold by shop and week (darker means more)</p>
        <SalesHeatmap metrics={view} />
      </div>
      <div className="charts">
        <div className="chartcard">
          <h3>Sell-through %</h3>
          <p className="cap">Sold ÷ (opening + received)</p>
          <ChartCanvas config={sellConfig} />
        </div>
        <div className="chartcard">
          <h3>Recommended allocation</h3>
          <p className="cap">Pouches, next week</p>
          <ChartCanvas config={allocConfig} />
        </div>
      </div>
    </section>
  );
}
