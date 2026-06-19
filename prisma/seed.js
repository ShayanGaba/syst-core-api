const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Purging old database records...');
  await prisma.systemConfig.deleteMany({});
  await prisma.systemLog.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.tenant.deleteMany({});

  console.log('Provisioning core tenants...');
  const alpha = await prisma.tenant.create({ data: { name: 'company-alpha' } });
  const beta = await prisma.tenant.create({ data: { name: 'company-beta' } });

  console.log('Injecting user authentication accounts...');
  await prisma.user.create({
    data: { username: 'shayan', password: 'password123', role: 'Admin', tenantId: alpha.id }
  });
  await prisma.user.create({
    data: { username: 'user2', password: 'password456', role: 'User', tenantId: beta.id }
  });

  console.log('Initializing global infrastructure state...');
  await prisma.systemConfig.create({
    data: { id: 'global_config', systemLockActive: false }
  });

  console.log('SUCCESS: Database seeding executed successfully with pristine records!');
}

main()
  .catch((e) => {
    console.error('Seeding failed with error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });