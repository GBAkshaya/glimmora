export const GIFT_WRAP_FEE = 50

export function discountedPrice(price: number, discountPercent: number) {
  const clampedPercent = Math.min(100, Math.max(0, discountPercent))
  return price * (1 - clampedPercent / 100)
}

export function formatInr(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}
