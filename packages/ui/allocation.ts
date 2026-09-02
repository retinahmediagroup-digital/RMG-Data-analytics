import { metricsKey, type ShopMetrics, type StockEntry } from "./types";

export const DEFAULT_SAFETY_BUFFER_PCT = 20;
export const DEFAULT_COVER_THRESHOLD_WEEKS = 3;

/**
 * Ports the rules-based allocation model from the original prototypes:
 * sell-through, stock-out frequency, weeks of cover, demand trend, and a
 * recommended next order with an Increase/Reduce/Maintain action.
 */
export function computeMetrics(
  stockEntries: StockEntry[],
  safetyBufferPct: number = DEFAULT_SAFETY_BUFFER_PCT,
  coverThresholdWeeks: number = DEFAULT_COVER_THRESHOLD_WEEKS
): ShopMetrics[] {
  const safety = safetyBufferPct / 100;
  // Group by shop AND product - a shop carrying two product lines must never have
  // their stock numbers summed together as if they were one item.
  const byGroup: Record<string, StockEntry[]> = {};
  stockEntries.forEach((e) => {
    (byGroup[metricsKey(e.shop, e.product)] ||= []).push(e);
  });

  return Object.values(byGroup).map((unsortedRows) => {
    // Sort chronologically - real submissions won't always arrive in week order.
    const rows = [...unsortedRows].sort((a, b) => a.week.localeCompare(b.week));
    const { shop, product } = rows[0];
    const sumOpening = rows.reduce((a, r) => a + r.opening, 0);
    const sumReceived = rows.reduce((a, r) => a + r.received, 0);
    const sumSold = rows.reduce((a, r) => a + r.sold, 0);
    const avgStockout = rows.reduce((a, r) => a + r.stockout, 0) / rows.length;
    const avgWeeklySold = sumSold / rows.length;
    const latest = rows[rows.length - 1];
    const sellThrough =
      sumOpening + sumReceived > 0 ? (sumSold / (sumOpening + sumReceived)) * 100 : 0;
    const weeksCover = avgWeeklySold > 0 ? latest.closing / avgWeeklySold : null;

    const mid = Math.floor(rows.length / 2);
    const firstHalf = rows.slice(0, mid).reduce((a, r) => a + r.sold, 0) / Math.max(mid, 1);
    const secondHalf = rows.slice(mid).reduce((a, r) => a + r.sold, 0) / (rows.length - mid);
    let trend: ShopMetrics["trend"] = "flat";
    if (secondHalf > firstHalf * 1.1) trend = "rising";
    else if (secondHalf < firstHalf * 0.9) trend = "falling";

    const recommendedQty = Math.max(0, Math.round(avgWeeklySold + avgWeeklySold * safety - latest.closing));
    let action: ShopMetrics["action"] = "Maintain";
    if (recommendedQty > 0 && avgStockout > 0) action = "Increase";
    else if (recommendedQty === 0 && weeksCover !== null && weeksCover > coverThresholdWeeks) action = "Reduce";

    return {
      shop,
      product,
      weeks: rows.map((r) => r.week),
      sold: rows.map((r) => r.sold),
      sellThrough,
      avgStockout,
      weeksCover,
      trend,
      recommendedQty,
      action,
    };
  });
}
