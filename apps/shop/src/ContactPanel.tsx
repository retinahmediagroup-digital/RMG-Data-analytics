import { useState } from "react";
import { Field } from "@prolife/ui/components/Field";
import { ConsentBadge } from "@prolife/ui/components/ConsentBadge";
import type { ContactEntry } from "@prolife/ui/types";

const emptyForm: ContactEntry = {
  cid: "",
  name: "",
  phone: "",
  email: "",
  channel: "",
  shop2: "",
  region: "",
  ctype: "",
  consent: "",
  cdate: "",
  cchannel: "",
  notes: "",
};

const REQUIRED = ["name", "phone", "channel", "shop2", "consent", "cdate"] as const;

export function ContactPanel() {
  const [entries, setEntries] = useState<ContactEntry[]>([]);
  const [form, setForm] = useState<ContactEntry>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactEntry, boolean>>>({});
  const [editIndex, setEditIndex] = useState(-1);

  function resetForm() {
    setForm(emptyForm);
    setErrors({});
    setEditIndex(-1);
  }

  function set<K extends keyof ContactEntry>(id: K, value: ContactEntry[K]) {
    setForm((prev) => ({ ...prev, [id]: value }));
  }

  function handleSubmit() {
    const v = form;
    const newErrors: Partial<Record<keyof ContactEntry, boolean>> = {};
    let ok = true;

    REQUIRED.forEach((id) => {
      const bad = !String(v[id] ?? "").trim();
      newErrors[id] = bad;
      if (bad) ok = false;
    });
    if (v.cdate && !/^\d{4}-\d{2}-\d{2}$/.test(v.cdate)) {
      newErrors.cdate = true;
      ok = false;
    }

    setErrors(newErrors);
    if (!ok) return;

    const entry: ContactEntry = { ...v, name: v.name.trim(), phone: v.phone.trim(), shop2: v.shop2.trim() };
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
    setForm({ ...emptyForm, ...entries[i] });
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
        <h2>{isEditing ? "Edit customer" : "Add a customer"}</h2>
        <p className="hint">Only customers with consent marked Yes are sent on to Retinah.</p>
        {isEditing && <div className="editing-flag" style={{ display: "block" }}>Editing an existing entry</div>}

        <Field id="cid" label="Customer ID">
          <input value={form.cid} onChange={(e) => set("cid", e.target.value)} placeholder="Optional" />
        </Field>
        <Field id="name" label="Full Name" required error={errors.name} errorMsg="Full name is required.">
          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Tendai Moyo" />
        </Field>
        <Field id="phone" label="Phone Number" required error={errors.phone} errorMsg="Include the country code.">
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+263 77 123 4567" />
        </Field>
        <Field id="email" label="Email">
          <input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="Optional" />
        </Field>
        <div className="row2">
          <Field id="channel" label="Preferred Channel" required error={errors.channel} errorMsg="Choose SMS or WhatsApp.">
            <select value={form.channel} onChange={(e) => set("channel", e.target.value as ContactEntry["channel"])}>
              <option value="">Select…</option>
              <option>SMS</option>
              <option>WhatsApp</option>
            </select>
          </Field>
          <Field id="shop2" label="Nearest Shop" required error={errors.shop2} errorMsg="Enter a shop code or name.">
            <input value={form.shop2} onChange={(e) => set("shop2", e.target.value)} placeholder="Shop code or name" />
          </Field>
        </div>
        <div className="row2">
          <Field id="region" label="Region">
            <input value={form.region} onChange={(e) => set("region", e.target.value)} placeholder="Optional" />
          </Field>
          <Field id="ctype" label="Customer Type">
            <select value={form.ctype} onChange={(e) => set("ctype", e.target.value)}>
              <option value="">Optional</option>
              <option>Retail</option>
              <option>Wholesale</option>
              <option>Distributor</option>
            </select>
          </Field>
        </div>
        <div className="row2">
          <Field id="consent" label="Marketing Consent" required error={errors.consent} errorMsg="Consent must be recorded.">
            <select value={form.consent} onChange={(e) => set("consent", e.target.value as ContactEntry["consent"])}>
              <option value="">Select…</option>
              <option>Yes</option>
              <option>No</option>
            </select>
          </Field>
          <Field id="cdate" label="Consent Date" required error={errors.cdate} errorMsg="Use format YYYY-MM-DD.">
            <input value={form.cdate} onChange={(e) => set("cdate", e.target.value)} placeholder="YYYY-MM-DD" />
          </Field>
        </div>
        <Field id="cchannel" label="Consent Channel">
          <input value={form.cchannel} onChange={(e) => set("cchannel", e.target.value)} placeholder="e.g. in-store form" />
        </Field>
        <Field id="notes" label="Notes">
          <input value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional" />
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
                <th>Name</th>
                <th>Phone</th>
                <th>Channel</th>
                <th>Nearest Shop</th>
                <th>Type</th>
                <th>Consent</th>
                <th>Consent Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i}>
                  <td className="strong">{e.name}</td>
                  <td>{e.phone}</td>
                  <td>{e.channel}</td>
                  <td>{e.shop2}</td>
                  <td>{e.ctype || "—"}</td>
                  <td><ConsentBadge consent={e.consent} /></td>
                  <td>{e.cdate}</td>
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
              <div className="big">No customers yet</div>
              Fill in the form on the left and add your first customer.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
