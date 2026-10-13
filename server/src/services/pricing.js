// The only place totals are computed. Cart and order both go through here, so
// what the cart screen shows is exactly what checkout charges.
export const FREE_SHIPPING_THRESHOLD = 499;
export const SHIPPING_FEE = 40;

export function computeTotals(lines) {
  let itemCount = 0;
  let subtotal = 0;
  let mrpTotal = 0;
  for (const line of lines) {
    itemCount += line.quantity;
    subtotal += line.price * line.quantity;
    mrpTotal += Math.max(line.mrp, line.price) * line.quantity;
  }
  const shippingFee = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  return {
    itemCount,
    subtotal,
    mrpTotal,
    savings: mrpTotal - subtotal,
    shippingFee,
    total: subtotal + shippingFee,
  };
}
