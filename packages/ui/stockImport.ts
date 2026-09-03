import { indexCsvHeader, parseCSV, type ImportResult } from "./csv";
import type { StockEntry } from "./types";

const HEADER_ALIASES: Record<string, string> = {
  shop: "shop",
  product: "product",
  week: "week",
  "opening stock": "opening",
  opening: "opening",
  "units received": "received",
  received: "received",
  "units sold": "sold",
  sold: "sold",
  "closing stock": "closing",
  closing: "closing",
  "stock-out days": "stockout",
  "stock-out": "stockout",
  stockout: "stockout",
};

const REQUIRED_COLUMNS = ["shop", "product", "week", "opening", "received", "sold", "closing", "stockout"];

/**
 * Parses a weekly stock CSV - the same columns Retinah's own "Export CSV" produces, so
 * a round trip works - into StockEntry rows. Shop and Product must already be active in
 * the catalogs Retinah controls: a bulk upload is exactly where that governance could
 * otherwise get bypassed, so unknown values are rejected rather than silently accepted.
 */
export function parseStockCsv(text: string, activeShops: string[], activeProducts: string[]): ImportResult<StockEntry> {
  const rows = parseCSV(text);
  if (rows.length === 0) return { entries: [], skipped: [] };

  const header = indexCsvHeader(rows[0], HEADER_ALIASES);
  const missing = REQUIRED_COLUMNS.filter((k) => !(k in header));
  if (missing.length > 0) {
    return { entries: [], skipped: [{ row: 1, reason: `Missing column(s): ${missing.join(", ")}.` }] };
  }

  const shopSet = new Set(activeShops.map((s) => s.toLowerCase()));
  const productSet = new Set(activeProducts.map((p) => p.toLowerCase()));
  const entries: StockEntry[] = [];
  const skipped: ImportResult<StockEntry>["skipped"] = [];

  rows.slice(1).forEach((cells, i) => {
    const rowNum = i + 2; // +1 for 0-index, +1 for the header row
    const get = (key: string) => (cells[header[key]] ?? "").trim();

    const shop = get("shop");
    const product = get("product");
    const week = get("week");
    if (!shop || !product || !week) {
      skipped.push({ row: rowNum, reason: "Missing shop, product, or week." });
      return;
    }
    if (!shopSet.has(shop.toLowerCase())) {
      skipped.push({ row: rowNum, reason: `Unknown shop "${shop}" - add it to the shop catalog first.` });
      return;
    }
    if (!productSet.has(product.toLowerCase())) {
      skipped.push({ row: rowNum, reason: `Unknown product "${product}" - add it to the product catalog first.` });
      return;
    }

    const numericKeys = ["opening", "received", "sold", "closing", "stockout"] as const;
    const numbers = numericKeys.map((k) => Number(get(k)));
    if (numbers.some((n, idx) => get(numericKeys[idx]) === "" || isNaN(n) || n < 0 || !Number.isInteger(n))) {
      skipped.push({ row: rowNum, reason: "Opening/Received/Sold/Closing/Stock-out must be whole numbers, 0 or more." });
      return;
    }
    const [opening, received, sold, closing, stockout] = numbers;
    if (closing > opening + received) {
      skipped.push({ row: rowNum, reason: "Closing can't exceed opening + received." });
      return;
    }
    if (stockout > 7 || (stockout === 7 && sold !== 0)) {
      skipped.push({ row: rowNum, reason: "Stock-out days must be 0-7, and 7 requires 0 units sold." });
      return;
    }

    entries.push({ shop, product, week, opening, received, sold, closing, stockout });
  });

  return { entries, skipped };
}
