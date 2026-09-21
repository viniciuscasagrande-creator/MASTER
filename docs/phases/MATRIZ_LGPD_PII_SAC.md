# MATRIZ LGPD & PROTEÇÃO DE DADOS PESSOAIS — SAC

**Fase:** 1.3.11.1.4.2 — Recuperação Completa do Atendimento SAC  
**Data:** 20/09/2026

---

## 1. Princípios de Minimização e Proteção no SAC

| Dado Sensível | Apresentação Padrão | Regra de Revelação | Auditoria |
| :--- | :--- | :--- | :--- |
| **CPF** | Mascarado: `***.***.***-42` | Apenas mediante clique explícito de operador autorizado | Registro imutável em `AuditLog` com IP e ator |
| **Telefone** | Mascarado: `(**) *****-1234` | Visível apenas na ficha detalhada | Não exposto em listagens públicas |
| **E-mail** | Mascarado parcial na busca pública: `jo***@email.com` | Integral na ficha do comprador para confirmação | Logs de auditoria |
| **Cartão de Crédito** | **NUNCA** armazenado integralmente | Apenas últimos 4 dígitos (`•••• 1234`) e bandeira | PAN e CVV são estritamente proibidos |

---

## 2. Proteção Anti-Enumeração

Consultas automatizadas ou sequenciais por CPF disparam bloqueio imediato com HTTP 429 (`Too Many Requests`) via `AntiEnumerationService` para evitar varredura da base de consumidores.
