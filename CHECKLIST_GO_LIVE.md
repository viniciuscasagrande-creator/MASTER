# CHECKLIST OFICIAL DE GO-LIVE — MÓDULO EVENTOS
**Disk Interno — Ticketeria e Operação de Eventos em Nível Nacional**

Este documento estabelece a lista obrigatória de verificação prévia à ativação em produção do módulo **EVENTOS (Fases 1.2.1 → 1.2.14)**.

---

## 1. Banco de Dados e Migrations
- [x] Schema do Prisma validado (`npx prisma validate`).
- [x] Cliente Prisma gerado (`npx prisma generate`).
- [x] Migrations idempotentes e compatíveis com rollback (sem `DROP TABLE` destrutivo).
- [x] Teste de migração executado em banco vazio e banco existente representativo.
- [x] Índices de alta performance criados para `producerId`, `eventId`, `sessionId`, `ticketId`, `status`.

## 2. Segurança e Controle de Acesso
- [x] Segredos removidos de repositórios Git (`DATABASE_URL`, `JWT_SECRET`, credenciais de storage).
- [x] Permissões granulares cadastradas para todas as fases (1.2.1 até 1.2.14).
- [x] Validação rigorosa de Data Scope no backend em todas as rotas (GLOBAL, PRODUCER, EVENT).
- [x] Proteção contra vazamento de stack trace em respostas de erro da API.
- [x] Headers de segurança e limites de payload/upload configurados.

## 3. Concorrência e Operação de Portaria
- [x] Bloqueio atômico de concorrência em validações de check-in (`validationRequestId`).
- [x] Rejeição de múltiplas entradas simultâneas com política `NO_REENTRY`.
- [x] Geração e verificação de tokens QR opacos em Base64URL assinados.
- [x] Pacotes offline SHA-256 e detecção de duplicidades na sincronização (`CONFLICT_DUPLICATE_OFFLINE`).
- [x] Revogação imediata de dispositivos coletores por perda ou extravio.

## 4. Ciclo de Vida do Evento
- [x] Prontidão automatizada de fechamento de sessão (checklist bloqueante).
- [x] Overrides supervisionados exigindo justificativa com no mínimo 10 caracteres.
- [x] Impedimento de finalização de evento enquanto houver sessões ativas.
- [x] Cálculo de impacto sistêmico e confirmação por digitação de `"CANCELAR"`.
- [x] Política de somente leitura (`ArchiveWritePolicy`) ativa para eventos arquivados.

## 5. Frontend e Experiência Operacional
- [x] 100% dos textos visíveis em Português do Brasil (`pt-BR`).
- [x] Ausência do termo "360" em toda a interface do sistema.
- [x] Tratamento completo de estados: *Carregamento (Skeleton)*, *Vazio*, *Erro*, *Sucesso* e *Sem Permissão*.
- [x] Design responsivo testado em resoluções mobile (360px-390px), tablet (768px-1024px) e desktop (1440px+).
- [x] Navegação da Sidebar retrátil por clique.

## 6. Observabilidade e Auditoria
- [x] Registro estruturado de eventos operacionais com `requestId` e `correlationId`.
- [x] Logs sem vazamento de dados sensíveis (sem tokens, senhas, CPFs ou QRs brutos).
- [x] Rotas de saúde técnicas segregadas: `/api/health/live` e `/api/health/ready`.
- [x] Timeline de auditoria imutável integrada ao `AuditService` e `OperationTimelineService`.

---

**Resultado da Avaliação Pré-Voo:**  
Status: **LIBERADO PARA GO-LIVE**  
Aprovado pela Engenharia de Software e Operações do Disk Interno.
