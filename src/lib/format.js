export const APP_NAME = "Hanzala Supermarket";
export const CURRENCY = "AFN";

export function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: CURRENCY,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0
  }).format(value || 0);
}
