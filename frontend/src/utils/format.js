export function currency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
