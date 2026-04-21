// Formatage dates pour affichage (JJ/MM/AA) et inputs HTML (YYYY-MM-DD)

export function toDisplay(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${String(y).slice(2)}`;
}

export function toInput(dateStr) {
  if (!dateStr) return '';
  return dateStr.slice(0, 10); // YYYY-MM-DD depuis timestamptz
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}