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
  { key: 'system.read', name: 'Read system settings', module: 'system' },
  { key: 'system.update', name: 'Update system settings', module: 'system' },
  { key: 'audit.read', name: 'Read audit log', module: 'audit' },
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
