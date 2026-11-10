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
import * as healthCtrl from './modules/health/health.controller';
import * as systemCtrl from './modules/system/system.controller';
import * as auditCtrl from './modules/audit/audit.controller';

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

  app.use(errorHandler);
  return app;
}
