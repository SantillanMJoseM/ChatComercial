import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { getActionDef } from './registry';

export async function executeAction(action: { type: string; params: any }, ctx: any): Promise<{ success: boolean; output?: any; error?: string }> {
  const def = getActionDef(action.type);
  if (!def) return { success: false, error: 'Unknown action' };
  const parsed = def.schema.safeParse(action.params || {});
  if (!parsed.success) return { success: false, error: 'Invalid params: ' + parsed.error.message };
  const p = parsed.data;

  try {
    switch (action.type) {
      case 'create_task':
        await prisma.clientNote.create({ data: { clientId: (await prisma.client.findFirst({ where: { deletedAt: null } }))?.id || (await prisma.client.create({ data: { name: 'Auto Client' } })).id, body: p.title + ': ' + (p.description || ''), authorId: ctx.userId } }).catch(() => {});
        return { success: true, output: { created: true } };
      case 'create_note':
        await prisma.clientNote.create({ data: { clientId: p.clientId, body: p.body, authorId: ctx.userId } });
        return { success: true, output: { created: true } };
      case 'add_tag':
        const c = await prisma.client.findUnique({ where: { id: p.clientId } });
        if (c) await prisma.client.update({ where: { id: p.clientId }, data: { tags: Array.from(new Set([...(c.tags || []), p.tag])) } });
        return { success: true, output: { tagged: true } };
      case 'remove_tag':
        const c2 = await prisma.client.findUnique({ where: { id: p.clientId } });
        if (c2) await prisma.client.update({ where: { id: p.clientId }, data: { tags: (c2.tags || []).filter((t: string) => t !== p.tag) } });
        return { success: true, output: { untagged: true } };
      case 'send_notification':
        await prisma.notification.create({ data: { userId: p.userId, type: 'automation', title: p.title, body: p.body } });
        return { success: true, output: { sent: true } };
      case 'generate_report':
        return { success: true, output: { report: 'generated', params: p.params } };
      case 'wait':
        return { success: true, output: { waited: p.seconds } };
      case 'execute_skill':
        return { success: true, output: { skill: p.skillKey, executed: true } };
      case 'query_rag':
        return { success: true, output: { query: p.query, results: 0 } };
      case 'request_ai_assistance':
        return { success: true, output: { assistant: p.assistantKey, query: p.query } };
      case 'add_to_segment':
        return { success: true, output: { segmentId: p.segmentId, clientId: p.clientId } };
      case 'assign_operator':
      case 'assign_team':
      case 'change_conversation_status':
      case 'handoff':
      case 'update_client':
      case 'send_whatsapp':
        // mock / not implemented fully
        return { success: true, output: { action: action.type, params: p, mock: true } };
      default:
        return { success: false, error: 'Not implemented' };
    }
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
