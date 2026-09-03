import { DEFAULT_PRODUCTS } from "./products";
import { DEFAULT_SHOPS } from "./shops";
import type { ContactEntry, StockEntry } from "./types";

const PRODUCT = DEFAULT_PRODUCTS[0].name;
const WEEK_LABELS = ["2026-W33", "2026-W34", "2026-W35", "2026-W36"];

/** Actual cases sold in August 2026, per shop (from Retinah's shop performance sheet). */
const AUGUST_CASES_BY_SHOP: Record<string, number> = {
  "PD Bindura": 168,
  "PD Bulawayo": 130,
  "PD Chinhoyi": 194,
  "PD Domboshava": 103,
  "PD Epworth Chiremba": 38,
  "PD Gweru": 90,
  "PD Huruyadzo Chitungwiza": 156,
  "PD Kadoma Rimuka": 183,
  "PD Kuwadzana": 154,
  "PD Kwekwe": 141,
  "PD Machipisa": 256,
  "PD Mbizo": 110,
  "PD Murewa": 52,
  "PD Mutare": 179,
  "PD Norton": 86,
};

const REAL_SHOP_AUGUST_CASES: { shop: string; cases: number }[] = DEFAULT_SHOPS.map((s) => ({
  shop: s.name,
  cases: AUGUST_CASES_BY_SHOP[s.name],
}));

/** 250ml x 24 per case = 6L/case, matching the source sheet's Target Litres / Target Cases ratio. */
const UNITS_PER_CASE = 24;

function splitEvenly(total: number, parts: number): number[] {
  const base = Math.floor(total / parts);
  const remainder = total % parts;
  return Array.from({ length: parts }, (_, i) => base + (i < remainder ? 1 : 0));
}

/**
 * The source sheet only has monthly cases sold per shop, not weekly opening/received/
 * closing/stock-out figures. This spreads August's total (converted to individual
 * 250ml units, since "Units Sold" etc. is the schema's actual field) evenly across
 * the same four weeks the earlier demo used, and models received stock as sold plus
 * a 15% restock buffer with no observed stock-outs. Replace with real weekly
 * submissions once the shop app writes to Supabase.
 */
function buildStockEntries(): StockEntry[] {
  const entries: StockEntry[] = [];
  for (const { shop, cases } of REAL_SHOP_AUGUST_CASES) {
    const weeklySold = splitEvenly(cases * UNITS_PER_CASE, WEEK_LABELS.length);
    let opening = Math.round(weeklySold[0] * 0.3);
    weeklySold.forEach((sold, i) => {
      const received = Math.round(sold * 1.15);
      const closing = opening + received - sold;
      entries.push({ shop, product: PRODUCT, week: WEEK_LABELS[i], opening, received, sold, closing, stockout: 0 });
      opening = closing;
    });
  }
  return entries;
}

export const seedStock: StockEntry[] = buildStockEntries();

export const seedContacts: ContactEntry[] = [
  { cid: "PL-7K2M9X", name: "Tendai Moyo", phone: "+263 77 123 4567", channel: "WhatsApp", area: "Bindura", consent: "Yes", cdate: "2026-06-02" },
  { cid: "PL-4R8T3Q", name: "Rufaro Chikafu", phone: "+263 71 987 6543", channel: "SMS", area: "Chitungwiza", consent: "Yes", cdate: "2026-06-14" },
  { cid: "PL-9W5N2H", name: "Farai Ndlovu", phone: "+263 78 456 1122", channel: "WhatsApp", area: "Norton", consent: "No", cdate: "2026-07-01" },
];
