export const APP_NAME = "Hanzala Supermarket";
export const CURRENCY = "AFN";
const AFGHANI_SYMBOL = "؋";

export function money(value) {
  const amount = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  }).format(value || 0);
  return `${AFGHANI_SYMBOL}${amount}`;
}
