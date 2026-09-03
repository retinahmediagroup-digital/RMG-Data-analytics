import { useState } from "react";
import type { Product } from "@prolife/ui/types";

interface ProductsSectionProps {
  products: Product[];
  usageCounts: Record<string, number>;
  onAdd: (name: string) => void;
  onToggleActive: (id: string) => void;
  onRemove: (id: string) => void;
}

export function ProductsSection({ products, usageCounts, onAdd, onToggleActive, onRemove }: ProductsSectionProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a product name.");
      return;
    }
    if (products.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setError("That product is already in the catalog.");
      return;
    }
    onAdd(trimmed);
    setName("");
    setError("");
  }

  return (
    <section id="products">
      <div className="section-title">Product catalog</div>
      <p className="section-cap">
        Only products listed here can be picked on a weekly stock record, in this workspace or in the shop app.
        Add a line the moment ProDairy ships a new one; retire instead of removing once it has stock history, so
        past weeks stay intact.
      </p>
      <div className="catalog-addrow">
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          placeholder="e.g. Prolife 500ml Vanilla"
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <button className="addbtn catalog-addbtn" onClick={submit}>
          Add product
        </button>
      </div>
      {error && <div className="catalog-error">{error}</div>}
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Status</th>
              <th>Stock rows</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const used = usageCounts[p.name] ?? 0;
              return (
                <tr key={p.id}>
                  <td className="strong">{p.name}</td>
                  <td>
                    <span className={`status-pill ${p.active ? "on" : "off"}`}>{p.active ? "Active" : "Retired"}</span>
                  </td>
                  <td>{used}</td>
                  <td className="actions">
                    <button className="edit" onClick={() => onToggleActive(p.id)}>
                      {p.active ? "Retire" : "Reactivate"}
                    </button>
                    {used === 0 && (
                      <button className="rm" onClick={() => onRemove(p.id)}>
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="empty">
            <div className="big">No products yet</div>
            Add ProDairy's first product line above.
          </div>
        )}
      </div>
    </section>
  );
}
