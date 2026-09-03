import { useState } from "react";
import { Field } from "@prolife/ui/components/Field";
import { ConsentBadge } from "@prolife/ui/components/ConsentBadge";
import { getOrCreateCustomerId } from "@prolife/ui/customerId";
import type { ContactEntry } from "@prolife/ui/types";
import { downloadCSV } from "@prolife/ui/csv";

const emptyForm: Pick<ContactEntry, "cid" | "name" | "phone" | "channel" | "area" | "consent" | "cdate"> = {
  cid: "",
  name: "",
  phone: "",
  channel: "",
  area: "",
  consent: "",
  cdate: "",
};
type FormState = typeof emptyForm;

interface ContactDataSectionProps {
  entries: ContactEntry[];
  onAdd: (entry: ContactEntry) => void;
  onUpdate: (index: number, entry: ContactEntry) => void;
  onRemove: (index: number) => void;
}

export function ContactDataSection({ entries, onAdd, onUpdate, onRemove }: ContactDataSectionProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [editIndex, setEditIndex] = useState(-1);

  function resetForm() {
    setForm(emptyForm);
    setErrors({});
    setEditIndex(-1);
  }

  function set<K extends keyof FormState>(id: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [id]: value }));
  }

  function handleSubmit() {
    const v = form;
    const newErrors: Partial<Record<keyof FormState, boolean>> = {};
    let ok = true;

    (["name", "phone", "channel", "area", "consent", "cdate"] as const).forEach((id) => {
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

    const phone = v.phone.trim();
    const entry: ContactEntry = {
      ...v,
      name: v.name.trim(),
      phone,
      area: v.area.trim(),
      cid: editIndex >= 0 ? v.cid : getOrCreateCustomerId(phone),
    };
    if (editIndex >= 0) onUpdate(editIndex, entry);
    else onAdd(entry);
    resetForm();
  }

  function startEdit(i: number) {
    const e = entries[i];
    setForm({ cid: e.cid, name: e.name, phone: e.phone, channel: e.channel, area: e.area, consent: e.consent, cdate: e.cdate });
    setEditIndex(i);
    setErrors({});
    document.getElementById("contactdata")?.scrollIntoView({ behavior: "smooth" });
  }

  function remove(i: number) {
    onRemove(i);
    if (editIndex === i) resetForm();
  }

  function exportConsentedCsv() {
    const header = ["Customer ID", "Full Name", "Phone Number", "Preferred Channel", "Area", "Marketing Consent", "Consent Date"];
    downloadCSV(
      "prolife_customer_contacts_consented.csv",
      [header, ...entries.filter((e) => e.consent === "Yes").map((e) => [e.cid, e.name, e.phone, e.channel, e.area, e.consent, e.cdate])]
    );
  }

  const isEditing = editIndex >= 0;

  return (
    <section id="contactdata">
      <div className="section-title">
        Customer contacts &amp; consent
        <button className="exportbtn" onClick={exportConsentedCsv}>Export consented CSV</button>
      </div>
      <div className="grid">
        <div className="card">
          <h2>{isEditing ? "Edit customer" : "Add / correct a customer"}</h2>
          <p className="hint">Only rows marked consent Yes are ever exported.</p>

          <Field id="cid" label="Customer ID">
            <input value={form.cid || "Assigned automatically on save"} readOnly disabled />
          </Field>
          <Field id="name" label="Full Name" required error={errors.name} errorMsg="Required.">
            <input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field id="phone" label="Phone" required error={errors.phone} errorMsg="Required.">
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+263 77 123 4567" />
          </Field>
          <div className="row2">
            <Field id="channel" label="Channel" required error={errors.channel} errorMsg="Required.">
              <select value={form.channel} onChange={(e) => set("channel", e.target.value as FormState["channel"])}>
                <option value="">Select…</option>
                <option>SMS</option>
                <option>WhatsApp</option>
              </select>
            </Field>
            <Field id="area" label="Area" required error={errors.area} errorMsg="Required.">
              <input value={form.area} onChange={(e) => set("area", e.target.value)} placeholder="e.g. Chitungwiza, Mbare" />
            </Field>
          </div>
          <div className="row2">
            <Field id="consent" label="Consent" required error={errors.consent} errorMsg="Required.">
              <select value={form.consent} onChange={(e) => set("consent", e.target.value as FormState["consent"])}>
                <option value="">Select…</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </Field>
            <Field id="cdate" label="Consent Date" required error={errors.cdate} errorMsg="YYYY-MM-DD.">
              <input value={form.cdate} onChange={(e) => set("cdate", e.target.value)} placeholder="YYYY-MM-DD" />
            </Field>
          </div>

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
                <th>Customer ID</th><th>Name</th><th>Phone</th><th>Channel</th><th>Area</th><th>Consent</th><th>Date</th><th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i}>
                  <td>{e.cid}</td>
                  <td className="strong">{e.name}</td>
                  <td>{e.phone}</td>
                  <td>{e.channel}</td>
                  <td>{e.area}</td>
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
        </div>
      </div>
    </section>
  );
}
