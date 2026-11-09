import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

export async function seed() {
  const statusCount = await prisma.orderStatus.count();
  if (statusCount === 0) {
    const defaults = [
      { name: 'Nuevos', color: '#6366f1' },
      { name: 'Pendiente de Pago', color: '#f59e0b' },
      { name: 'En Preparación', color: '#3b82f6' },
      { name: 'Listo para Retirar', color: '#8b5cf6' },
      { name: 'En Despacho', color: '#f97316' },
      { name: 'Entregado', color: '#10b981' },
    ];
    for (let i = 0; i < defaults.length; i++) {
      await prisma.orderStatus.create({ data: { ...defaults[i], position: i, isSystemDefault: true } });
    }
  }
  const settings = await prisma.setting.findUnique({ where: { id: 'global' } });
  if (!settings) {
    await prisma.setting.create({
      data: {
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
        toneRules: { noOpeningQuestionMark: true, noFinalPeriod: true, useDiscreteEmojis: true },
        globalBotEnabled: true,
      },
    });
  }

  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({ data: { email: 'admin@chatcomercial.com', passwordHash, name: 'Admin', role: 'admin' } });
  }
}

seed().catch(console.error);