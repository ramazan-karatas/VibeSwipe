export type AssetSymbol = "BTC" | "ETH" | "SOL" | "SUI" | "BNB" | "XRP" | "ADA" | "DOGE" | "AVAX" | "MATIC";

export type AssetPrice = {
  usd: number;
  lastUpdated: string;
};

export type AssetPriceMap = Partial<Record<AssetSymbol, AssetPrice>>;

const SYMBOL_TO_COINGECKO_ID: Record<AssetSymbol, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  SUI: "sui",
  BNB: "binancecoin",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  AVAX: "avalanche-2",
  MATIC: "polygon"
};

const SYMBOL_TO_COINPAPRIKA_ID: Record<AssetSymbol, string> = {
  BTC: "btc-bitcoin",
  ETH: "eth-ethereum",
  SOL: "sol-solana",
  SUI: "sui-sui",
  BNB: "bnb-binance-coin",
  XRP: "xrp-xrp",
  ADA: "ada-cardano",
  DOGE: "doge-dogecoin",
  AVAX: "avax-avalanche",
  MATIC: "matic-polygon"
};

const BASE_MOCK_USD: Record<AssetSymbol, number> = {
  BTC: 98000,
  ETH: 3600,
  SOL: 160,
  SUI: 1.3,
  BNB: 600,
  XRP: 1.2,
  ADA: 1.1,
  DOGE: 0.22,
  AVAX: 60,
  MATIC: 1.8
};

function generateMockPrices(): AssetPriceMap {
  const now = Date.now();
  const iso = new Date(now).toISOString();
  const wobble = (seed: number) => 1 + Math.sin(now / 60_000 + seed) * 0.02; // ±2% drift per minute

  return {
    BTC: { usd: BASE_MOCK_USD.BTC * wobble(1), lastUpdated: iso },
    ETH: { usd: BASE_MOCK_USD.ETH * wobble(2), lastUpdated: iso },
    SOL: { usd: BASE_MOCK_USD.SOL * wobble(3), lastUpdated: iso },
    SUI: { usd: BASE_MOCK_USD.SUI * wobble(4), lastUpdated: iso },
    BNB: { usd: BASE_MOCK_USD.BNB * wobble(5), lastUpdated: iso },
    XRP: { usd: BASE_MOCK_USD.XRP * wobble(6), lastUpdated: iso },
    ADA: { usd: BASE_MOCK_USD.ADA * wobble(7), lastUpdated: iso },
    DOGE: { usd: BASE_MOCK_USD.DOGE * wobble(8), lastUpdated: iso },
    AVAX: { usd: BASE_MOCK_USD.AVAX * wobble(9), lastUpdated: iso },
    MATIC: { usd: BASE_MOCK_USD.MATIC * wobble(10), lastUpdated: iso }
  };
}

export async function fetchAssetPrices(): Promise<AssetPriceMap> {
  // Default to live prices; opt-in to mock via NEXT_PUBLIC_USE_MOCK_PRICES=true
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_PRICES === "true";
  // Respect explicit mock mode by immediately returning mocks.
  if (useMock) {
    return generateMockPrices();
  }

  const paprika = await fetchFromCoinpaprika();
  if (Object.keys(paprika).length > 0) {
    return paprika;
  }

  const ids = Object.values(SYMBOL_TO_COINGECKO_ID).join(",");
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error("Failed to fetch prices");
    const json = (await res.json()) as Record<string, { usd: number }>;
    const now = new Date().toISOString();
    const map: AssetPriceMap = {};
    (Object.keys(SYMBOL_TO_COINGECKO_ID) as AssetSymbol[]).forEach((sym) => {
      const id = SYMBOL_TO_COINGECKO_ID[sym];
      const usd = json?.[id]?.usd;
      if (typeof usd === "number") {
        map[sym] = { usd, lastUpdated: now };
      }
    });
    // If feed returns nothing, fall back to mocks so UI still works.
    if (Object.keys(map).length === 0) {
      return generateMockPrices();
    }
    return map;
  } catch (err) {
    console.warn("Failed to load prices", err);
    return generateMockPrices();
  }
}

async function fetchFromCoinpaprika(): Promise<AssetPriceMap> {
  const entries = Object.entries(SYMBOL_TO_COINPAPRIKA_ID) as [AssetSymbol, string][];
  const now = new Date().toISOString();
  const results: AssetPriceMap = {};

  // Fetch sequentially to reduce risk of rate limiting.
  for (const [symbol, id] of entries) {
    try {
      const res = await fetch(`https://api.coinpaprika.com/v1/tickers/${id}`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`coinpaprika ${symbol} status ${res.status}`);
      }
      const json = (await res.json()) as { quotes?: { USD?: { price?: number } } };
      const usd = json?.quotes?.USD?.price;
      if (typeof usd === "number") {
        results[symbol] = { usd, lastUpdated: now };
      }
    } catch (err) {
      console.warn("Coinpaprika fetch failed for", symbol, err);
    }
  }

  return results;
}
