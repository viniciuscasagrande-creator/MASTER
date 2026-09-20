# Matriz de Domínios e Fronteiras Arquiteturais — Fase 1.3.5

## 1. Princípio Arquitetural Fundamental

```text
OPORTUNIDADE (1.3.4)
       ↓
NEGOCIAÇÃO COMERCIAL
       ↓
PROPOSTA COMERCIAL (1.3.5)
       ↓
ACEITE COMERCIAL (1.3.5)
       ↓
CONTRATO FORMAL (Fase posterior 1.3.6)
       ↓
OPERAÇÃO / FINANCEIRO (Eventos na grade, Borderô, Repasses, Recebíveis)
```

> **Regra Pétrea**: Proposta comercial não é contrato. Proposta aprovada não é cobrança. Aceite comercial não cria repasse, recebível ou evento automaticamente.

---

## 2. Matriz Comparativa de Domínios

| Dimensão / Entidade | Oportunidade (1.3.4) | Proposta Comercial (1.3.5) | Aceite Comercial (1.3.5) | Contrato Formal (1.3.6) | Operação / Financeiro |
|---|---|---|---|---|---|
| **Papel do Produtor** | Lead qualificado em negociação | Cliente B2B destinatário da oferta | Partícipe que concordou com as condições | Contratante formal com deveres jurídicos | Produtor com saldo e vendas em tempo real |
| **Objeto Principal** | Demanda, funil e estágio de vendas | Pacote de serviços, taxas e vigência | Manifestação de concordância comercial | Instrumento jurídico com penalidades | Sessões, lotes de ingressos e borderôs |
| **Natureza Jurídica** | Prospectiva / Pré-negocial | Vinculante comercialmente na vigência | Intenção formalizada de contratação | Título executivo extrajudicial | Fato gerador contábil e fiscal |
| **Impacto no Módulo de Eventos** | Nenhum | Nenhum (apenas referências de dimensionamento) | Nenhum (nenhuma sessão criada na grade) | Pré-requisito para publicação de eventos | Execução do check-in, portaria e bilheteria |
| **Impacto no Módulo Financeiro** | Nenhum | Nenhum | Nenhum (sem criação de repasses ou cobranças) | Definição de contas bancárias e prazos de repasse | Emissão de faturas, retenção de impostos e D+1/D+30 |
| **Versionamento** | Histórico de estágios | Imutável (SHA-256 canônico por versão) | Vinculado estritamente ao hash da versão aceita | Aditivos contratuais com minutas | Log contábil imutável |

---

## 3. Matriz de Ações Permitidas vs Proibidas na Fase 1.3.5

| Ação | Status | Justificativa Arquitetural |
|---|:---:|---|
| Criar proposta comercial vinculada a uma oportunidade | ✅ **PERMITIDO** | Oportunidade é o pipeline de negociação natural que originou a proposta. |
| Cadastrar termos comissionados (%), valores fixos ou locações | ✅ **PERMITIDO** | Modela os serviços DiskIngressos formalizados ao produtor. |
| Associar eventos como estimativa de volume (`estimatedGrossRevenue`) | ✅ **PERMITIDO** | Dimensionamento comercial de receita para subsidiar taxas e descontos. |
| Criar automaticamente evento na grade operacional ao aceitar proposta | ❌ **PROIBIDO** | Eventos operacionais só podem ser criados e publicados após celebração do contrato formal. |
| Gerar recebível, repasse ou lançamento em borderô financeiro | ❌ **PROIBIDO** | A proposta aceita não constitui fato financeiro realizável sem a formalização contratual. |
| Sobrescrever uma versão enviada ou aprovada (`contentHash` já calculado) | ❌ **PROIBIDO** | Cada versão é imutável. Ajustes exigem criação atômica de nova versão (V2, V3...). |
| Usuário criador aprovar a própria proposta que exige alçada | ❌ **PROIBIDO** | Princípio de Maker-Checker: governança comercial contra conflito de interesses. |
| Aprovação da versão V1 autorizar automaticamente versão V2 alterada | ❌ **PROIBIDO** | A alçada é vinculada ao `contentHash` canônico. Nova versão exige nova validação. |
| Exibir compradores finais, participantes ou ingressos B2C no Comercial | ❌ **PROIBIDO** | O Comercial da DiskIngressos é estritamente B2B (relação empresa-produtor). |
| Uso do termo proibido "360" | ❌ **PROIBIDO** | Termo banido das diretrizes arquiteturais da plataforma DiskIngressos. |

---

## 4. Governança de Alçadas (Maker-Checker & Integridade)

### 4.1 Regras de Disparo de Alçada
A submissão para a Diretoria Comercial é obrigatória quando:
1. A taxa de plataforma (`PLATFORM_COMMISSION`) for negociada abaixo de **7,00%**.
2. Houver split de taxa de conveniência configurado entre produtor e comprador.
3. Condições excepcionais de garantia mínima forem concedidas.

### 4.2 Restrições Rígidas de Segurança
```text
[Criador: Usuário A] ── Cria Proposta (Taxa 5,5%) ──► [Versão V1 (Hash: abc123...)]
                                                                  │
                                                        Pede Aprovação Alçada
                                                                  │
                                                                  ▼
[Usuário A tenta Aprovar] ──────────────────────────► ⛔ ERRO 403: Maker-Checker Bloqueado
                                                        "Criador não pode aprovar sua proposta"
                                                                  │
[Diretor: Usuário B] ───── Avalia e Aprova ─────────► ✅ OK: Alçada Vinculada ao Hash abc123...
                                                                  │
                                                        Usuário A altera termo
                                                                  │
                                                                  ▼
                                                      ⛔ Proibido sobrescrever V1
                                                      Cria-se Versão V2 (Hash: xyz789...)
                                                      Alçada da V1 NÃO autoriza a V2!
```

---

## 5. Isolamento Multi-Tenant

1. **Acesso do Produtor (`Role: PRODUTOR`)**:
   - Visualiza apenas propostas onde `proposal.producerId === user.producerId`.
   - Bloqueio estrito de visualização de propostas de outros produtores.
   - Bloqueio de submissão ou aprovação de alçada interna.

2. **Acesso Comercial Interno (`Role: COMERCIAL`, `Role: DIRETOR`, `Role: ADMIN`)**:
   - Visualiza propostas da sua carteira ou gerais da empresa com controle RBAC granular.
   - Apenas usuários autorizados possuem a permissão `comercial.alçadas.aprovar`.
