# MATRIZ RBAC E DATA SCOPE DA NAVEGAÇÃO — FASE 1.3.11.1.1
## Controle de Acesso Baseado em Perfis e Delimitação de Escopo de Dados

**Data:** 20/09/2026  
**Status:** Homologada  

---

## 1. Perfis Oficiais do Disk Interno

1. `ADMIN_GERAL` (`admin_geral`): Acesso global irrestrito a todos os módulos, produtoras e eventos.
2. `ADMIN_OPERACIONAL` (`admin_operacional`): Operação de campo, bilheteria física e suporte a portas.
3. `FINANCEIRO` (`financeiro`): Gestão de fluxo de caixa, repasses, saldos e conciliação bancária.
4. `CONTABILIDADE` (`contabilidade`): Livro Diário, balancetes e DRE gerencial em tempo real.
5. `ATENDIMENTO_SAC` (`sac`): Central de Consulta, pedidos, histórico de compradores e reenvio de vouchers.
6. `ESTORNO` (`estorno`): Análise e aprovação de devoluções e contestações de cartão (chargebacks).
7. `COMERCIAL` (`comercial`): Prospecção de produtores, gestão de contas, pipeline e metas.
8. `SUPORTE_EVENTOS` (`suporte_eventos`): War room presencial, catracas e contingência de rede.
9. `MARKETING` (`marketing`): Campanhas, pixels de conversão e gestão de canais.
10. `REMARKETING` (`remarketing`): Recuperação de carrinhos e réguas de automação.
11. `PRODUTOR` (`produtor`): Acesso estritamente restrito aos eventos e dados da sua organização.

---

## 2. Matriz de Permissões por Item de Navegação

| Item de Navegação | Código da Permissão | Perfis com Acesso Padrão | Regra de Data Scope |
| :--- | :--- | :--- | :--- |
| **Visão Geral** | Autenticado | Todos | Filtra pelo escopo do usuário |
| **Central de Consulta** | Autenticado | Todos | Mascaramento de CPF por perfil |
| **Todos os Eventos** | `eventos.evento.visualizar` | ADMIN, COMERCIAL, SUPORTE, PRODUTOR | Exibe apenas produtoras/eventos autorizados |
| **Criar Evento** | `eventos.evento.criar` | ADMIN_GERAL, PRODUTOR | Travado à produtora do produtor |
| **Sessões & Agenda** | `eventos.sessoes.visualizar` | ADMIN, SUPORTE, PRODUTOR | Restrito ao evento selecionado |
| **Locais & Plantas** | `eventos.locais.visualizar` | ADMIN, OPERACIONAL, PRODUTOR | Global e contextual |
| **Setores & Ingressos** | `eventos.setor.visualizar` | ADMIN, PRODUTOR | Restrito ao evento selecionado |
| **Lotes & Preços** | `eventos.lote.visualizar` | ADMIN, COMERCIAL, PRODUTOR | Restrito ao evento selecionado |
| **Gerenciar Preços** | `eventos.lote.gerenciar` | ADMIN_GERAL, PRODUTOR (quando autorizado) | Requer alçada para desconto acima do teto |
| **Cortesias & Convites**| `eventos.cortesias.visualizar`| ADMIN, COMERCIAL, PRODUTOR | Log de auditoria em toda emissão |
| **Equipe do Evento** | `eventos.equipe.visualizar` | ADMIN, SUPORTE, PRODUTOR | Não concede RBAC sistêmico |
| **Documentos** | `eventos.documentos.visualizar`| ADMIN, FINANCEIRO, PRODUTOR | Isolamento por organização |
| **Central de Prontidão**| `eventos.preparacao.visualizar`| ADMIN, SUPORTE, PRODUTOR | Verificações factuais sem pontuação fictícia |
| **Alterações Críticas** | `eventos.alteracoes.visualizar`| ADMIN_GERAL, PRODUTOR | Passa por análise de impacto e aprovação |
| **Revisão e Publicar** | `eventos.lifecycle.review` | ADMIN_GERAL | Gate de abertura oficial de vendas |
| **Check-in & Portaria** | `eventos.checkin.operar` | ADMIN, SUPORTE_EVENTOS, OPERACIONAL | Validação autoritativa no backend |
| **Operação ao Vivo** | `eventos.operacao.visualizar` | ADMIN, SUPORTE_EVENTOS, OPERACIONAL | Visão de portas e contingência |
| **Central de Pedidos** | `comercial.pedidos.visualizar`| ADMIN, COMERCIAL, SAC, FINANCEIRO | Escopo da produtora |
| **Central de Vendas** | `comercial.vendas.visualizar` | ADMIN, COMERCIAL, PRODUTOR | Escopo da produtora |
| **Fila de Estornos** | `estorno.solicitacao.visualizar`| ADMIN, ESTORNO, SAC | Aprovadores limitados por alçada |
| **Saldos & Repasses** | `financeiro.saldo.visualizar` | ADMIN_GERAL, FINANCEIRO, PRODUTOR | Extrato individual do produtor |
| **Livro Diário & DRE** | `contabilidade.diario.visualizar`| ADMIN_GERAL, CONTABILIDADE | Apenas equipe fiscal interna |
| **Campanhas & Pixels** | `marketing.campanha.visualizar`| ADMIN, MARKETING, PRODUTOR | Escopo da produtora |
| **Painel Administrativo**| `admin.usuarios.visualizar` | ADMIN_GERAL | Acesso estritamente interno |

---

## 3. Delimitação de Data Scope no `DiskContext`

1. **`GLOBAL`:**
   - Pode selecionar `all` para produtores e eventos.
   - Pode selecionar qualquer produtora e qualquer evento.
2. **`PRODUCER`:**
   - Travado em suas `producerIds` autorizadas.
   - Se possuir apenas 1 produtora, `isLockedToSingleProducer = true`.
   - Seletor de produtora fica desabilitado com ícone de cadeado.
   - Nunca tem acesso a eventos de outras produtoras.
3. **`EVENT`:**
   - Travado em suas `eventIds` autorizadas.
   - `isLockedToSingleEvent = true`.
   - Entra diretamente no contexto daquele evento.
