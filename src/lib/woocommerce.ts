// WooCommerce API client for importing 2026 season data

const WC_API_URL = process.env.WC_API_URL || "";
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY || "";
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET || "";

// 2026 WooCommerce product IDs → event name mapping
export const WC_PRODUCT_MAP: Record<number, { name: string; type: string }> = {
  9879: { name: "Meet #1 Registration 2026", type: "meet" },
  9883: { name: "Meet #2 Registration 2026", type: "meet" },
  9888: { name: "Meet #3 Registration 2026", type: "meet" },
  9892: { name: "Meet #4 Registration 2026", type: "meet" },
  9900: { name: "Meet #5 Registration 2026", type: "meet" },
  9904: { name: "Freestyle Registration 2026", type: "freestyle" },
  9877: { name: "League Registration 2026", type: "league" },
  9878: { name: "Team Registration 2026", type: "team" },
};

export const WC_PRODUCT_IDS = Object.keys(WC_PRODUCT_MAP).map(Number);

// ISO 3166-1 alpha-2 → IOC country code conversion (common ones)
const COUNTRY_MAP: Record<string, string> = {
  US: "USA",
  CA: "CAN",
  GB: "GBR",
  UK: "GBR",
  AU: "AUS",
  NZ: "NZL",
  DE: "GER",
  FR: "FRA",
  ES: "ESP",
  IT: "ITA",
  BR: "BRA",
  MX: "MEX",
  JP: "JPN",
  CN: "CHN",
  KR: "KOR",
  IN: "IND",
  ZA: "RSA",
  SE: "SWE",
  NO: "NOR",
  DK: "DEN",
  FI: "FIN",
  NL: "NED",
  BE: "BEL",
  AT: "AUT",
  CH: "SUI",
  PL: "POL",
  CZ: "CZE",
  RU: "RUS",
  AR: "ARG",
  CL: "CHI",
  CO: "COL",
  PE: "PER",
  IE: "IRL",
  PT: "POR",
  SG: "SGP",
  TH: "THA",
  PH: "PHI",
  MY: "MAS",
  AE: "UAE",
  IL: "ISR",
  EG: "EGY",
  HK: "HKG",
};

export function convertCountry(code: string): string {
  if (!code) return "";
  const upper = code.toUpperCase();
  return COUNTRY_MAP[upper] || upper;
}

// Extract a meta_data value by key from WC order/line_item meta
function getMeta(
  metaData: Array<{ key: string; value: string }>,
  key: string
): string {
  const item = metaData?.find((m) => m.key === key);
  return item?.value || "";
}

export interface WCParsedRegistration {
  orderId: number;
  email: string;
  name: string;
  country: string;
  wcProductId: number;
  wcProductName: string;
  eventType: string;
  membership: string;
  compClass: string;
  wingType: string;
  wingSize: string;
  wingLoading: string;
  degreeOfTurn: string;
  priceCents: number;
}

interface WCOrder {
  id: number;
  status: string;
  billing: { email: string; country: string };
  meta_data: Array<{ key: string; value: string }>;
  line_items: Array<{
    product_id: number;
    total: string;
    meta_data: Array<{ key: string; value: string }>;
  }>;
}

function parseOrder(order: WCOrder): WCParsedRegistration[] {
  const registrations: WCParsedRegistration[] = [];
  const name = getMeta(order.meta_data, "first_and_last_name");
  const email = order.billing.email?.toLowerCase().trim();
  const country = convertCountry(order.billing.country);

  for (const item of order.line_items) {
    const product = WC_PRODUCT_MAP[item.product_id];
    if (!product) continue;

    const rawMembership = getMeta(item.meta_data, "membership");
    const rawClass = getMeta(item.meta_data, "comp-class");

    registrations.push({
      orderId: order.id,
      email,
      name: name || email,
      country,
      wcProductId: item.product_id,
      wcProductName: product.name,
      eventType: product.type,
      membership: rawMembership === "Non-Member" ? "non-member" : rawMembership === "Member" ? "member" : rawMembership?.toLowerCase() || "",
      compClass: rawClass?.toLowerCase() || "",
      wingType: getMeta(item.meta_data, "wing-1"),
      wingSize: getMeta(item.meta_data, "wing-1-size"),
      wingLoading: getMeta(item.meta_data, "wing-1-loading"),
      degreeOfTurn: getMeta(item.meta_data, "degree-of-turn"),
      priceCents: Math.round(parseFloat(item.total || "0") * 100),
    });
  }

  return registrations;
}

export async function fetchAllWCOrders(): Promise<WCParsedRegistration[]> {
  if (!WC_API_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
    throw new Error("WooCommerce API credentials not configured in .env.local");
  }

  const allRegistrations: WCParsedRegistration[] = [];
  const productIdSet = new Set(WC_PRODUCT_IDS);

  // Fetch all orders after 2025-12-01 (2026 season), filter by product client-side
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = new URL(`${WC_API_URL}/wp-json/wc/v3/orders`);
    url.searchParams.set("consumer_key", WC_CONSUMER_KEY);
    url.searchParams.set("consumer_secret", WC_CONSUMER_SECRET);
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));
    url.searchParams.set("status", "processing,completed");
    url.searchParams.set("after", "2025-12-01T00:00:00");

    const res = await fetch(url.toString());
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`WooCommerce API error (${res.status}): ${text}`);
    }

    const orders: WCOrder[] = await res.json();
    if (orders.length === 0) {
      hasMore = false;
      break;
    }

    for (const order of orders) {
      const regs = parseOrder(order);
      allRegistrations.push(...regs);
    }

    // WC API returns total pages in headers
    const totalPages = parseInt(res.headers.get("x-wp-totalpages") || "1", 10);
    if (page >= totalPages) {
      hasMore = false;
    }
    page++;
  }

  return allRegistrations;
}
