import 'dotenv/config';
import { prisma } from './lib/prisma';
import { auth } from './lib/auth';

const permissions = [
  { key: 'users.read', name: 'Read users', module: 'users' },
  { key: 'users.create', name: 'Create users', module: 'users' },
  { key: 'users.update', name: 'Update users', module: 'users' },
  { key: 'roles.read', name: 'Read roles', module: 'roles' },
  { key: 'permissions.read', name: 'Read permissions', module: 'permissions' },
  { key: 'teams.read', name: 'Read teams', module: 'teams' },
  { key: 'teams.create', name: 'Create teams', module: 'teams' },
  { key: 'teams.update', name: 'Update teams', module: 'teams' },
  { key: 'teams.manage', name: 'Manage teams', module: 'teams' },
  { key: 'system.read', name: 'Read system settings', module: 'system' },
  { key: 'system.update', name: 'Update system settings', module: 'system' },
  { key: 'audit.read', name: 'Read audit log', module: 'audit' },
  { key: 'crm.clients.read', name: 'Read clients', module: 'crm' },
  { key: 'crm.clients.create', name: 'Create clients', module: 'crm' },
  { key: 'crm.clients.update', name: 'Update clients', module: 'crm' },
  { key: 'crm.clients.delete', name: 'Delete clients', module: 'crm' },
  { key: 'crm.contacts.read', name: 'Read contacts', module: 'crm' },
  { key: 'crm.contacts.manage', name: 'Manage contacts', module: 'crm' },
  { key: 'operators.read', name: 'Read operators', module: 'operators' },
  { key: 'operators.manage', name: 'Manage operators', module: 'operators' },
  { key: 'conversations.read', name: 'Read conversations', module: 'conversations' },
  { key: 'conversations.assign', name: 'Assign conversations', module: 'conversations' },
  { key: 'conversations.manage', name: 'Manage conversations', module: 'conversations' },
  { key: 'metrics.read', name: 'Read metrics', module: 'metrics' },
  { key: 'metrics.team', name: 'Read team metrics', module: 'metrics' },
  { key: 'metrics.global', name: 'Read global metrics', module: 'metrics' },
  { key: 'segments.read', name: 'Read segments', module: 'segments' },
  { key: 'segments.manage', name: 'Manage segments', module: 'segments' },
  { key: 'consents.manage', name: 'Manage consents', module: 'consents' },
  { key: 'whatsapp.groups.manage', name: 'Manage WhatsApp groups', module: 'whatsapp' },
  { key: 'chatwoot.teams.manage', name: 'Manage Chatwoot teams', module: 'chatwoot' },
  { key: 'ai.providers.manage', name: 'Manage AI providers', module: 'ai' },
  { key: 'ai.assistants.manage', name: 'Manage AI assistants', module: 'ai' },
  { key: 'ai.execute', name: 'Execute AI', module: 'ai' },
  { key: 'ai.usage.read', name: 'Read AI usage', module: 'ai' },
  { key: 'ai.audit.read', name: 'Read AI audit', module: 'ai' },
  { key: 'ai.audit.manage', name: 'Manage AI audit', module: 'ai' },
  { key: 'ai.citations.read', name: 'Read AI citations', module: 'ai' },
  { key: 'ai.feedback.read', name: 'Read AI feedback', module: 'ai' },
  { key: 'ai.feedback.manage', name: 'Manage AI feedback', module: 'ai' },
  { key: 'knowledge.collections.read', name: 'Read knowledge collections', module: 'knowledge' },
  { key: 'knowledge.collections.manage', name: 'Manage knowledge collections', module: 'knowledge' },
  { key: 'knowledge.documents.read', name: 'Read knowledge documents', module: 'knowledge' },
  { key: 'knowledge.documents.upload', name: 'Upload knowledge documents', module: 'knowledge' },
  { key: 'knowledge.documents.delete', name: 'Delete knowledge documents', module: 'knowledge' },
  { key: 'knowledge.documents.process', name: 'Process knowledge documents', module: 'knowledge' },
  { key: 'knowledge.embeddings.manage', name: 'Manage embeddings', module: 'knowledge' },
  { key: 'knowledge.embeddings.read', name: 'Read embeddings', module: 'knowledge' },
  { key: 'knowledge.skills.read', name: 'Read skills', module: 'knowledge' },
  { key: 'knowledge.skills.manage', name: 'Manage skills', module: 'knowledge' },
  { key: 'knowledge.skills.execute', name: 'Execute skills', module: 'knowledge' },
  { key: 'skills.read', name: 'Read skills', module: 'skills' },
  { key: 'skills.create', name: 'Create skills', module: 'skills' },
  { key: 'skills.update', name: 'Update skills', module: 'skills' },
  { key: 'skills.publish', name: 'Publish skills', module: 'skills' },
  { key: 'skills.execute', name: 'Execute skills', module: 'skills' },
  { key: 'skills.manage', name: 'Manage skills', module: 'skills' },
  { key: 'skills.approve', name: 'Approve skill executions', module: 'skills' },
  { key: 'skills.audit.read', name: 'Read skill audit', module: 'skills' },
  { key: 'integrations.read', name: 'Read integrations', module: 'integrations' },
  { key: 'integrations.manage', name: 'Manage integrations', module: 'integrations' },
];

async function main() {
  // permissions
  for (const p of permissions) {
    await prisma.permission.upsert({ where: { key: p.key }, update: {}, create: p });
  }
  // roles
  const adminRole = await prisma.role.upsert({ where: { key: 'admin' }, update: {}, create: { key: 'admin', name: 'Administrator', isSystem: true } });
  const operatorRole = await prisma.role.upsert({ where: { key: 'operator' }, update: {}, create: { key: 'operator', name: 'Operator', isSystem: true } });
  const viewerRole = await prisma.role.upsert({ where: { key: 'viewer' }, update: {}, create: { key: 'viewer', name: 'Viewer', isSystem: true } });

  const allPerms = await prisma.permission.findMany();
  for (const perm of allPerms) {
    await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } }, update: {}, create: { roleId: adminRole.id, permissionId: perm.id } });
  }
  // operator gets read perms
  const readPerms = allPerms.filter((p) => p.key.endsWith('.read'));
  for (const perm of readPerms) {
    await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: operatorRole.id, permissionId: perm.id } }, update: {}, create: { roleId: operatorRole.id, permissionId: perm.id } });
  }
  for (const perm of readPerms) {
    await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: viewerRole.id, permissionId: perm.id } }, update: {}, create: { roleId: viewerRole.id, permissionId: perm.id } });
  }

  // bootstrap admin
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const name = process.env.BOOTSTRAP_ADMIN_NAME || 'Administrator';
  if (email && password) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      const result = await auth.api.signUpEmail({ body: { email, password, name } });
      const userId = (result as any).user.id;
      await prisma.user.update({ where: { id: userId }, data: { isSuperAdmin: true, isActive: true } });
      await prisma.userRole.create({ data: { userId, roleId: adminRole.id } }).catch(() => {});
      console.log('Bootstrap admin created:', email);
    } else {
      console.log('Admin already exists:', email);
    }
  } else {
    console.log('No bootstrap admin env provided; skipping.');
  }

  // integration placeholders
  await prisma.integration.upsert({ where: { key: 'waha' }, update: {}, create: { key: 'waha', name: 'WAHA', type: 'whatsapp', isActive: false } });
  await prisma.integration.upsert({ where: { key: 'chatwoot' }, update: {}, create: { key: 'chatwoot', name: 'Chatwoot', type: 'chat', isActive: false } });

  // system settings
  await prisma.systemSetting.upsert({ where: { key: 'platform.name' }, update: {}, create: { key: 'platform.name', value: 'Plataforma Integral de Atencion Comercial' } });
  await prisma.systemSetting.upsert({ where: { key: 'platform.phase' }, update: {}, create: { key: 'platform.phase', value: 'F0' } });

  console.log('Seed complete.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
