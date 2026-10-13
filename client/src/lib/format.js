const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export const formatPrice = (rupees) => `₹${inr.format(rupees)}`;

export function variantLabel({ size, color }) {
  return [size, color].filter(Boolean).join(' · ');
}
