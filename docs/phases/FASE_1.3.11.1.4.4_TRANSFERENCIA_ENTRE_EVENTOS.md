# Motor de Transferência Entre Eventos — SafeSaff
## Especificação e Implementação Factual (Fase 1.3.11.1.4.4)

### 1. Definição do Domínio
A transferência entre eventos permite que um produtor com múltiplos centros de custo (eventos ativos) remaneje recursos financeiros entre seus projetos sem a necessidade de resgate bancário intermediário com incidência de taxas de TED/PIX externas ou desenquadramento de fluxo de caixa.

### 2. Regras de Negócio Obrigatórias
1. **Mesmo Produtor:** Origem e destino devem pertencer obrigatoriamente à mesma carteira de produtor (`producerId`).
2. **Eventos Distintos:** É vedada a transferência entre um evento e ele mesmo (`fromEventId !== toEventId`).
3. **Disponibilidade Real:** O valor não pode superar o saldo disponível líquido do evento de origem (`amount <= origin.availableBalance`).
4. **Alçada de Valor Alto (> R$ 50.000):**
   - Transferências até R$ 50.000,00 são liquidadas imediatamente em status `COMPLETED`.
   - Transferências acima de R$ 50.000,00 entram em status `PENDING_APPROVAL`, exigindo aprovação por usuário com papel de Diretoria e emissão de token Step-Up.
5. **Segregação de Funções (Maker-Checker):** O usuário que solicitou a transferência não pode, sob qualquer circunstância, atuar como aprovador.
6. **Imutabilidade e Reversão Compensatória:**
   - Registros de transferências concluídas jamais são deletados ou editados no banco de dados.
   - Uma reversão gera uma nova transferência compensatória com prefixo `REV-` (ex: `REV-TRF-2026-000001`), debitando o evento de destino original e creditando a origem.
   - Ambas as transações permanecem preservadas no histórico para fins de auditoria contábil e fiscal.

### 3. Validação do Caso de Teste Factual
- **Cenário:** Evento X (Saldo Inicial: R$ 119.600,00) e Evento Y (Saldo Inicial: R$ 241.776,00).
- **Ação 1: Transferência de R$ 500,00:**
  - Origem: R$ 119.600,00 - R$ 500,00 = **R$ 119.100,00**
  - Destino: R$ 241.776,00 + R$ 500,00 = **R$ 242.276,00**
- **Ação 2: Reversão Compensatória:**
  - Gera compensação `REV-TRF-...` no valor de R$ 500,00 (Débito em Y, Crédito em X).
  - Origem restaurada: R$ 119.100,00 + R$ 500,00 = **R$ 119.600,00**
  - Destino restaurado: R$ 242.276,00 - R$ 500,00 = **R$ 241.776,00**
- **Resultado dos Testes Automatizados:** 100% de conformidade com tolerância zero de drift financeiro.
