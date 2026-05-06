export const toInt = (v: any) => parseInt(String(v || 0), 10) || 0;
export const toMoney = (v: any) => parseFloat(String(v || 0)) || 0;

export const formatMoney = (amount: any, currency = 'DOP') => {
  const val = toMoney(amount);
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
  }).format(val);
};

export const formatBudgetMoney = (amount: any, currency = 'DOP') => {
  return formatMoney(amount, currency);
};

export const formatDateTime = (date: string | Date | null | undefined) => {
  if (!date) return 'N/A';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Fecha inválida';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return 'Fecha inválida';
  }
};

export const normalizeText = (v: any) => String(v || '').trim();
export const normalizeSearch = (v: any) => normalizeText(v).toLowerCase();

export const isToday = (date: string | Date | null | undefined) => {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  return d.getDate() === now.getDate() &&
         d.getMonth() === now.getMonth() &&
         d.getFullYear() === now.getFullYear();
};

export const titleCase = (value: string) => {
  const text = normalizeText(value);
  if (!text) return '';
  return text
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};
