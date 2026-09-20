# Auditoria Prévia — Habilitações Comerciais e Entitlements (Fase 1.3.8)

**Data:** 2026-09-20  
**Contexto:** Fase 1.3.8 — Habilitações Comerciais do Produtor + Produtos Contratados + Limites + Vigência de Acesso  
**Status:** APROVADO PARA IMPLEMENTAÇÃO  

---

## 1. Objetivo da Auditoria (Passo Zero Obrigatório)

A auditoria prévia tem como diretriz máxima assegurar que **não sejam criadas tabelas, colunas, contadores ou estruturas redundantes** no repositório `MASTER`. 

Antes de introduzir qualquer modelo ou serviço de habilitação comercial (*Entitlements*), inspecionamos integralmente os módulos legados, os esquemas do Prisma, o RBAC e as Fases Comerciais precedentes (1.3.1 a 1.3.7).

---

## 2. Inventário de Recursos Existentes no Repositório

### 2.1. Controle de Acesso de Usuários (RBAC — Fase 1.1)
- **Modelos:** `User`, `Role`, `Permission`, `UserRole`, `RolePermission`, `ProducerMembership`.
- **Finalidade:** Governa **o que o usuário físico/operador pode realizar** no sistema (ex.: `comercial.propostas.criar`, `eventos.editar`, `financeiro.visualizar_extrato`).
- **Constatação:** O RBAC **não** possui nem deve possuir conhecimento de limites contratuais de produtores (ex.: quantidade de eventos ativos, cota de disparos de e-mail). RBAC trata de autorização de identidade e perfil.

### 2.2. Contratos Comerciais (Fase 1.3.6)
- **Modelos:** `CommercialContract`, `CommercialContractVersion`, `ContractCommercialTerm`, `ContractParty`, `ContractAmendment`, `ContractRenewal`, `SignatureEnvelope`.
- **Finalidade:** Registra o instrumento jurídico vinculante entre a DiskIngressos e o Produtor, contendo datas de vigência (`effectiveFrom`, `effectiveUntil`), termos financeiros e as ofertas acordadas.
- **Constatação:** O contrato comercial é a **origem oficial e jurídica** dos direitos do produtor. No entanto, o módulo de contratos **não deve** ser consultado em tempo real em todas as requisições de API de eventos, bordero ou portaria, pois isso geraria alto acoplamento e consultas contratuais complexas. Os direitos precisam ser materializados no domínio de **Entitlements**.

### 2.3. Catálogo Comercial (Fase 1.3.7)
- **Modelos:** `CommercialOffering`, `CommercialOfferingVersion`, `CommercialOfferingComposition`, `CommercialFeature`, `OfferingFeature`, `CommercialDefaultTerm`.
- **Finalidade:** Fonte única oficial de ofertas B2B (`PLAN`, `PACKAGE`, `SERVICE`, `MODULE`, `ADD_ON`) e suas capacidades técnicas (`CommercialFeature` / `OfferingFeature`).
- **Constatação:** `CommercialFeature` já define os códigos canônicos dos recursos técnicos (ex.: `feature.access.offline_validator`, `feature.marketing.boost`) com valores de limites (`limitValue`, `limitUnit`). Esses modelos servirão diretamente de insumo para o provisionamento dos entitlements, eliminando qualquer duplicação de conceitos!

### 2.4. Produtores e Organizações (Fase 1.3.3)
- **Modelos:** `Producer`, `ProducerContact`, `ProducerDocument`, `LeadProducerProfile`.
- **Finalidade:** Entidade raiz que representa a organização produtora de eventos que assina os contratos comerciais e recebe os direitos operacionais.

---

## 3. Delimitação Estrita de Fronteiras

```text
+-------------------------------------------------------------------------------+
|                            REQUISIÇÃO DA API                                  |
+-------------------------------------------------------------------------------+
                                        |
                   1. Autenticação & Escopo (Auth & Scope)
                                        v
+-------------------------------------------------------------------------------+
| RBAC (Fase 1.1)                                                               |
| "O usuário Vinicius tem permissão para acionar a validação offline?"          |
| -> SIM / NÃO (permissão de perfil)                                            |
+-------------------------------------------------------------------------------+
                                        | (Se permitido no RBAC)
                                        v
+-------------------------------------------------------------------------------+
| ENTITLEMENTS (Fase 1.3.8)                                                     |
| "A organização 'Produtora XYZ' contratou o recurso 'Validação Offline'        |
|  e o contrato está em período de vigência e dentro do limite de 10 coletores?"|
| -> SIM / NÃO (capacidade contratada & cota vigente)                           |
+-------------------------------------------------------------------------------+
                                        | (Se habilitado e dentro do limite)
                                        v
+-------------------------------------------------------------------------------+
| EXECUÇÃO DO CASO DE USO / DOMÍNIO OPERACIONAL                                  |
+-------------------------------------------------------------------------------+
```

---

## 4. Decisões Arquiteturais da Fase 1.3.8

1. **Domínio Transversal:**
   - O módulo de Entitlements residirá em `backend/src/modules/entitlements/`, mantendo-se **externo** a `commercial/`, pois é consumido transversalmente por todas as áreas (Operações, Ticketeria, Portaria, Marketing, Financeiro).

2. **Rastreabilidade da Origem:**
   - Cada habilitação (`ProducerEntitlement`) aponta de forma transparente para sua causa-raiz:
     - `CONTRACT`: Gerado por um contrato ativo (`CommercialContract`).
     - `LEGACY_MIGRATION`: Atribuído a produtores preexistentes na migração para garantir continuidade operacional sem criar contratos falsos.
     - `ADMIN_OVERRIDE`: Concessão ou corte emergencial devidamente auditado com justificativa e data de expiração.

3. **Modos de Enforcement Suportados:**
   - `DISABLED`: Registro desativado para desenvolvimento.
   - `OBSERVE`: Registra métricas de uso sem efetuar bloqueios (modo seguro de implantação gradual).
   - `WARN`: Permite execução com cabeçalho/aviso de atenção.
   - `ENFORCE`: Bloqueia requisições excedentes ou não contratadas com código `403 FORBIDDEN` e payload estruturado (`ENTITLEMENT_REQUIRED` / `ENTITLEMENT_LIMIT_EXCEEDED`).

4. **Provedor de Consumo (`UsageProvider`):**
   - Não criaremos contadores artificiais para dados que já são calculáveis via banco de dados (ex.: contagem de eventos ativos do produtor). O `UsageProvider` calculará o consumo dinamicamente sob demanda ou em cache de curta duração.

---

## 5. Conclusão do Passo Zero

Nenhuma estrutura duplicada foi encontrada. Os modelos de Catálogo (`CommercialFeature`) e Contratos (`CommercialContract`) da Fase 1.3.7 e 1.3.6 estão prontos para alimentar de forma limpa e determinística o motor de `ProducerEntitlement`.

Aprovado para início imediato da modelagem e implementação dos serviços.
