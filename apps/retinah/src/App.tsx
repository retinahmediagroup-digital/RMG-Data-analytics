import { useEffect, useMemo, useState } from "react";
import logo from "@prolife/ui/assets/logo-life.jpeg";
import { computeMetrics, DEFAULT_COVER_THRESHOLD_WEEKS, DEFAULT_SAFETY_BUFFER_PCT } from "@prolife/ui/allocation";
import { downloadCSV } from "@prolife/ui/csv";
import { addProduct, loadProducts, saveProducts } from "@prolife/ui/products";
import { seedContacts, seedStock } from "@prolife/ui/seedData";
import { metricsKey, type ContactEntry, type Product, type StockEntry } from "@prolife/ui/types";
import { AccessSection } from "./AccessSection";
import { EngineSection } from "./EngineSection";
import { AnalyticsSection } from "./AnalyticsSection";
import { ProductsSection } from "./ProductsSection";
import { StockDataSection } from "./StockDataSection";
import { ContactDataSection } from "./ContactDataSection";

type View = "overview" | "data";

export default function App() {
  const [view, setView] = useState<View>("overview");
  const [dashboardEnabled, setDashboardEnabled] = useState(true);
  const [safetyBufferPct, setSafetyBufferPct] = useState(DEFAULT_SAFETY_BUFFER_PCT);
  const [coverThresholdWeeks, setCoverThresholdWeeks] = useState(DEFAULT_COVER_THRESHOLD_WEEKS);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>(seedStock);
  const [contactEntries, setContactEntries] = useState<ContactEntry[]>(seedContacts);
  const [products, setProducts] = useState<Product[]>(loadProducts);

  useEffect(() => saveProducts(products), [products]);

  const productUsage = useMemo(() => {
    const counts: Record<string, number> = {};
    stockEntries.forEach((e) => {
      counts[e.product] = (counts[e.product] ?? 0) + 1;
    });
    return counts;
  }, [stockEntries]);

  // No UI in this workspace adjusts per-shop overrides directly (that lives in the ProDairy
  // dashboard); kept here only so the shared analytics section's props line up with ProDairy's.
  const overrides: Record<string, number> = {};

  const metrics = useMemo(
    () => computeMetrics(stockEntries, safetyBufferPct, coverThresholdWeeks),
    [stockEntries, safetyBufferPct, coverThresholdWeeks]
  );

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
        overrides[metricsKey(m.shop, m.product)] ?? m.recommendedQty,
      ]),
    ];
    downloadCSV("retinah_allocation_plan.csv", rows);
  }

  return (
    <div className="wrap">
      <header>
        <img src={logo} alt="Prolife logo" style={{ height: 40, width: "auto", display: "block" }} />
        <div>
          <p className="eyebrow">RMG WORKSPACE</p>
          <h1>Backbone</h1>
        </div>
      </header>
      <p className="sub">
        Full access: raw submissions, the allocation engine, analytics, and the switch that controls what ProDairy
        can see. Nothing here is visible to the client.
      </p>
      <div className="banner">
        <strong>Internal only.</strong> This workspace is never shared: ProDairy gets their own dashboard link with
        none of this.
      </div>

      <div className="tabs">
        <button className={`tab${view === "overview" ? " active" : ""}`} onClick={() => setView("overview")}>
          Overview
        </button>
        <button className={`tab${view === "data" ? " active" : ""}`} onClick={() => setView("data")}>
          Raw data
        </button>
      </div>

      <div className={`panel${view === "overview" ? " active" : ""}`}>
        <AccessSection enabled={dashboardEnabled} onChange={setDashboardEnabled} />
        <ProductsSection
          products={products}
          usageCounts={productUsage}
          onAdd={(name) => setProducts((prev) => addProduct(prev, name))}
          onToggleActive={(id) => setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)))}
          onRemove={(id) => setProducts((prev) => prev.filter((p) => p.id !== id))}
        />
        <EngineSection
          safetyBufferPct={safetyBufferPct}
          coverThresholdWeeks={coverThresholdWeeks}
          onSafetyBufferChange={setSafetyBufferPct}
          onCoverThresholdChange={setCoverThresholdWeeks}
        />
        <AnalyticsSection metrics={metrics} overrides={overrides} onExport={exportPlan} />
      </div>

      <div className={`panel${view === "data" ? " active" : ""}`}>
        <StockDataSection
          entries={stockEntries}
          products={products}
          onAdd={(entry) => setStockEntries((prev) => [...prev, entry])}
          onUpdate={(i, entry) => setStockEntries((prev) => prev.map((e, idx) => (idx === i ? entry : e)))}
          onRemove={(i) => setStockEntries((prev) => prev.filter((_, idx) => idx !== i))}
        />
        <ContactDataSection
          entries={contactEntries}
          onAdd={(entry) => setContactEntries((prev) => [...prev, entry])}
          onUpdate={(i, entry) => setContactEntries((prev) => prev.map((e, idx) => (idx === i ? entry : e)))}
          onRemove={(i) => setContactEntries((prev) => prev.filter((_, idx) => idx !== i))}
        />
      </div>

      <footer>RMG Workspace: the only view with raw data, model controls, and client access management.</footer>
    </div>
  );
}
