# MATRIZ RBAC DO MÓDULO EVENTOS — FASE 1.3.11.1.2
## Permissões Granulares, Ações Permitidas e Delimitação por Perfil

**Data:** 20/09/2026  
**Status:** Homologada  

---

| Código da Permissão | Ação Permitida | Perfis Autorizados | Restrições e Alçadas |
| :--- | :--- | :--- | :--- |
| `eventos.evento.visualizar` | Consultar listagem, detalhes e painel do evento | Todos os perfis operacionais | Limitado ao Data Scope (Global, Produtor ou Evento) |
| `eventos.evento.criar` | Criar rascunhos e novos eventos | `admin_geral`, `produtor` | Produtor só pode criar vinculado à sua própria organização |
| `eventos.evento.editar` | Alterar título, descrição, imagens e dados gerais | `admin_geral`, `produtor` | Eventos com status `ON_SALE` geram proposta em Alterações Controladas |
| `eventos.sessoes.visualizar` | Consultar datas, horários e sessões | Todos os perfis operacionais | Restrito ao evento ativo |
| `eventos.sessoes.editar` | Criar, alterar e remover sessões | `admin_geral`, `produtor` | Proibido remover sessão com ingressos já vendidos |
| `eventos.locais.visualizar` | Consultar arenas, teatros e plantas de setor | Todos os perfis operacionais | — |
| `eventos.locais.gerenciar` | Cadastrar novos locais e editar mapas | `admin_geral`, `admin_operacional` | — |
| `eventos.setor.visualizar` | Consultar setores e capacidades físicas | Todos os perfis operacionais | — |
| `eventos.setores.configurar` | Criar e reconfigurar setores operacionais | `admin_geral`, `produtor` | Alteração de capacidade para baixo requer validação de estoque |
| `eventos.ingresso.visualizar` | Consultar tipos de ingresso cadastrados | Todos os perfis operacionais | — |
| `eventos.lote.visualizar` | Visualizar lotes de venda e absorção | `admin_geral`, `comercial`, `produtor`| — |
| `eventos.lote.gerenciar` | Criar lotes, definir matriz de preços e taxas | `admin_geral`, `produtor` | Concessão de descontos acima do teto requer aprovação |
| `eventos.cortesias.visualizar`| Visualizar relatório e saldo de cortesias | `admin_geral`, `comercial`, `produtor`| — |
| `eventos.cortesias.criar` | Emitir ingressos cortesias / convites nominais | `admin_geral`, `produtor` | Registro obrigatório de autorizador, beneficiário e motivo |
| `eventos.canais.visualizar` | Visualizar canais habilitados para o evento | Todos os perfis operacionais | — |
| `eventos.canais.configurar` | Habilitar/desabilitar Web, PDVs e Parceiros | `admin_geral`, `produtor` | — |
| `eventos.equipe.visualizar` | Consultar escala de operadores do evento | `admin_geral`, `suporte_eventos`, `produtor`| Não concede permissões sistêmicas globais |
| `eventos.documentos.visualizar`| Visualizar contratos, alvarás e anexos | `admin_geral`, `financeiro`, `produtor`| — |
| `eventos.documentos.enviar` | Fazer upload de documentos do evento | `admin_geral`, `produtor` | Arquivos auditados e com controle de versão |
| `eventos.preparacao.visualizar`| Consultar checklist de prontidão (go-live) | Todos os perfis operacionais | Indicadores factuais de completude |
| `eventos.alteracoes.visualizar`| Consultar histórico de propostas de alteração | Todos os perfis operacionais | — |
| `eventos.lifecycle.review` | Executar gate final de publicação (`ON_SALE`) | `admin_geral` | Requer checklist de prontidão 100% satisfeito |
| `eventos.checkin.operar` | Operar leitura de ingressos na portaria | `admin_geral`, `admin_operacional`, `suporte_eventos` | Validação segura de duplicidade no backend |
| `eventos.operacao.visualizar` | Acompanhar war room e portas em tempo real | `admin_geral`, `suporte_eventos`, `produtor`| — |
| `eventos.encerramento.sessao.encerrar` | Fechar sessão e encerrar bilheteria | `admin_geral`, `admin_operacional` | Bloqueia novas emissões e trava inventário |
| `eventos.cancelamento.solicitar`| Propor ou efetivar cancelamento de evento | `admin_geral` | Dispara cálculo de impacto, estornos e notificações aos compradores |
