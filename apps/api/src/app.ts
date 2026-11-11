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
import * as knowCtrl from './modules/knowledge/knowledge.controller';
import * as skillCtrl from './modules/skills/skills.controller';
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
  app.post('/api/v1/knowledge/documents', requireAuth, requirePermission('knowledge.documents.upload'), knowCtrl.createDocument);
  app.get('/api/v1/knowledge/jobs', requireAuth, requirePermission('knowledge.documents.process'), knowCtrl.listJobs);
  app.post('/api/v1/knowledge/jobs', requireAuth, requirePermission('knowledge.documents.process'), knowCtrl.createJob);

  // Skills
  app.get('/api/v1/skills', requireAuth, requirePermission('knowledge.skills.read'), skillCtrl.listSkills);
  app.post('/api/v1/skills', requireAuth, requirePermission('knowledge.skills.manage'), skillCtrl.createSkill);
  app.post('/api/v1/skills/versions', requireAuth, requirePermission('knowledge.skills.manage'), skillCtrl.createSkillVersion);
  app.get('/api/v1/skills/:skillId/versions', requireAuth, requirePermission('knowledge.skills.read'), skillCtrl.listSkillVersions);

  app.use(errorHandler);
  return app;
}
