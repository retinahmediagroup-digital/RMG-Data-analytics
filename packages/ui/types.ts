export interface Product {
  id: string;
  name: string;
  active: boolean;
}

export interface Shop {
  id: string;
  name: string;
  active: boolean;
}

export interface StockEntry {
  shop: string;
  product: string;
  week: string;
  opening: number;
  received: number;
  sold: number;
  closing: number;
  stockout: number;
}

export type Channel = "" | "SMS" | "WhatsApp";
export type Consent = "" | "Yes" | "No";

export interface ContactEntry {
  cid?: string;
  name: string;
  phone: string;
  email?: string;
  channel: Channel;
  area: string;
  ctype?: string;
  consent: Consent;
  cdate: string;
  cchannel?: string;
  notes?: string;
}

export type DemandTrend = "rising" | "falling" | "flat";
export type Action = "Increase" | "Reduce" | "Maintain";

export interface ShopMetrics {
  shop: string;
  product: string;
  weeks: string[];
  sold: number[];
  sellThrough: number;
  avgStockout: number;
  weeksCover: number | null;
  trend: DemandTrend;
  recommendedQty: number;
  action: Action;
}

/**
 * Identifies one shop+product row uniquely. A shop carrying more than one product
 * must never have its rows, overrides, or highlights collide under a bare shop name -
 * use this everywhere a shop is looked up (overrides maps, row keys, DOM ids).
 */
export function metricsKey(shop: string, product: string): string {
  return `${shop}::${product}`;
}
