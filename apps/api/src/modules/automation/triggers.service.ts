import { prisma } from '../../lib/prisma';

export const TRIGGER_TYPES = [
  'client.created','client.updated','client.inactive','contact.created',
  'conversation.created','conversation.status_changed','conversation.assigned','conversation.resolved','conversation.reopened','conversation.unanswered',
  'message.received','whatsapp.group.created','segment.created',
  'skill.executed','handoff.created','scheduled','manual',
];

export function triggerMatches(trigger: any, event: any): boolean {
  if (!trigger || !trigger.type) return false;
  if (trigger.type !== event.eventType) return false;
  // optional config filters
  const cfg = trigger.config || {};
  if (cfg.entityType && cfg.entityType !== event.entityType) return false;
  return true;
}

export async function findCandidateAutomations(event: any) {
  const automations = await prisma.automation.findMany({ where: { status: 'published', deletedAt: null }, include: { publishedVersion: { include: { triggers: true } } } });
  const candidates: { automation: any; version: any; trigger: any }[] = [];
  for (const a of automations) {
    const v = a.publishedVersion;
    if (!v) continue;
    for (const t of (v.triggers || [])) {
      if (triggerMatches(t, event)) {
        candidates.push({ automation: a, version: v, trigger: t });
      }
    }
  }
  return candidates;
}
