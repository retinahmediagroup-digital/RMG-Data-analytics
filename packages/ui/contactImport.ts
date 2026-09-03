import { getOrCreateCustomerId } from "./customerId";
import { indexCsvHeader, parseCSV, type ImportResult } from "./csv";
import type { Channel, Consent, ContactEntry } from "./types";

const HEADER_ALIASES: Record<string, string> = {
  "full name": "name",
  name: "name",
  "phone number": "phone",
  phone: "phone",
  email: "email",
  "preferred channel": "channel",
  channel: "channel",
  area: "area",
  "customer type": "ctype",
  type: "ctype",
  "marketing consent": "consent",
  consent: "consent",
  "consent date": "cdate",
  date: "cdate",
  "consent channel": "cchannel",
  notes: "notes",
};

const REQUIRED_COLUMNS = ["name", "phone", "channel", "area", "consent", "cdate"];

/**
 * Parses a customer CSV into ContactEntry rows. Any "Customer ID" column is ignored -
 * like the manual forms, the ID always comes from getOrCreateCustomerId keyed on phone,
 * so an imported repeat customer lands on the same ID as their earlier visit instead of
 * whatever a spreadsheet happened to have typed in.
 */
export function parseContactCsv(text: string): ImportResult<ContactEntry> {
  const rows = parseCSV(text);
  if (rows.length === 0) return { entries: [], skipped: [] };

  const header = indexCsvHeader(rows[0], HEADER_ALIASES);
  const missing = REQUIRED_COLUMNS.filter((k) => !(k in header));
  if (missing.length > 0) {
    return { entries: [], skipped: [{ row: 1, reason: `Missing column(s): ${missing.join(", ")}.` }] };
  }

  const entries: ContactEntry[] = [];
  const skipped: ImportResult<ContactEntry>["skipped"] = [];

  rows.slice(1).forEach((cells, i) => {
    const rowNum = i + 2;
    const get = (key: string) => (cells[header[key]] ?? "").trim();

    const name = get("name");
    const phone = get("phone");
    const channel = get("channel");
    const area = get("area");
    const consent = get("consent");
    const cdate = get("cdate");

    if (!name || !phone || !area) {
      skipped.push({ row: rowNum, reason: "Missing name, phone, or area." });
      return;
    }
    if (channel !== "SMS" && channel !== "WhatsApp") {
      skipped.push({ row: rowNum, reason: `Channel must be "SMS" or "WhatsApp", got "${channel || "(blank)"}".` });
      return;
    }
    if (consent !== "Yes" && consent !== "No") {
      skipped.push({ row: rowNum, reason: `Consent must be "Yes" or "No", got "${consent || "(blank)"}".` });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cdate)) {
      skipped.push({ row: rowNum, reason: "Consent date must be YYYY-MM-DD." });
      return;
    }

    entries.push({
      cid: getOrCreateCustomerId(phone),
      name,
      phone,
      email: get("email") || undefined,
      channel: channel as Channel,
      area,
      ctype: get("ctype") || undefined,
      consent: consent as Consent,
      cdate,
      cchannel: get("cchannel") || undefined,
      notes: get("notes") || undefined,
    });
  });

  return { entries, skipped };
}
