import { prisma } from '../../../lib/prisma';

export async function approveExecution(id: string, userId: string) {
  return prisma.skillExecution.update({ where: { id }, data: { status: 'completed', approvedBy: userId, approvedAt: new Date() } });
}

export async function rejectExecution(id: string) {
  return prisma.skillExecution.update({ where: { id }, data: { status: 'rejected' } });
}
