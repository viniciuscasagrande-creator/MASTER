# PLANO DE TESTES & VERIFICAÇÃO DO COMERCIAL — FASE 1.3.11.1.3

## 1. Escopo da Suíte de Testes

A verificação do módulo Comercial recuperado compreende 6 suítes de testes:
1. **Acordos Comerciais dos Eventos (`EventCommercialAgreement`)**:
   - Criação de acordo inicial com taxas percentuais e fixas.
   - Atualização de taxas gerando nova versão com desativação da anterior.
   - Registro obrigatório de auditoria com justificativa.
   - Bloqueio de valores inválidos (bps > 5000 / 50%, valores negativos).
2. **Operações de Antecipação Financeira (Advanced)**:
   - Cálculo estrito do saldo elegível a partir dos pedidos pagos.
   - Rejeição de solicitações acima do teto percentual contratado (ex: > 70%).
   - Cálculo preciso de taxa financeira e valor líquido a transferir.
3. **Integridade da Central de Pedidos Omnichannel**:
   - Listagem paginada e filtragem por canais (`SITE`, `BOX_OFFICE`, `PDV`, `DISK`).
   - Busca por código de pedido, protocolo, comprador e CPF.
4. **Dossiê Operacional do Pedido**:
   - Resolução das abas (Geral, Ingressos, Pagamento, Linha do Tempo, Técnico).
   - Ação de reemissão de ingresso gerando novo hash QR.
   - Conciliação operacional do pedido.
5. **Permissões Granulares (RBAC)**:
   - Ocultação de valores monetários para usuários sem `comercial.vendas.valores.visualizar`.
   - Isolamento de escopo por produtora (`ScopeType.PRODUCER`).
6. **Suíte Existente de CRM B2B**:
   - Garantir 100% de passagem nos 50 testes de gestão de contas, catálogo, contratos e oportunidades.

---

## 2. Roteiro de Execução de Testes

| ID do Caso de Teste | Descrição do Teste | Resultado Esperado | Status |
| :--- | :--- | :--- | :--- |
| `TC-COMM-01` | Criar acordo comercial de evento | Retorna versão 1 ativa com log de auditoria `create_agreement`. | APROVADO |
| `TC-COMM-02` | Atualizar taxa de serviço com justificativa | Versão 1 torna-se 'substituida', versão 2 ativa, log registrado. | APROVADO |
| `TC-COMM-03` | Solicitar antecipação dentro do limite | Retorna status 'solicitada' com custo e valor líquido calculados. | APROVADO |
| `TC-COMM-04` | Solicitar antecipação acima do teto permitido | Retorna HTTP 400 com mensagem explícita de limite excedido. | APROVADO |
| `TC-COMM-05` | Reemitir ingresso contestado | Invalida QR anterior e gera nova credencial ativa. | APROVADO |
| `TC-COMM-06` | Executar suíte B2B legada | 50/50 asserções de CRM e gestão de contas passam sem regressão. | APROVADO |
| `TC-COMM-07` | Build completo de TypeScript e Vite | Compilação sem nenhum erro de tipo no frontend e backend. | APROVADO |
