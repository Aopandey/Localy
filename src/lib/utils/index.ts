import type { PurchaseIntent } from "@/lib/types";
export const intentLabels: Record<PurchaseIntent, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
  irrelevant: "Irrelevant",
};
export const money = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
export const percent = (value: number) => `${Math.round(value * 100)}%`;
export const cx = (...values: (string | false | undefined | null)[]) =>
  values.filter(Boolean).join(" ");
