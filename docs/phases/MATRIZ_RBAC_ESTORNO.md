# Matriz de Controle de Acesso Baseado em Papéis (RBAC) — Estorno

**Fase:** 1.3.11.1.4.3 — Recuperação Completa de ESTORNO  
**Data:** 20/09/2026  
**Status:** 100% Homologado e Sincronizado  
**Localização:** `docs/phases/MATRIZ_RBAC_ESTORNO.md`

---

## 1. Permissões Formais do Domínio

As seguintes permissões compõem o controle de acesso ao módulo de estornos no Disk Interno:

| Código da Permissão | Nome Amigável | Descrição |
| :--- | :--- | :--- |
| `estorno.solicitacao.visualizar` | Visualizar Solicitações de Estorno | Permite consultar listagens, métricas e dossiês de estornos |
| `estorno.solicitacao.criar` | Criar Solicitação de Estorno | Permite abrir novas solicitações parciais ou totais |
| `estorno.solicitacao.aprovar` | Aprovar/Recusar Alçada de Estorno | Permite emitir parecer formal de alçada (sujeito a Maker-Checker) |
| `estorno.solicitacao.executar` | Executar Estorno no Gateway | Permite disparar o estorno financeiro no provedor bancário |
| `estorno.chargeback.gerenciar` | Gerenciar Chargebacks | Permite acessar o painel de contestação e regras antifraude |

---

## 2. Matriz de Perfis × Permissões

| Perfil / Papel | Visualizar | Criar | Aprovar / Recusar | Executar Gateway | Disputas |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Atendente SAC** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Supervisor SAC** | ✅ | ✅ | ✅ (Alçada 1, se não for o solicitante) | ❌ | ❌ |
| **Supervisor Financeiro** | ✅ | ✅ | ✅ (Alçada 1 e 2, se não for solicitante) | ✅ | ✅ |
| **Gerente Financeiro** | ✅ | ✅ | ✅ (Alçada 1 e 2, se não for solicitante) | ✅ | ✅ |
| **Diretoria Executiva / C-Level** | ✅ | ❌ | ✅ (Alçada 3, se não for solicitante) | ✅ | ✅ |
| **Produtor Musical (Tenant)** | ✅ (Apenas seus eventos) | ❌ | ❌ | ❌ | ❌ |
| **Administrador Geral** | ✅ | ✅ | ✅ (Sujeito a Maker-Checker) | ✅ | ✅ |
