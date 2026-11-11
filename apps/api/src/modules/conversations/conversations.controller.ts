import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { createChatwootAdapter } from '../../adapters/chatwoot';
import { recordAudit } from '../audit/audit.controller';

export async function listConversations(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as string | undefined;
    const adapter = createChatwootAdapter();
    const cw = await adapter.conversations(status);
    const payload = Array.isArray(cw) ? cw : (cw?.data?.payload || cw?.payload || []);
    // upsert references
    for (const c of payload) {
      await prisma.conversationReference.upsert({
        where: { chatwootConversationId: c.id },
        update: { status: c.status || 'open', chatwootInboxId: c.inbox_id, chatwootAssigneeId: c.assignee?.id, chatwootTeamId: c.team?.id, priority: c.priority, lastActivityAt: c.last_activity_at ? new Date(c.last_activity_at * 1000) : undefined },
        create: { chatwootConversationId: c.id, status: c.status || 'open', chatwootInboxId: c.inbox_id, chatwootAssigneeId: c.assignee?.id, chatwootTeamId: c.team?.id, priority: c.priority, lastActivityAt: c.last_activity_at ? new Date(c.last_activity_at * 1000) : undefined },
      }).catch(() => {});
    }
    const refs = await prisma.conversationReference.findMany({ orderBy: { lastActivityAt: 'desc' }, take: 100, include: { client: true, localAssignee: true, localTeam: true } });
    res.json({ chatwoot: payload, references: refs });
  } catch (e) { next(e); }
}

const assignSchema = z.object({
  conversationId: z.string().uuid().optional(), // local ref id
  chatwootConversationId: z.number().int().optional(),
  toUserId: z.string().uuid().optional(),
  toTeamId: z.string().uuid().optional(),
  toChatwootAssigneeId: z.number().int().optional(),
  toChatwootTeamId: z.number().int().optional(),
  reason: z.string().optional(),
});

export async function assignConversation(req: Request, res: Response, next: NextFunction) {
  try {
    const body = assignSchema.parse(req.body);
    const ref = body.conversationId
      ? await prisma.conversationReference.findUnique({ where: { id: body.conversationId } })
      : await prisma.conversationReference.findUnique({ where: { chatwootConversationId: body.chatwootConversationId! } });
    if (!ref) return res.status(404).json({ error: 'Conversation reference not found' });

    const fromUserId = ref.localAssigneeId;
    const fromTeamId = ref.localTeamId;
    const fromCwAssignee = ref.chatwootAssigneeId;
    const fromCwTeam = ref.chatwootTeamId;

    // update local
    const updated = await prisma.conversationReference.update({
      where: { id: ref.id },
      data: { localAssigneeId: body.toUserId, localTeamId: body.toTeamId, chatwootAssigneeId: body.toChatwootAssigneeId ?? ref.chatwootAssigneeId, chatwootTeamId: body.toChatwootTeamId ?? ref.chatwootTeamId },
    });

    // record history
    const hist = await prisma.assignmentHistory.create({
      data: {
        conversationRefId: ref.id,
        fromUserId, toUserId: body.toUserId,
        fromTeamId, toTeamId: body.toTeamId,
        fromChatwootAssigneeId: fromCwAssignee, toChatwootAssigneeId: body.toChatwootAssigneeId,
        reason: body.reason, actorId: (req as any).userId, syncStatus: 'pending',
      },
    });

    // sync to Chatwoot (best effort)
    try {
      const adapter = createChatwootAdapter();
      // Chatwoot assignment endpoint: POST /api/v1/accounts/:id/conversations/:id/assignments
      const cwConvId = ref.chatwootConversationId;
      await adapter.request(`/api/v1/accounts/${process.env.CHATWOOT_ACCOUNT_ID}/conversations/${cwConvId}/assignments`, {
        method: 'POST',
        body: JSON.stringify({ assignee_id: body.toChatwootAssigneeId, team_id: body.toChatwootTeamId }),
      });
      await prisma.assignmentHistory.update({ where: { id: hist.id }, data: { syncStatus: 'synced' } });
    } catch (e: any) {
      await prisma.assignmentHistory.update({ where: { id: hist.id }, data: { syncStatus: 'failed', syncError: e.message } });
    }

    recordAudit((req as any).userId, 'conversation.assign', 'conversation', ref.id, { toUserId: body.toUserId, toTeamId: body.toTeamId }, req.ip);
    res.json({ conversation: updated, assignment: hist });
  } catch (e) { next(e); }
}

export async function linkClient(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ conversationId: z.string().uuid(), clientId: z.string().uuid().optional(), contactId: z.string().uuid().optional() }).parse(req.body);
    const ref = await prisma.conversationReference.update({ where: { id: body.conversationId }, data: { clientId: body.clientId, contactId: body.contactId } });
    res.json(ref);
  } catch (e) { next(e); }
}
