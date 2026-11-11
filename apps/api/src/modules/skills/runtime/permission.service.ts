import { prisma } from '../../../lib/prisma';

export async function checkSkillPermission(skill: any, assistantId: string | undefined, userId: string | undefined, userPermissions: string[]) {
  if (skill.status !== 'published') return { allowed: false, reason: 'Skill not published' };
  if (skill.executionMode === 'disabled') return { allowed: false, reason: 'Skill disabled' };
  if (assistantId) {
    const link = await prisma.skillAssistant.findUnique({ where: { skillId_assistantId: { skillId: skill.id, assistantId } } });
    if (!link) return { allowed: false, reason: 'Assistant not linked to skill' };
  }
  // required permissions
  const reqPerms = skill.publishedVersion?.requiredPermissions || [];
  for (const p of reqPerms) {
    if (!userPermissions.includes(p) && !userPermissions.includes('*')) return { allowed: false, reason: `Missing permission ${p}` };
  }
  return { allowed: true };
}
