import { useMemo, useState } from "react";
import { Field } from "@prolife/ui/components/Field";
import { loadProducts } from "@prolife/ui/products";
import type { StockEntry } from "@prolife/ui/types";

const emptyForm = { shop: "", product: "", week: "", opening: "", received: "", sold: "", closing: "", stockout: "" };
type FormState = typeof emptyForm;
type NumericId = "opening" | "received" | "sold" | "closing" | "stockout";

export function StockPanel() {
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [editIndex, setEditIndex] = useState(-1);
  // Retinah owns the catalog (see the RMG workspace's Product catalog section) - the shop
  // app only ever picks from what's active there, never adds to it.
  const productNames = useMemo(() => loadProducts().filter((p) => p.active).map((p) => p.name), []);

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

    const entry: StockEntry = {
      shop: v.shop.trim(),
      product: v.product.trim(),
      week: v.week.trim(),
      opening,
      received,
      sold,
      closing,
      stockout,
    };
    setEntries((prev) => {
      if (editIndex >= 0) {
        const copy = [...prev];
        copy[editIndex] = entry;
        return copy;
      }
      return [...prev, entry];
    });
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function remove(i: number) {
    setEntries((prev) => prev.filter((_, idx) => idx !== i));
    if (editIndex === i) resetForm();
  }

  const isEditing = editIndex >= 0;

  return (
    <div className="grid">
      <div className="card">
        <h2>{isEditing ? "Edit weekly record" : "Add a weekly record"}</h2>
        <p className="hint">One row per shop, per product, per week.</p>
        {isEditing && <div className="editing-flag" style={{ display: "block" }}>Editing an existing entry</div>}

        <Field id="shop" label="Shop" required error={errors.shop} errorMsg="Enter the shop code or name.">
          <input value={form.shop} onChange={(e) => set("shop", e.target.value)} placeholder="e.g. PD Bindura" />
        </Field>
        <Field id="product" label="Product" required error={errors.product} errorMsg="Choose a product.">
          <select value={form.product} onChange={(e) => set("product", e.target.value)}>
            <option value="">Select…</option>
            {productNames.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </Field>
        <Field id="week" label="Week" required error={errors.week} errorMsg="Use an ISO week code or a date.">
          <input value={form.week} onChange={(e) => set("week", e.target.value)} placeholder="2026-W39" />
        </Field>
        <div className="row2">
          <Field id="opening" label="Opening Stock" required error={errors.opening} errorMsg="Whole number, 0 or more.">
            <input type="number" min={0} value={form.opening} onChange={(e) => set("opening", e.target.value)} placeholder="0" />
          </Field>
          <Field id="received" label="Units Received" required error={errors.received} errorMsg="Whole number, 0 or more.">
            <input type="number" min={0} value={form.received} onChange={(e) => set("received", e.target.value)} placeholder="0" />
          </Field>
        </div>
        <div className="row2">
          <Field id="sold" label="Units Sold" required error={errors.sold} errorMsg="Whole number, 0 or more.">
            <input type="number" min={0} value={form.sold} onChange={(e) => set("sold", e.target.value)} placeholder="0" />
          </Field>
          <Field id="closing" label="Closing Stock" required error={errors.closing} errorMsg="Can't exceed opening + received.">
            <input type="number" min={0} value={form.closing} onChange={(e) => set("closing", e.target.value)} placeholder="0" />
          </Field>
        </div>
        <Field id="stockout" label="Stock-out Days" required error={errors.stockout} errorMsg="0–7. If 7, units sold must be 0.">
          <input type="number" min={0} max={7} value={form.stockout} onChange={(e) => set("stockout", e.target.value)} placeholder="0" />
        </Field>

        <div className="btnrow">
          <button className="addbtn" onClick={handleSubmit}>
            {isEditing ? "Save changes" : "Add entry"}
          </button>
          {isEditing && (
            <button className="cancelbtn" style={{ display: "inline-block" }} onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </div>

      <div>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Shop</th>
                <th>Product</th>
                <th>Week</th>
                <th>Opening</th>
                <th>Received</th>
                <th>Sold</th>
                <th>Closing</th>
                <th>Stock-out</th>
                <th></th>
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
          {entries.length === 0 && (
            <div className="empty">
              <div className="big">No entries yet</div>
              Fill in the form on the left and add your first weekly record.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
