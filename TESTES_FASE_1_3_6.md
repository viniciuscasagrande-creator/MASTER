# Relatório de Testes Automatizados — Fase 1.3.6 (Contratos Comerciais B2B)

Este documento registra a execução dos testes automatizados de ponta a ponta que asseguram a integridade do ciclo de contratos, minutas, assinaturas, aditivos, vigência e renovação.

---

## 1. Sumário Executivo

* **Arquivo de Testes:** `backend/tests/commercial-contracts.test.ts`
* **Total de Testes Executados:** 14
* **Total de Testes Aprovados:** 14 (100%)
* **Falhas / Regressões:** 0
* **Tempo de Execução:** ~1.8s
* **Compilação TypeScript Backend:** 0 erros (`npx tsc --noEmit`)
* **Compilação TypeScript Frontend:** 0 erros (`npx tsc -b`)
* **Build de Produção Frontend:** Aprovado (`dist/assets/index-RLKV_l_I.js`, `dist/assets/index-6fm8rFdq.css`)

---

## 2. Detalhamento dos Cenários de Teste

| # | Cenário de Teste | Descrição da Validação | Resultado |
|---|---|---|---|
| **01** | Conversão de Proposta Comercial Aceita | Converte proposta aceita (`prop_301`) em contrato comercial preservando o hash da versão aceita (`sourceProposalContentHash`), com proteção contra duplicidade idempotente. | **PASSOU** |
| **02** | Criação Direta & Concorrência Otimista | Criação direta com termos e partes estruturadas; tentativa de atualização concorrente com versão defasada bloqueada com HTTP 409. | **PASSOU** |
| **03** | Alçada Interna & Maker-Checker | Bloqueia auto-aprovação pelo próprio criador da minuta (HTTP 403); aprovação liberada apenas para gestor qualificado. | **PASSOU** |
| **04** | Geração de Minuta com Checksum SHA-256 | Compilação da minuta contratual em HTML formal contendo cabeçalho legal, partes, cláusulas financeiras e cálculo determinístico do checksum. | **PASSOU** |
| **05** | Preparação & Despacho de Assinatura | Configuração de signatários (DiskIngressos e Produtor) e despacho de envelope para autoridade certificadora (Autentique). | **PASSOU** |
| **06** | Separação entre Assinatura e Vigência (`SIGNED != ACTIVE`) | Valida que a assinatura completa de um contrato com vigência futura coloca o contrato em `SIGNED` e NÃO em `ACTIVE`. | **PASSOU** |
| **07** | Autoridade do Webhook & Idempotência | Webhook da autoridade processa assinaturas com verificação de idempotência (eventos repetidos não alteram estados nem duplicam logs). | **PASSOU** |
| **08** | Imutabilidade de Contrato Assinado | Bloqueia qualquer edição direta em contratos com status `SIGNED` ou `ACTIVE`, exigindo aditivo formal. | **PASSOU** |
| **09** | Aditivos Contratuais (`ContractAmendment`) | Criação de aditivo formal com hash determinístico, aprovação por alçada e ativação com versionamento. | **PASSOU** |
| **10** | Provedor de Termos Efetivos (`ContractTermsProvider`) | Resolução temporal de condições para o Financeiro: antes do aditivo retorna termos base; após a data de vigência do aditivo retorna termos sobrepostos. | **PASSOU** |
| **11** | Renovações e Renegociações no CRM | Renovação simples estende `effectiveUntil`; renegociação abre uma nova `CommercialOpportunity` no CRM (Fase 1.3.4). | **PASSOU** |
| **12** | Suspensão, Reativação e Rescisão | Ciclo completo de congelamento contratual (suspensão), retorno operacional (reativação) e rescisão definitiva com auditoria. | **PASSOU** |
| **13** | Varredura Periódica de Vigência (Sweep) | Rotina que expira contratos ultrapassados e ativa contratos assinados cuja data `effectiveFrom` foi atingida. | **PASSOU** |
| **14** | Isolamento Multi-Tenant por Produtor | Garante que usuários externos com perfil de Produtor só visualizam seus próprios contratos autorizados. | **PASSOU** |

---

## 3. Comandos de Reprodução

Para executar todos os testes da esteira comercial:

```bash
# Testes Fase 1.3.6 (Contratos Comerciais)
cd backend && npx tsx tests/commercial-contracts.test.ts

# Testes Fase 1.3.5 (Propostas Comerciais)
cd backend && npx tsx tests/commercial-proposals.test.ts

# Testes Fase 1.3.3 / 1.3.4 (CRM & Pipeline)
cd backend && npx tsx tests/commercial-crm.test.ts

# Validação do Frontend
cd apps/web && npm run build
```
