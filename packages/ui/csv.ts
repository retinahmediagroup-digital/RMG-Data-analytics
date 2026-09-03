export type CsvValue = string | number | null | undefined;

function escapeCsvValue(v: CsvValue): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function downloadCSV(filename: string, rows: CsvValue[][]): void {
  const csv = rows.map((r) => r.map(escapeCsvValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Splits CSV text into rows of raw cell strings, handling quoted fields (with embedded
 * commas, newlines, and "" as an escaped quote) the way escapeCsvValue above writes
 * them - so a file round-tripped through downloadCSV parses back out correctly.
 */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\r") {
      // skip - \n (below) ends the row
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

export interface ImportSkip {
  row: number;
  reason: string;
}

export interface ImportResult<T> {
  entries: T[];
  skipped: ImportSkip[];
}

/** Maps a CSV header row to field keys via aliases (case/space-insensitive), e.g. "Opening Stock" -> "opening". */
export function indexCsvHeader(header: string[], aliases: Record<string, string>): Record<string, number> {
  const map: Record<string, number> = {};
  header.forEach((cell, i) => {
    const key = aliases[cell.trim().toLowerCase()];
    if (key) map[key] = i;
  });
  return map;
}
