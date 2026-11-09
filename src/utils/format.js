export const money = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n || 0);
export const dt = (iso) => new Date(iso).toLocaleString('es-AR');