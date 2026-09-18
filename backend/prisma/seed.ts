import { prisma, memoryDb } from '../src/core/database/prisma';
import { hashPassword } from '../src/core/security/password';

export async function runSeed() {
  console.log('[Seed] Iniciando semeadura do banco central de identidade...');

  // Reset store
  memoryDb.seedDefaults();

  // Senha administrativa gerada com Argon2id
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'DiskAdmin@2026!';
  const adminHash = await hashPassword(adminPassword);

  const defaultUsers = [
    // 1. Super Administrador (isSuperAdmin = true, vê tudo)
    {
      id: 'usr_superadmin',
      name: 'Vinicius Casagrande (Admin Geral)',
      email: 'admin@diskingressos.com.br',
      passwordHash: adminHash,
      status: 'ACTIVE',
      isSuperAdmin: true,
      twoFactorEnabled: true,
      twoFactorSecret: 'mock_2fa_secret_key'
    },
    // 2. Financeiro Master (Maria) - Perfil FINANCEIRO com concessão direta de aprovação
    {
      id: 'usr_fin_maria',
      name: 'Maria Oliveira (Diretora Financeira)',
      email: 'maria.financeiro@diskingressos.com.br',
      passwordHash: adminHash,
      status: 'ACTIVE',
      isSuperAdmin: false,
      twoFactorEnabled: false
    },
    // 3. Financeiro Operacional (Carlos) - Perfil FINANCEIRO sem permissão de aprovação
    {
      id: 'usr_fin_carlos',
      name: 'Carlos Lima (Financeiro Operacional)',
      email: 'carlos.financeiro@diskingressos.com.br',
      passwordHash: adminHash,
      status: 'ACTIVE',
      isSuperAdmin: false,
      twoFactorEnabled: false
    },
    // 4. Marketing (Lucas)
    {
      id: 'usr_mkt_lucas',
      name: 'Lucas Mendes (Growth & Marketing)',
      email: 'lucas.marketing@diskingressos.com.br',
      passwordHash: adminHash,
      status: 'ACTIVE',
      isSuperAdmin: false,
      twoFactorEnabled: false
    },
    // 5. SAC (Ana)
    {
      id: 'usr_sac_ana',
      name: 'Ana Paula Santos (Atendimento SAC)',
      email: 'ana.sac@diskingressos.com.br',
      passwordHash: adminHash,
      status: 'ACTIVE',
      isSuperAdmin: false,
      twoFactorEnabled: false
    },
    // 6. Produtor A (Roberto - Opus Entretenimento) - Escopo PRODUCER prd_100
    {
      id: 'usr_prod_opus',
      name: 'Roberto Viana (Produtor Opus)',
      email: 'roberto@opus.com.br',
      passwordHash: adminHash,
      status: 'ACTIVE',
      isSuperAdmin: false,
      twoFactorEnabled: false
    },
    // 7. Produtor B (Renata - Live Nation) - Escopo PRODUCER prd_200
    {
      id: 'usr_prod_livenation',
      name: 'Renata Castro (Produtora Live Nation)',
      email: 'renata@livenation.com.br',
      passwordHash: adminHash,
      status: 'ACTIVE',
      isSuperAdmin: false,
      twoFactorEnabled: false
    },
    // 8. Usuário Bloqueado
    {
      id: 'usr_blocked',
      name: 'Operador Suspenso Por Segurança',
      email: 'bloqueado@diskingressos.com.br',
      passwordHash: adminHash,
      status: 'BLOCKED',
      isSuperAdmin: false,
      twoFactorEnabled: false
    }
  ];

  for (const u of defaultUsers) {
    await prisma.user.create({ data: u });
  }

  // Vincular papéis aos usuários
  const roleAdmin = await prisma.role.findUnique({ where: { code: 'ADMINISTRADOR_GERAL' } });
  const roleFin = await prisma.role.findUnique({ where: { code: 'FINANCEIRO' } });
  const roleMkt = await prisma.role.findUnique({ where: { code: 'MARKETING' } });
  const roleSac = await prisma.role.findUnique({ where: { code: 'ATENDIMENTO_SAC' } });
  const roleProd = await prisma.role.findUnique({ where: { code: 'PRODUTOR' } });

  if (roleAdmin) await prisma.userRole.create({ data: { userId: 'usr_superadmin', roleId: roleAdmin.id } });
  if (roleFin) {
    await prisma.userRole.create({ data: { userId: 'usr_fin_maria', roleId: roleFin.id } });
    await prisma.userRole.create({ data: { userId: 'usr_fin_carlos', roleId: roleFin.id } });
  }
  if (roleMkt) await prisma.userRole.create({ data: { userId: 'usr_mkt_lucas', roleId: roleMkt.id } });
  if (roleSac) await prisma.userRole.create({ data: { userId: 'usr_sac_ana', roleId: roleSac.id } });
  if (roleProd) {
    await prisma.userRole.create({ data: { userId: 'usr_prod_opus', roleId: roleProd.id } });
    await prisma.userRole.create({ data: { userId: 'usr_prod_livenation', roleId: roleProd.id } });
  }

  // Maria recebe permissão direta de aprovar transferência
  const permAprovar = await prisma.permission.findUnique({ where: { code: 'financeiro.transferencia.aprovar' } });
  if (permAprovar) {
    await prisma.userPermission.create({
      data: { userId: 'usr_fin_maria', permissionId: permAprovar.id, isGranted: true }
    });
  }

  // Produtor A (Opus) -> acesso a prd_100 e evt_1001
  await prisma.userProducerAccess.create({ data: { userId: 'usr_prod_opus', producerId: 'prd_100' } });
  await prisma.userEventAccess.create({ data: { userId: 'usr_prod_opus', eventId: 'evt_1001' } });

  // Produtor B (Live Nation) -> acesso a prd_200 e evt_2001
  await prisma.userProducerAccess.create({ data: { userId: 'usr_prod_livenation', producerId: 'prd_200' } });
  await prisma.userEventAccess.create({ data: { userId: 'usr_prod_livenation', eventId: 'evt_2001' } });

  console.log('[Seed] Semeadura finalizada com sucesso. Usuários, perfis, escopos e permissões configurados!');
}

if (process.argv[1]?.includes('seed.ts')) {
  runSeed().catch(console.error);
}
