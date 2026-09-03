import { useRef, useState, type ChangeEvent } from "react";
import type { ImportResult } from "../csv";

interface CsvImportProps<T> {
  label: string;
  hint?: string;
  onParse: (text: string) => ImportResult<T>;
  onImport: (entries: T[]) => void;
}

/** A "Import CSV" button that parses the chosen file, hands valid rows to onImport, and shows a pass/fail summary. */
export function CsvImport<T>({ label, hint, onParse, onImport }: CsvImportProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportResult<T> | null>(null);

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = onParse(text);
    if (parsed.entries.length > 0) onImport(parsed.entries);
    setResult(parsed);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="csv-import">
      <label className="importbtn">
        {label}
        <input ref={inputRef} type="file" accept=".csv" onChange={handleChange} hidden />
      </label>
      {hint && <span className="csv-import-hint">{hint}</span>}
      {result && (
        <div className="csv-import-result">
          <span className={result.entries.length > 0 ? "ok" : "warn"}>
            Imported {result.entries.length} row{result.entries.length === 1 ? "" : "s"}.
          </span>
          {result.skipped.length > 0 && (
            <details>
              <summary>
                {result.skipped.length} row{result.skipped.length === 1 ? "" : "s"} skipped
              </summary>
              <ul>
                {result.skipped.map((s, i) => (
                  <li key={i}>
                    Row {s.row}: {s.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
