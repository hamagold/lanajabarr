export const CURRENCIES = [
  { code: "SEK", symbol: "kr", label: "Swedish krona", native: "Krona" },
  { code: "USD", symbol: "$", label: "US dollar", native: "دۆلار" },
  { code: "EUR", symbol: "€", label: "Euro", native: "یۆرۆ" },
  { code: "GBP", symbol: "£", label: "British pound", native: "پاوەن" },
  { code: "IQD", symbol: "ع.د", label: "Iraqi dinar", native: "دینار" },
  { code: "TRY", symbol: "₺", label: "Turkish lira", native: "لیرە" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export const CURRENCY_CODES = CURRENCIES.map((c) => c.code) as readonly CurrencyCode[];

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && (CURRENCY_CODES as readonly string[]).includes(value);
}

export function currencyMeta(code: CurrencyCode) {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}
