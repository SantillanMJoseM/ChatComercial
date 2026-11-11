import { prisma } from '../../../lib/prisma';

export async function getPublishedSkill(key: string) {
  const skill = await prisma.skill.findUnique({ where: { key }, include: { publishedVersion: { include: { toolPermissions: { include: { tool: true } } } } } });
  if (!skill || skill.status !== 'published' || !skill.publishedVersion) return null;
  if (!skill.isActive) return null;
  return skill;
}

export async function listPublishedSkills() {
  return prisma.skill.findMany({ where: { status: 'published', isActive: true }, include: { publishedVersion: true } });
}
