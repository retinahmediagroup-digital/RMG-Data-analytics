import { useMemo, useState } from "react";
import type { ChartConfiguration } from "chart.js/auto";
import logo from "@prolife/ui/assets/logo-life.jpeg";
import { StatTile } from "@prolife/ui/components/StatTile";
import { ChartCanvas } from "@prolife/ui/components/ChartCanvas";
import { SalesHeatmap } from "@prolife/ui/components/SalesHeatmap";
import { computeMetrics } from "@prolife/ui/allocation";
import { downloadCSV } from "@prolife/ui/csv";
import { seedStock } from "@prolife/ui/seedData";
import { actionColor } from "@prolife/ui/palette";
import { metricsKey, type Action } from "@prolife/ui/types";
import { ShopCard, shopCardId } from "./ShopCard";

const ACTION_FILTERS: ("All" | Action)[] = ["All", "Increase", "Reduce", "Maintain"];

export default function App() {
  const metrics = useMemo(() => computeMetrics(seedStock), []);
  const products = useMemo(() => [...new Set(metrics.map((m) => m.product))], [metrics]);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<"All" | Action>("All");
  const [productFilter, setProductFilter] = useState<string>("All");
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);

  const qtyFor = (shop: string, product: string, recommended: number) =>
    overrides[metricsKey(shop, product)] ?? recommended;

  const filteredMetrics = useMemo(() => {
    const term = search.trim().toLowerCase();
    return metrics.filter(
      (m) =>
        (actionFilter === "All" || m.action === actionFilter) &&
        (productFilter === "All" || m.product === productFilter) &&
        m.shop.toLowerCase().includes(term)
    );
  }, [metrics, search, actionFilter, productFilter]);
  const multiProduct = products.length > 1;

  const totalStockouts = metrics.filter((m) => m.avgStockout > 0).length;
  const totalIncrease = metrics
    .filter((m) => m.action === "Increase")
    .reduce((a, m) => a + qtyFor(m.shop, m.product, m.recommendedQty), 0);
  const avgSellThrough = metrics.length
    ? Math.round(metrics.reduce((a, m) => a + m.sellThrough, 0) / metrics.length)
    : 0;

  // Real week-by-week sell-through across all shops (not the per-shop average metrics
  // carry) - the one figure in this dataset with an honest trend to show, since it's
  // computed straight from the weekly rows rather than modeled.
  const weeklySellThrough = useMemo(() => {
    const weeks = [...new Set(seedStock.map((e) => e.week))];
    return weeks.map((w) => {
      const rows = seedStock.filter((e) => e.week === w);
      const sold = rows.reduce((a, r) => a + r.sold, 0);
      const base = rows.reduce((a, r) => a + r.opening + r.received, 0);
      return base > 0 ? Math.round((sold / base) * 100) : 0;
    });
  }, []);
  const sellThroughDelta = (() => {
    if (weeklySellThrough.length < 2) return undefined;
    const diff = weeklySellThrough[weeklySellThrough.length - 1] - weeklySellThrough[0];
    const firstWeek = (seedStock[0]?.week ?? "").replace(/^\d{4}-/, "") || "first week";
    if (diff === 0) return { text: `flat vs ${firstWeek}`, direction: "flat" as const };
    return diff > 0
      ? { text: `${diff}pt vs ${firstWeek}`, direction: "up" as const }
      : { text: `${Math.abs(diff)}pt vs ${firstWeek}`, direction: "down" as const };
  })();

  const allocConfig: ChartConfiguration = {
    type: "bar",
    data: {
      labels: filteredMetrics.map((m) => (multiProduct ? `${m.shop} · ${m.product}` : m.shop)),
      datasets: [
        {
          data: filteredMetrics.map((m) => qtyFor(m.shop, m.product, m.recommendedQty)),
          backgroundColor: filteredMetrics.map((m) => actionColor(m.action)),
          borderRadius: 4,
        },
      ],
    },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
  };

  function handleOverride(shop: string, product: string, qty: number) {
    setOverrides((prev) => ({ ...prev, [metricsKey(shop, product)]: qty }));
  }

  function selectShop(shop: string, product: string) {
    setSelectedRowKey(metricsKey(shop, product));
    document.getElementById(shopCardId(shop, product))?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function exportPlan() {
    const header = ["Shop", "Product", "Sell-through %", "Avg Stock-out Days", "Weeks of Cover", "Trend", "Action", "Recommended Qty"];
    const rows = [
      header,
      ...metrics.map((m) => [
        m.shop,
        m.product,
        Math.round(m.sellThrough),
        m.avgStockout.toFixed(1),
        m.weeksCover !== null ? m.weeksCover.toFixed(1) : "",
        m.trend,
        m.action,
        qtyFor(m.shop, m.product, m.recommendedQty),
      ]),
    ];
    downloadCSV("prodairy_allocation_plan.csv", rows);
  }

  return (
    <div className="wrap">
      <header>
        <img src={logo} alt="Prolife logo" style={{ height: 40, width: "auto", display: "block" }} />
        <div>
          <p className="eyebrow">PROLIFE · PRODAIRY DASHBOARD</p>
          <h1>Weekly performance &amp; allocation</h1>
        </div>
      </header>
      <p className="sub">Recommended stock allocations from Retinah's weekly analysis — review and adjust before they go out.</p>
      <div className="banner">Week 2026-W36 · Read-only, except recommended quantities.</div>

      <div className="kpis">
        <StatTile
          label="Shops reporting"
          value={metrics.length}
          accent="ink"
          note={search || actionFilter !== "All" || productFilter !== "All" ? "Clear filters" : "All reporting"}
          onClick={
            search || actionFilter !== "All" || productFilter !== "All"
              ? () => { setSearch(""); setActionFilter("All"); setProductFilter("All"); }
              : undefined
          }
        />
        <StatTile
          label="Avg sell-through"
          value={`${avgSellThrough}%`}
          accent="teal"
          sparkline={weeklySellThrough}
          delta={sellThroughDelta}
        />
        <StatTile
          label="Shops with stock-outs"
          value={totalStockouts}
          accent={totalStockouts > 0 ? "gold" : "good"}
          note={totalStockouts > 0 ? "Needs attention" : "None this week"}
        />
        <StatTile
          label="Pouches to reallocate"
          value={totalIncrease}
          accent="gold"
          active={actionFilter === "Increase"}
          onClick={() => setActionFilter(actionFilter === "Increase" ? "All" : "Increase")}
          note={totalIncrease > 0 ? "Click to filter" : "None flagged"}
        />
      </div>

      <div className="filterbar">
        <input
          type="search"
          placeholder="Search shops…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {ACTION_FILTERS.map((a) => (
          <button
            key={a}
            type="button"
            className={`chip${actionFilter === a ? " active" : ""}`}
            onClick={() => setActionFilter(a)}
          >
            {a}
          </button>
        ))}
        {multiProduct && (
          <select className="product-select" value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
            <option value="All">All products</option>
            {products.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        )}
        <span className="filter-count">{filteredMetrics.length} of {metrics.length} shops</span>
      </div>

      <div className="chartcard" style={{ marginBottom: 18 }}>
        <h3>Weekly units sold</h3>
        <p className="cap">Units sold by shop and week — darker means more. Click a row to jump to that shop.</p>
        <SalesHeatmap metrics={filteredMetrics} onSelectShop={selectShop} selectedRowKey={selectedRowKey} />
      </div>
      <div className="charts" style={{ gridTemplateColumns: "1fr" }}>
        <div className="chartcard">
          <h3>Recommended allocation</h3>
          <p className="cap">Pouches for next week, by shop</p>
          <ChartCanvas config={allocConfig} />
        </div>
      </div>

      <div className="section-title">
        Shop-level detail
        <button className="exportbtn" onClick={exportPlan}>Export allocation plan</button>
      </div>
      <div className="shopcards">
        {filteredMetrics.length === 0 && (
          <p style={{ color: "var(--slate)", fontSize: 13.5 }}>No shops match "{search}".</p>
        )}
        {filteredMetrics.map((m) => (
          <ShopCard
            key={metricsKey(m.shop, m.product)}
            metrics={m}
            qty={qtyFor(m.shop, m.product, m.recommendedQty)}
            isOverridden={overrides[metricsKey(m.shop, m.product)] !== undefined}
            onSave={handleOverride}
            highlighted={selectedRowKey === metricsKey(m.shop, m.product)}
            onSelect={selectShop}
            showProduct={multiProduct}
          />
        ))}
      </div>

      <footer>Prolife × ProDairy — dashboard view only. Raw data and model settings are managed in the Retinah workspace.</footer>
    </div>
  );
}
