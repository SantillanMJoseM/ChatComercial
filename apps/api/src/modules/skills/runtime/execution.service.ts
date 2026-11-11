import { prisma } from '../../../lib/prisma';

export async function createExecution(skillVersionId: string, assistantId: string | undefined, userId: string | undefined, input: any, status = 'running') {
  return prisma.skillExecution.create({ data: { skillVersionId, assistantId, userId, input, status } });
}

export async function finishExecution(id: string, status: string, output: any, error: string | null, durationMs: number) {
  return prisma.skillExecution.update({ where: { id }, data: { status, output, error, durationMs } });
}
