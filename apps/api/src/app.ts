import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/error';
import { requireAuth } from './middleware/auth';
import { requirePermission } from './lib/rbac';
import * as authCtrl from './modules/auth/auth.controller';
import * as usersCtrl from './modules/users/users.controller';
import * as rolesCtrl from './modules/roles/roles.controller';
import * as permsCtrl from './modules/permissions/permissions.controller';
import * as teamsCtrl from './modules/teams/teams.controller';
import * as clientsCtrl from './modules/crm/clients/clients.controller';
import * as contactsCtrl from './modules/crm/contacts/contacts.controller';
import * as opsCtrl from './modules/operators/operators.controller';
import * as convsCtrl from './modules/conversations/conversations.controller';
import * as assignCtrl from './modules/assignments/assignments.controller';
import * as metricsCtrl from './modules/metrics/metrics.controller';
import * as notesCtrl from './modules/notes/notes.controller';
import * as segCtrl from './modules/segments/segments.controller';
import * as consentCtrl from './modules/consents/consents.controller';
import * as wgrpCtrl from './modules/whatsapp-groups/whatsapp-groups.controller';
import * as cwteamCtrl from './modules/chatwoot-teams/chatwoot-teams.controller';
import * as aiCtrl from './modules/ai/ai.controller';
import * as autoCtrl from './modules/automation/automation.controller';
import * as reportCtrl from './modules/reports/reports.controller';
import * as exportCtrl from './modules/exports/exports.controller';
import * as knowCtrl from './modules/knowledge/knowledge.controller';
import * as embCtrl from './modules/embeddings/embeddings.controller';
import * as knowUpload from './modules/knowledge/upload.controller';
import * as skillCtrl from './modules/skills/skills.controller';
import * as retrievalCtrl from './modules/retrieval/retrieval.controller';
import * as contextCtrl from './modules/context-builder/context.controller';
import * as groundedCtrl from './modules/grounded/grounded.controller';
import * as retentionCtrl from './modules/retention/retention.controller';
import * as healthCtrl from './modules/health/health.controller';
import * as systemCtrl from './modules/system/system.controller';
import * as auditCtrl from './modules/audit/audit.controller';
import * as intCtrl from './modules/integrations/integrations.controller';
import * as whCtrl from './modules/webhooks/webhooks.controller';

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(compression());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(rateLimit({ windowMs: env.RATE_LIMIT_WINDOW_MS, max: env.RATE_LIMIT_MAX, standardHeaders: true, legacyHeaders: false }));

  app.get('/api/v1/health', healthCtrl.health);
  app.get('/api/v1/health/ready', healthCtrl.ready);
  app.get('/api/v1/system/status', healthCtrl.systemStatus);

  app.post('/api/v1/auth/login', authCtrl.login);
  app.post('/api/v1/auth/register', authCtrl.register);
  app.post('/api/v1/auth/logout', requireAuth, authCtrl.logout);
  app.get('/api/v1/auth/me', requireAuth, authCtrl.me);

  app.get('/api/v1/users', requireAuth, requirePermission('users.read'), usersCtrl.listUsers);
  app.post('/api/v1/users', requireAuth, requirePermission('users.create'), usersCtrl.createUser);
  app.patch('/api/v1/users/:id', requireAuth, requirePermission('users.update'), usersCtrl.updateUser);

  app.get('/api/v1/roles', requireAuth, requirePermission('roles.read'), rolesCtrl.listRoles);
  app.get('/api/v1/permissions', requireAuth, requirePermission('permissions.read'), permsCtrl.listPermissions);

  app.get('/api/v1/teams', requireAuth, requirePermission('teams.read'), teamsCtrl.listTeams);
  app.post('/api/v1/teams', requireAuth, requirePermission('teams.create'), teamsCtrl.createTeam);
  app.post('/api/v1/teams/:id/members', requireAuth, requirePermission('teams.update'), teamsCtrl.addTeamMember);

  app.get('/api/v1/system/settings', requireAuth, requirePermission('system.read'), systemCtrl.getSettings);
  app.patch('/api/v1/system/settings', requireAuth, requirePermission('system.update'), systemCtrl.patchSetting);

  app.get('/api/v1/audit', requireAuth, requirePermission('audit.read'), auditCtrl.listAudit);

  // Integrations (protected)
  app.get('/api/v1/integrations', requireAuth, requirePermission('integrations.read'), intCtrl.listIntegrations);
  app.get('/api/v1/integrations/:key', requireAuth, requirePermission('integrations.read'), intCtrl.getIntegration);
  app.post('/api/v1/integrations/:key/test', requireAuth, requirePermission('integrations.manage'), intCtrl.testConnection);
  app.get('/api/v1/integrations/waha/qr', requireAuth, requirePermission('integrations.read'), intCtrl.wahaQr);
  app.get('/api/v1/integrations/waha/session', requireAuth, requirePermission('integrations.read'), intCtrl.wahaSession);
  app.get('/api/v1/integrations/chatwoot/inboxes', requireAuth, requirePermission('integrations.read'), intCtrl.chatwootInboxes);
  app.post('/api/v1/integrations/chatwoot/inboxes', requireAuth, requirePermission('integrations.manage'), intCtrl.createChatwootInbox);
  app.patch('/api/v1/integrations/:key', requireAuth, requirePermission('integrations.manage'), intCtrl.patchIntegration);

  // Webhooks (public, token-validated)
  app.post('/api/v1/webhooks/waha', whCtrl.wahaWebhook);
  app.post('/api/v1/webhooks/chatwoot', whCtrl.chatwootWebhook);

  // CRM clients
  app.get('/api/v1/clients', requireAuth, requirePermission('crm.clients.read'), clientsCtrl.listClients);
  app.post('/api/v1/clients', requireAuth, requirePermission('crm.clients.create'), clientsCtrl.createClient);
  app.get('/api/v1/clients/:id', requireAuth, requirePermission('crm.clients.read'), clientsCtrl.getClient);
  app.patch('/api/v1/clients/:id', requireAuth, requirePermission('crm.clients.update'), clientsCtrl.updateClient);
  app.delete('/api/v1/clients/:id', requireAuth, requirePermission('crm.clients.delete'), clientsCtrl.deleteClient);

  // Contacts
  app.get('/api/v1/contacts', requireAuth, requirePermission('crm.contacts.read'), contactsCtrl.listContacts);
  app.post('/api/v1/contacts', requireAuth, requirePermission('crm.contacts.manage'), contactsCtrl.createContact);
  app.patch('/api/v1/contacts/:id', requireAuth, requirePermission('crm.contacts.manage'), contactsCtrl.updateContact);
  app.delete('/api/v1/contacts/:id', requireAuth, requirePermission('crm.contacts.manage'), contactsCtrl.deleteContact);

  // Operators
  app.get('/api/v1/operators', requireAuth, requirePermission('operators.read'), opsCtrl.listOperators);
  app.post('/api/v1/operators', requireAuth, requirePermission('operators.manage'), opsCtrl.createOperatorProfile);
  app.patch('/api/v1/operators/:id', requireAuth, requirePermission('operators.manage'), opsCtrl.updateOperatorProfile);
  app.get('/api/v1/operators/user/:userId', requireAuth, requirePermission('operators.read'), opsCtrl.getOperatorProfileByUser);

  // Teams supervisors
  app.get('/api/v1/teams/:id/supervisors', requireAuth, requirePermission('teams.read'), teamsCtrl.listSupervisors);
  app.post('/api/v1/teams/:id/supervisors', requireAuth, requirePermission('teams.manage'), teamsCtrl.addSupervisor);
  app.delete('/api/v1/teams/:id/supervisors/:supervisorId', requireAuth, requirePermission('teams.manage'), teamsCtrl.removeSupervisor);
  app.patch('/api/v1/teams/:id', requireAuth, requirePermission('teams.manage'), teamsCtrl.patchTeam);

  // Conversations
  app.get('/api/v1/conversations', requireAuth, requirePermission('conversations.read'), convsCtrl.listConversations);
  app.post('/api/v1/conversations/assign', requireAuth, requirePermission('conversations.assign'), convsCtrl.assignConversation);
  app.post('/api/v1/conversations/link-client', requireAuth, requirePermission('conversations.manage'), convsCtrl.linkClient);

  // Assignments history
  app.get('/api/v1/assignments', requireAuth, requirePermission('conversations.read'), assignCtrl.listAssignmentHistory);

  // Metrics
  app.get('/api/v1/metrics', requireAuth, requirePermission('metrics.read'), metricsCtrl.getMetrics);

  // Notes & interactions
  app.get('/api/v1/notes', requireAuth, requirePermission('crm.clients.read'), notesCtrl.listNotes);
  app.post('/api/v1/notes', requireAuth, requirePermission('crm.clients.update'), notesCtrl.createNote);
  app.get('/api/v1/interactions', requireAuth, requirePermission('crm.clients.read'), notesCtrl.listInteractions);
  app.post('/api/v1/interactions', requireAuth, requirePermission('crm.clients.update'), notesCtrl.createInteraction);

  // Segments
  app.get('/api/v1/segments', requireAuth, requirePermission('segments.read'), segCtrl.listSegments);
  app.post('/api/v1/segments', requireAuth, requirePermission('segments.manage'), segCtrl.createSegment);
  app.get('/api/v1/segments/:id', requireAuth, requirePermission('segments.read'), segCtrl.getSegment);
  app.post('/api/v1/segments/:id/preview', requireAuth, requirePermission('segments.read'), segCtrl.previewSegment);
  app.delete('/api/v1/segments/:id', requireAuth, requirePermission('segments.manage'), segCtrl.deleteSegment);

  // Consents
  app.get('/api/v1/consents', requireAuth, requirePermission('consents.manage'), consentCtrl.listConsents);
  app.post('/api/v1/consents', requireAuth, requirePermission('consents.manage'), consentCtrl.createConsent);
  app.post('/api/v1/consents/:id/revoke', requireAuth, requirePermission('consents.manage'), consentCtrl.revokeConsent);

  // WhatsApp groups
  app.get('/api/v1/whatsapp-groups', requireAuth, requirePermission('whatsapp.groups.manage'), wgrpCtrl.listGroups);
  app.post('/api/v1/whatsapp-groups/preview', requireAuth, requirePermission('whatsapp.groups.manage'), wgrpCtrl.previewGroup);
  app.post('/api/v1/whatsapp-groups', requireAuth, requirePermission('whatsapp.groups.manage'), wgrpCtrl.createGroup);

  // Chatwoot teams
  app.get('/api/v1/chatwoot-teams', requireAuth, requirePermission('chatwoot.teams.manage'), cwteamCtrl.listChatwootTeams);
  app.post('/api/v1/chatwoot-teams', requireAuth, requirePermission('chatwoot.teams.manage'), cwteamCtrl.createChatwootTeam);
  app.post('/api/v1/chatwoot-teams/link', requireAuth, requirePermission('chatwoot.teams.manage'), cwteamCtrl.linkChatwootTeam);

  // AI
  app.get('/api/v1/ai/providers', requireAuth, requirePermission('ai.providers.manage'), aiCtrl.listProviders);
  app.post('/api/v1/ai/providers', requireAuth, requirePermission('ai.providers.manage'), aiCtrl.createProvider);
  app.patch('/api/v1/ai/providers/:key', requireAuth, requirePermission('ai.providers.manage'), aiCtrl.updateProvider);
  app.post('/api/v1/ai/providers/:key/test', requireAuth, requirePermission('ai.providers.manage'), aiCtrl.testProvider);
  app.get('/api/v1/ai/models', requireAuth, requirePermission('ai.providers.manage'), aiCtrl.listModels);
  app.post('/api/v1/ai/models', requireAuth, requirePermission('ai.providers.manage'), aiCtrl.createModel);
  app.get('/api/v1/ai/assistants', requireAuth, requirePermission('ai.assistants.manage'), aiCtrl.listAssistants);
  app.post('/api/v1/ai/assistants', requireAuth, requirePermission('ai.assistants.manage'), aiCtrl.createAssistant);
  app.patch('/api/v1/ai/assistants/:key', requireAuth, requirePermission('ai.assistants.manage'), aiCtrl.updateAssistant);
  app.get('/api/v1/ai/tools', requireAuth, requirePermission('ai.assistants.manage'), aiCtrl.listTools);
  app.post('/api/v1/ai/tools', requireAuth, requirePermission('ai.assistants.manage'), aiCtrl.createTool);
  app.post('/api/v1/ai/execute', requireAuth, requirePermission('ai.execute'), aiCtrl.executeChat);
  app.get('/api/v1/ai/usage', requireAuth, requirePermission('ai.usage.read'), aiCtrl.getUsage);

  // Knowledge
  app.get('/api/v1/knowledge/collections', requireAuth, requirePermission('knowledge.collections.read'), knowCtrl.listCollections);
  app.post('/api/v1/knowledge/collections', requireAuth, requirePermission('knowledge.collections.manage'), knowCtrl.createCollection);
  app.get('/api/v1/knowledge/documents', requireAuth, requirePermission('knowledge.documents.read'), knowCtrl.listDocuments);
  app.post('/api/v1/knowledge/documents/upload', requireAuth, requirePermission('knowledge.documents.upload'), knowUpload.uploadMiddleware, knowUpload.uploadDocument);
  app.get('/api/v1/knowledge/documents/:id/download', requireAuth, requirePermission('knowledge.documents.read'), knowUpload.downloadDocument);
  app.delete('/api/v1/knowledge/documents/:id', requireAuth, requirePermission('knowledge.documents.delete'), knowUpload.deleteDocument);
  app.post('/api/v1/knowledge/documents', requireAuth, requirePermission('knowledge.documents.upload'), knowCtrl.createDocument);
  app.get('/api/v1/knowledge/jobs', requireAuth, requirePermission('knowledge.documents.process'), knowCtrl.listJobs);
  app.get('/api/v1/knowledge/chunks', requireAuth, requirePermission('knowledge.documents.read'), knowCtrl.listChunks);
  app.get('/api/v1/embeddings/config', requireAuth, requirePermission('knowledge.embeddings.read'), embCtrl.getConfig);
  app.post('/api/v1/embeddings/config', requireAuth, requirePermission('knowledge.embeddings.manage'), embCtrl.setConfig);
  app.post('/api/v1/embeddings/test', requireAuth, requirePermission('knowledge.embeddings.manage'), embCtrl.testConfig);
  app.post('/api/v1/embeddings/index', requireAuth, requirePermission('knowledge.embeddings.manage'), embCtrl.indexDocument);
  app.get('/api/v1/embeddings/status', requireAuth, requirePermission('knowledge.embeddings.read'), embCtrl.getStatus);
  app.post('/api/v1/embeddings/search', requireAuth, requirePermission('knowledge.embeddings.read'), embCtrl.search);
  app.get('/api/v1/knowledge/chunks', requireAuth, requirePermission('knowledge.documents.read'), knowCtrl.listChunks);
  app.post('/api/v1/knowledge/jobs', requireAuth, requirePermission('knowledge.documents.process'), knowCtrl.createJob);

  // Skills

  // Retrieval (RAG)
  app.post('/api/v1/retrieval/query', requireAuth, requirePermission('knowledge.documents.read'), retrievalCtrl.retrieveEndpoint);

  // Context Builder
  app.post('/api/v1/context/build', requireAuth, requirePermission('knowledge.documents.read'), contextCtrl.buildContextEndpoint);

  // Grounded generation
  app.post('/api/v1/ai/grounded', requireAuth, requirePermission('ai.execute'), groundedCtrl.groundedExecute);

  // AI audit / traceability
  app.get('/api/v1/ai/queries', requireAuth, requirePermission('ai.audit.read'), aiCtrl.listQueries);
  app.get('/api/v1/ai/queries/:id', requireAuth, requirePermission('ai.audit.read'), aiCtrl.getQuery);
  app.get('/api/v1/ai/queries/:id/citations', requireAuth, requirePermission('ai.citations.read'), aiCtrl.getCitations);
  app.post('/api/v1/ai/queries/:id/feedback', requireAuth, requirePermission('ai.feedback.manage'), (req,res,next) => { req.body.executionId = req.params.id; aiCtrl.createFeedback(req,res,next); });
  app.get('/api/v1/ai/feedback', requireAuth, requirePermission('ai.feedback.read'), aiCtrl.listFeedback);

  // Retention
  app.post('/api/v1/retention/run', requireAuth, requirePermission('ai.audit.manage'), retentionCtrl.runRetention);

  // Skills
  app.get('/api/v1/skills', requireAuth, requirePermission('skills.read'), skillCtrl.listSkills);
  app.post('/api/v1/skills', requireAuth, requirePermission('skills.create'), skillCtrl.createSkill);
  app.get('/api/v1/skills/:key', requireAuth, requirePermission('skills.read'), skillCtrl.getSkill);
  app.patch('/api/v1/skills/:key', requireAuth, requirePermission('skills.update'), skillCtrl.updateSkill);
  app.get('/api/v1/skills/:key/versions', requireAuth, requirePermission('skills.read'), skillCtrl.listVersions);
  app.post('/api/v1/skills/:key/versions', requireAuth, requirePermission('skills.manage'), skillCtrl.createVersion);
  app.post('/api/v1/skills/:key/publish', requireAuth, requirePermission('skills.publish'), skillCtrl.publishVersion);
  app.post('/api/v1/skills/:key/disable', requireAuth, requirePermission('skills.manage'), skillCtrl.disableSkill);
  app.post('/api/v1/skills/:key/link-assistant', requireAuth, requirePermission('skills.manage'), skillCtrl.linkAssistant);
  app.post('/api/v1/skills/:key/set-tool-permission', requireAuth, requirePermission('skills.manage'), skillCtrl.setToolPermission);
  app.post('/api/v1/skills/:key/execute', requireAuth, requirePermission('skills.execute'), skillCtrl.executeSkill);
  app.get('/api/v1/skill-executions', requireAuth, requirePermission('skills.audit.read'), skillCtrl.listExecutions);
  app.get('/api/v1/skill-executions/:id', requireAuth, requirePermission('skills.audit.read'), skillCtrl.getExecution);
  app.post('/api/v1/skill-executions/:id/approve', requireAuth, requirePermission('skills.approve'), skillCtrl.approveExecution);
  app.post('/api/v1/skill-executions/:id/reject', requireAuth, requirePermission('skills.approve'), skillCtrl.rejectExecution);

  // Automations
  app.get('/api/v1/automations', requireAuth, requirePermission('automation.read'), autoCtrl.listAutomations);
  app.post('/api/v1/automations', requireAuth, requirePermission('automation.create'), autoCtrl.createAutomation);
  app.get('/api/v1/automations/:id', requireAuth, requirePermission('automation.read'), autoCtrl.getAutomation);
  app.patch('/api/v1/automations/:id', requireAuth, requirePermission('automation.update'), autoCtrl.updateAutomation);
  app.delete('/api/v1/automations/:id', requireAuth, requirePermission('automation.update'), autoCtrl.deleteAutomation);
  app.get('/api/v1/automations/:id/versions', requireAuth, requirePermission('automation.read'), autoCtrl.listVersions);
  app.post('/api/v1/automations/:id/versions', requireAuth, requirePermission('automation.create'), autoCtrl.createVersion);
  app.post('/api/v1/automations/:id/publish', requireAuth, requirePermission('automation.publish'), autoCtrl.publishVersion);
  app.get('/api/v1/automations/:id/executions', requireAuth, requirePermission('automation.read'), autoCtrl.listExecutions);

  // Reports

  // Notifications
  app.get('/api/v1/notifications', requireAuth, autoCtrl.listNotifications);
  app.post('/api/v1/notifications/:id/read', requireAuth, autoCtrl.markNotificationRead);

  // Automation triggers/events
  app.post('/api/v1/automation-events', requireAuth, autoCtrl.ingestEventEndpoint);
  app.get('/api/v1/automation-triggers', requireAuth, requirePermission('automation.read'), autoCtrl.listTriggerTypes);
  app.post('/api/v1/automation-triggers/dry-run', requireAuth, requirePermission('automation.read'), autoCtrl.dryRunTrigger);

  app.post('/api/v1/automations/:id/dry-run', requireAuth, requirePermission('automation.read'), autoCtrl.dryRunExecution);

  app.post('/api/v1/automations/:id/submit-approval', requireAuth, requirePermission('automation.approve'), autoCtrl.submitAutomationApproval);
  app.post('/api/v1/automations/:id/approve', requireAuth, requirePermission('automation.approve'), autoCtrl.approveAutomation);
  app.post('/api/v1/automations/:id/reject', requireAuth, requirePermission('automation.approve'), autoCtrl.rejectAutomation);
  app.get('/api/v1/automations/pending-approvals', requireAuth, requirePermission('automation.approve'), autoCtrl.listPendingApprovals);

  // Reports
  app.get('/api/v1/reports/overview', requireAuth, requirePermission('report.read'), reportCtrl.overview);
  app.get('/api/v1/reports/attention', requireAuth, requirePermission('report.attention.read'), reportCtrl.attention);
  app.get('/api/v1/reports/operators', requireAuth, requirePermission('report.operators.read'), reportCtrl.operators);
  app.get('/api/v1/reports/teams', requireAuth, requirePermission('report.teams.read'), reportCtrl.teams);
  app.get('/api/v1/reports/automations', requireAuth, requirePermission('report.automations.read'), reportCtrl.automations);
  app.get('/api/v1/reports/ai', requireAuth, requirePermission('report.ai.read'), reportCtrl.ai);
  app.get('/api/v1/reports/commercial', requireAuth, requirePermission('report.commercial.read'), reportCtrl.commercial);
  app.get('/api/v1/reports/trends', requireAuth, requirePermission('report.read'), reportCtrl.trends);
  app.get('/api/v1/reports', requireAuth, requirePermission('report.read'), autoCtrl.listReports);
  app.post('/api/v1/reports', requireAuth, requirePermission('report.read'), autoCtrl.createReport);

  // Exports
  app.post('/api/v1/reports/export', requireAuth, requirePermission('report.export'), exportCtrl.exportReport);

  app.use(errorHandler);
  return app;
}
