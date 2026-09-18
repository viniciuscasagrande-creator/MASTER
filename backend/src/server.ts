import express, { Request, Response } from 'express';
import cors from 'cors';
import { authMiddleware, requirePermission, requireScope, MOCK_USERS_DB } from './auth/authMiddleware';
import { PERMISSIONS_CATALOG } from './permissions/permissionsCatalog';
import { ROLES_CATALOG } from './roles/rolesCatalog';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Global Auth Context Middleware
app.use(authMiddleware);

// ==============================================================================
// 1. ROTAS DE AUTENTICACAO & SESSAO
// ==============================================================================

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password, twoFactorCode } = req.body;

  const user = MOCK_USERS_DB.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user) {
    res.status(401).json({ error: 'Credenciais inválidas.' });
    return;
  }

  if (user.status === 'blocked') {
    res.status(403).json({ error: 'Usuário bloqueado pela administração.' });
    return;
  }

  // 2FA Verification if enforced
  if (user.twoFactorEnforced && !twoFactorCode) {
    res.status(200).json({
      requireTwoFactor: true,
      userId: user.id,
      message: 'Código de autenticação de dois fatores (2FA) obrigatório.'
    });
    return;
  }

  res.json({
    token: `bearer-${user.id}`,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      roleSlug: user.roleSlug,
      roleName: user.roleName,
      organization: user.organization,
      isInternalStaff: user.isInternalStaff,
      scope: user.scope,
      permissions: user.permissions
    }
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }
  res.json({ user: req.user });
});

// ==============================================================================
// 2. CENTRAL DE USUARIOS, PERFIS E PERMISSOES (ADMIN)
// ==============================================================================

app.get('/api/admin/users', requirePermission('admin.usuarios.visualizar'), (req: Request, res: Response) => {
  res.json({ users: MOCK_USERS_DB });
});

app.get('/api/admin/roles', (req: Request, res: Response) => {
  res.json({ roles: ROLES_CATALOG });
});

app.get('/api/admin/permissions', (req: Request, res: Response) => {
  res.json({ permissions: PERMISSIONS_CATALOG });
});

// Update User Custom Permissions & Scope
app.put('/api/admin/users/:userId/permissions', requirePermission('admin.usuarios.gerenciar'), (req: Request, res: Response) => {
  const { userId } = req.params;
  const { permissions, scope, status } = req.body;

  const user = MOCK_USERS_DB.find(u => u.id === userId);
  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado.' });
    return;
  }

  if (permissions) user.permissions = permissions;
  if (scope) user.scope = scope;
  if (status) user.status = status;

  res.json({ success: true, user });
});

// ==============================================================================
// 3. EXEMPLOS DE PROTECAO DE API COM RBAC + ESCOPO DE DADOS
// ==============================================================================

// Apenas quem possui permissao 'financeiro.transferencia.aprovar' E pertence ao produtor
app.post(
  '/api/v1/finance/transfers',
  requirePermission('financeiro.transferencia.aprovar'),
  requireScope({ producerParam: 'producerId' }),
  (req: Request, res: Response) => {
    const { fromEventId, toEventId, amount, producerId } = req.body;
    res.json({
      success: true,
      message: `Transferência de R$ ${amount} aprovada com sucesso entre eventos do produtor ${producerId}.`,
      executedBy: req.user?.name
    });
  }
);

// Apenas quem possui permissao de estorno pode aprovar
app.post(
  '/api/v1/refunds/approve',
  requirePermission('estorno.solicitacao.aprovar'),
  (req: Request, res: Response) => {
    const { refundId } = req.body;
    res.json({
      success: true,
      message: `Estorno ${refundId} aprovado e cascata reversa executada.`,
      executedBy: req.user?.name
    });
  }
);

// Acesso a evento com checagem de escopo (Produtor A não pode ver evento de Produtor B)
app.get(
  '/api/v1/events/:eventId',
  requirePermission('eventos.evento.visualizar'),
  requireScope({ eventParam: 'eventId' }),
  (req: Request, res: Response) => {
    res.json({
      eventId: req.params.eventId,
      status: 'authorized',
      user: req.user?.name
    });
  }
);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    system: 'Disk Interno Modular Monolith Backend',
    version: '1.1.5',
    activeUsersCount: MOCK_USERS_DB.length,
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`[Disk Interno Backend] Rodando com RBAC e Escopo na porta ${port}`);
  });
}

export default app;
