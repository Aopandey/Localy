export const money = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
export const percent = (value: number) => `${Math.round(value * 100)}%`;
export const cx = (...values: (string | false | undefined | null)[]) =>
  values.filter(Boolean).join(" ");
