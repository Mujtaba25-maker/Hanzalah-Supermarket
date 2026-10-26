export const APP_NAME = "Hanzala Supermarket";
export const CURRENCY = "AFN";

export function money(value) {
  const amount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value || 0);
  return `AFN ${amount}`;
}
