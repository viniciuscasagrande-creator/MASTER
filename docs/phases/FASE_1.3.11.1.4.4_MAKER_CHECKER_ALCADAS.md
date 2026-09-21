# Governança Maker-Checker e Alçadas de Segurança
## Fase 1.3.11.1.4.4

### 1. Política de Segregação de Funções (Maker-Checker)
Para prevenir fraudes, desvios e erros materiais na movimentação de recursos financeiros, o Disk Interno aplica a segregação mandatória de papéis em todas as operações sensíveis:
- **Maker (Solicitante):** Cria a intenção de transferência entre eventos ou o agendamento de repasse bancário.
- **Checker (Aprovador):** Revisa, valida o saldo e os dados bancários e autoriza formalmente a execução.

### 2. Regra de Bloqueio de Auto-Aprovação
O sistema valida programaticamente no backend:
```typescript
if (record.requestedBy === approverName) {
  throw new ForbiddenError('Violação de Segregação de Função: O solicitante da operação não pode ser o aprovador.');
}
```
Essa restrição se aplica independentemente do cargo do usuário (mesmo Administradores Gerais não podem aprovar as próprias solicitações financeiras).

### 3. Alçadas de Segurança e Autenticação Step-Up
| Faixa de Valor | Alçada Mínima Exigida | Requisito de Segurança | Comportamento do Sistema |
|---|---|---|---|
| **Até R$ 50.000,00** | Operador Financeiro / Gerente | Sessão JWT Autenticada | Liquidação direta ou aprovação nível 1 |
| **Acima de R$ 50.000,00** | Diretoria Financeira / Admin Geral | Token Step-Up de Segurança | Entrada em `PENDING_APPROVAL`, exigência de reautenticação com token temporário de 5 minutos |

### 4. Rastreamento e Logs de Auditoria
Toda tentativa de auto-aprovação, emissão de Step-Up e autorização de alçada gera evento imutável no `AuditService` contendo:
- ID do usuário e papel RBAC
- Recurso afetado (`TRANSFER` ou `PAYOUT`)
- Montante financeiro e centros de custo envolvidos
- Timestamp UTC e código de autorização emitido.
