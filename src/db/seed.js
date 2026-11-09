import { db, uid } from './db';

const DEFAULT_STATUSES = [
  { name: 'Nuevos', color: '#6366f1' },
  { name: 'Pendiente de Pago', color: '#f59e0b' },
  { name: 'En Preparación', color: '#3b82f6' },
  { name: 'Listo para Retirar', color: '#8b5cf6' },
  { name: 'En Despacho', color: '#f97316' },
  { name: 'Entregado', color: '#10b981' },
];

export async function seedDefaults() {
  const settingsCount = await db.settings.count();
  if (!settingsCount) {
    await db.settings.put({
      id: 'global',
      botResponseMode: 'auto',
      weeklySchedule: {
        monday: { enabled: true, start: '09:00', end: '18:00' },
        tuesday: { enabled: true, start: '09:00', end: '18:00' },
        wednesday: { enabled: true, start: '09:00', end: '18:00' },
        thursday: { enabled: true, start: '09:00', end: '18:00' },
        friday: { enabled: true, start: '09:00', end: '18:00' },
        saturday: { enabled: true, start: '09:00', end: '13:00' },
        sunday: { enabled: false, start: '09:00', end: '13:00' },
      },
      outOfHours: false,
      toneRules: {
        noOpeningQuestionMark: true,
        noFinalPeriod: true,
        useDiscreteEmojis: true,
      },
      globalBotEnabled: true,
    });
  }

  const productCount = await db.products.count();
  if (!productCount) {
    await db.products.bulkPut([
      { id: uid(), name: 'Ventana Módena 120x100', description: 'Ventana de aluminio línea Módena', price: 85000, stock: 12, category: 'Aberturas', image_url: '', is_custom_dimensions: true, sku: 'VEN-MOD-120' },
      { id: uid(), name: 'Puerta Placa', description: 'Puerta placa estándar', price: 120000, stock: 5, category: 'Puertas', image_url: '', is_custom_dimensions: false, sku: 'PUE-PLA-001' },
      { id: uid(), name: 'Vidrio DVH 4+12+4', description: 'Vidrio doble hermético', price: 35000, stock: 20, category: 'Vidrios', image_url: '', is_custom_dimensions: true, sku: 'VID-DVH-4' },
    ]);
  }
  const customerCount = await db.customers.count();
  if (!customerCount) {
    await db.customers.bulkPut([
      { id: uid(), name: 'Juan Pérez', phone: '+54 9 381 555-0001', email: 'juan@mail.com', branch_location: 'Tucumán', bot_enabled: true, notes: '' },
      { id: uid(), name: 'María García', phone: '+54 9 11 555-0002', email: 'maria@mail.com', branch_location: 'Buenos Aires', bot_enabled: true, notes: '' },
    ]);
  }

  const statusCount = await db.order_statuses.count();
  if (!statusCount) {
    for (let i = 0; i < DEFAULT_STATUSES.length; i++) {
      await db.order_statuses.put({
        id: uid(),
        name: DEFAULT_STATUSES[i].name,
        color: DEFAULT_STATUSES[i].color,
        position: i,
        is_system_default: true,
      });
    }
  }
}