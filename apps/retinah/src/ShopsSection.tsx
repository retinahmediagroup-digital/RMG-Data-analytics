import { useState } from "react";
import type { Shop } from "@prolife/ui/types";

interface ShopsSectionProps {
  shops: Shop[];
  usageCounts: Record<string, number>;
  onAdd: (name: string) => void;
  onToggleActive: (id: string) => void;
  onRemove: (id: string) => void;
}

export function ShopsSection({ shops, usageCounts, onAdd, onToggleActive, onRemove }: ShopsSectionProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a shop name.");
      return;
    }
    if (shops.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setError("That shop is already in the directory.");
      return;
    }
    onAdd(trimmed);
    setName("");
    setError("");
  }

  return (
    <section id="shops">
      <div className="section-title">Shop directory</div>
      <p className="section-cap">
        Only shops listed here can be picked on a weekly stock record, in this workspace or in the shop app. Add a
        new outlet the moment it opens; retire instead of removing once it has stock history, so past weeks stay
        intact.
      </p>
      <div className="catalog-addrow">
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          placeholder="e.g. PD Marondera"
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <button className="addbtn catalog-addbtn" onClick={submit}>
          Add shop
        </button>
      </div>
      {error && <div className="catalog-error">{error}</div>}
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Shop</th>
              <th>Status</th>
              <th>Stock rows</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {shops.map((s) => {
              const used = usageCounts[s.name] ?? 0;
              return (
                <tr key={s.id}>
                  <td className="strong">{s.name}</td>
                  <td>
                    <span className={`status-pill ${s.active ? "on" : "off"}`}>{s.active ? "Active" : "Retired"}</span>
                  </td>
                  <td>{used}</td>
                  <td className="actions">
                    <button className="edit" onClick={() => onToggleActive(s.id)}>
                      {s.active ? "Retire" : "Reactivate"}
                    </button>
                    {used === 0 && (
                      <button className="rm" onClick={() => onRemove(s.id)}>
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {shops.length === 0 && (
          <div className="empty">
            <div className="big">No shops yet</div>
            Add ProDairy's first outlet above.
          </div>
        )}
      </div>
    </section>
  );
}
