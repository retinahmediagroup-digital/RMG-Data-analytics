import { useMemo, useState } from "react";
import { Field } from "@prolife/ui/components/Field";
import { CsvImport } from "@prolife/ui/components/CsvImport";
import type { Product, Shop, StockEntry } from "@prolife/ui/types";
import { downloadCSV } from "@prolife/ui/csv";
import { parseStockCsv } from "@prolife/ui/stockImport";

const emptyForm = { shop: "", product: "", week: "", opening: "", received: "", sold: "", closing: "", stockout: "" };
type FormState = typeof emptyForm;
type NumericId = "opening" | "received" | "sold" | "closing" | "stockout";

interface StockDataSectionProps {
  entries: StockEntry[];
  products: Product[];
  shops: Shop[];
  onAdd: (entry: StockEntry) => void;
  onImport: (entries: StockEntry[]) => void;
  onUpdate: (index: number, entry: StockEntry) => void;
  onRemove: (index: number) => void;
}

export function StockDataSection({ entries, products, shops, onAdd, onImport, onUpdate, onRemove }: StockDataSectionProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [editIndex, setEditIndex] = useState(-1);

  const activeProductNames = useMemo(() => products.filter((p) => p.active).map((p) => p.name), [products]);
  const activeShopNames = useMemo(() => shops.filter((s) => s.active).map((s) => s.name), [shops]);

  // Include the form's current shop/product even if it's since been retired, so editing
  // an old row never silently blanks a field out from under it.
  const productOptions =
    form.product && !activeProductNames.includes(form.product) ? [...activeProductNames, form.product] : activeProductNames;
  const shopOptions = form.shop && !activeShopNames.includes(form.shop) ? [...activeShopNames, form.shop] : activeShopNames;

  function resetForm() {
    setForm(emptyForm);
    setErrors({});
    setEditIndex(-1);
  }

  function set(id: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [id]: value }));
  }

  function handleSubmit() {
    const v = form;
    const newErrors: Partial<Record<keyof FormState, boolean>> = {};
    let ok = true;

    (["shop", "product", "week"] as const).forEach((id) => {
      const bad = v[id].trim() === "";
      newErrors[id] = bad;
      if (bad) ok = false;
    });

    const numericIds: NumericId[] = ["opening", "received", "sold", "closing", "stockout"];
    numericIds.forEach((id) => {
      const raw = v[id].trim();
      const bad = raw === "" || isNaN(Number(raw)) || Number(raw) < 0 || !Number.isInteger(Number(raw));
      newErrors[id] = bad;
      if (bad) ok = false;
    });

    let opening = 0, received = 0, sold = 0, closing = 0, stockout = 0;
    if (ok) {
      opening = Number(v.opening);
      received = Number(v.received);
      sold = Number(v.sold);
      closing = Number(v.closing);
      stockout = Number(v.stockout);
      if (closing > opening + received) {
        newErrors.closing = true;
        ok = false;
      }
      if (stockout > 7) {
        newErrors.stockout = true;
        ok = false;
      }
      if (stockout === 7 && sold !== 0) {
        newErrors.stockout = true;
        ok = false;
      }
    }

    setErrors(newErrors);
    if (!ok) return;

    const entry: StockEntry = { shop: v.shop.trim(), product: v.product.trim(), week: v.week.trim(), opening, received, sold, closing, stockout };
    if (editIndex >= 0) onUpdate(editIndex, entry);
    else onAdd(entry);
    resetForm();
  }

  function startEdit(i: number) {
    const e = entries[i];
    setForm({
      shop: e.shop,
      product: e.product,
      week: e.week,
      opening: String(e.opening),
      received: String(e.received),
      sold: String(e.sold),
      closing: String(e.closing),
      stockout: String(e.stockout),
    });
    setEditIndex(i);
    setErrors({});
    document.getElementById("stockdata")?.scrollIntoView({ behavior: "smooth" });
  }

  function remove(i: number) {
    onRemove(i);
    if (editIndex === i) resetForm();
  }

  function exportCsv() {
    const header = ["Shop", "Product", "Week", "Opening Stock", "Units Received", "Units Sold", "Closing Stock", "Stock-out Days"];
    downloadCSV("prolife_weekly_stock_sales.csv", [header, ...entries.map((e) => [e.shop, e.product, e.week, e.opening, e.received, e.sold, e.closing, e.stockout])]);
  }

  const isEditing = editIndex >= 0;

  return (
    <section id="stockdata">
      <div className="section-title">
        Stock &amp; sales data
        <div className="section-actions">
          <CsvImport
            label="Import CSV"
            hint="Same columns as Export CSV"
            onParse={(text) => parseStockCsv(text, activeShopNames, activeProductNames)}
            onImport={onImport}
          />
          <button className="exportbtn" onClick={exportCsv}>Export CSV</button>
        </div>
      </div>
      <div className="grid">
        <div className="card">
          <h2>{isEditing ? "Edit record" : "Add / correct a record"}</h2>
          <p className="hint">Retinah can edit any shop's submission directly.</p>

          <Field id="shop" label="Shop" required error={errors.shop} errorMsg="Required.">
            <select value={form.shop} onChange={(e) => set("shop", e.target.value)}>
              <option value="">Select…</option>
              {shopOptions.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </Field>
          <Field id="product" label="Product" required error={errors.product} errorMsg="Required.">
            <select value={form.product} onChange={(e) => set("product", e.target.value)}>
              <option value="">Select…</option>
              {productOptions.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </Field>
          {(activeShopNames.length === 0 || activeProductNames.length === 0) && (
            <p className="section-cap" style={{ margin: "-8px 0 12px" }}>
              Add at least one active shop and product to the catalogs above before recording stock.
            </p>
          )}
          <Field id="week" label="Week" required error={errors.week} errorMsg="Required.">
            <input value={form.week} onChange={(e) => set("week", e.target.value)} placeholder="2026-W39" />
          </Field>
          <div className="row2">
            <Field id="opening" label="Opening" required error={errors.opening} errorMsg="≥ 0.">
              <input type="number" min={0} value={form.opening} onChange={(e) => set("opening", e.target.value)} />
            </Field>
            <Field id="received" label="Received" required error={errors.received} errorMsg="≥ 0.">
              <input type="number" min={0} value={form.received} onChange={(e) => set("received", e.target.value)} />
            </Field>
          </div>
          <div className="row2">
            <Field id="sold" label="Sold" required error={errors.sold} errorMsg="≥ 0.">
              <input type="number" min={0} value={form.sold} onChange={(e) => set("sold", e.target.value)} />
            </Field>
            <Field id="closing" label="Closing" required error={errors.closing} errorMsg="≤ opening + received.">
              <input type="number" min={0} value={form.closing} onChange={(e) => set("closing", e.target.value)} />
            </Field>
          </div>
          <Field id="stockout" label="Stock-out days" required error={errors.stockout} errorMsg="0–7.">
            <input type="number" min={0} max={7} value={form.stockout} onChange={(e) => set("stockout", e.target.value)} />
          </Field>

          <div className="btnrow">
            <button className="addbtn" onClick={handleSubmit}>{isEditing ? "Save changes" : "Add entry"}</button>
            {isEditing && (
              <button className="cancelbtn" style={{ display: "inline-block" }} onClick={resetForm}>Cancel</button>
            )}
          </div>
        </div>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Shop</th><th>Product</th><th>Week</th><th>Opening</th><th>Received</th><th>Sold</th><th>Closing</th><th>Stock-out</th><th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i}>
                  <td className="strong">{e.shop}</td>
                  <td>{e.product}</td>
                  <td>{e.week}</td>
                  <td>{e.opening}</td>
                  <td>{e.received}</td>
                  <td>{e.sold}</td>
                  <td>{e.closing}</td>
                  <td>{e.stockout}</td>
                  <td className="actions">
                    <button className="edit" onClick={() => startEdit(i)}>Edit</button>
                    <button className="rm" onClick={() => remove(i)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
