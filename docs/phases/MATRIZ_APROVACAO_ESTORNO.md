# Matriz de Alçadas de Aprovação & Segregação de Função (Maker-Checker)

**Fase:** 1.3.11.1.4.3 — Recuperação Completa de ESTORNO  
**Data:** 20/09/2026  
**Status:** 100% Homologado e Sincronizado  
**Localização:** `docs/phases/MATRIZ_APROVACAO_ESTORNO.md`

---

## 1. Faixas de Valor e Alçadas Requeridas

Seguindo rigorosamente o modelo comprovado no SafeSaff (`requiredApprovalLevels`):

| Faixa de Valor (R$) | Valor em Centavos | Nível de Risco | Alçadas Requeridas | Cargos / Perfis Habilitados |
| :--- | :--- | :---: | :---: | :--- |
| **Até R$ 999,99** | < 100.000 centavos | `LOW` | **1 Alçada** | Supervisor Operacional, Supervisor Financeiro |
| **R$ 1.000,00 a R$ 4.999,99** | 100.000 a 499.999 | `HIGH` | **2 Alçadas** | Alçada 1: Supervisor + Alçada 2: Gerente Financeiro |
| **A partir de R$ 5.000,00** | >= 500.000 centavos | `CRITICAL` | **3 Alçadas** | Alçada 1: Supervisor + Alçada 2: Gerente Financeiro + Alçada 3: Diretoria Executiva / C-Level |

*Nota: Estornos parciais com desmembramento de itens recebem classificação mínima de risco `MEDIUM` para mitigar pulverização indevida.*

---

## 2. Princípio de Segregação de Função (Maker-Checker)

- **Regra Fundamental:**
  $$\text{Solicitante} \neq \text{Aprovador em qualquer nível}$$
- **Implementação no Backend:**
  ```typescript
  if (refund.requestedByUserId === user.id) {
    throw new ForbiddenError(
      'Violação de Segregação de Função: O solicitante do estorno não pode aprovar a própria solicitação.'
    );
  }
  ```
- **Comportamento no Frontend:**
  - O botão "Aprovar Alçada" fica desabilitado para o usuário que abriu o estorno, exibindo o selo de aviso: *"Você é o solicitante deste estorno. Conforme a regra de Maker-Checker, a aprovação deve ser realizada por outro usuário qualificado."*
- **Assinatura Múltipla:**
  - O mesmo aprovador não pode aprovar mais de um nível na mesma solicitação; cada nível exige um usuário distinto para garantir duplo controle em valores expressivos.
