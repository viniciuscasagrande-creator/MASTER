# Conciliação Financeira com Gateways e Adquirentes
## Fase 1.3.11.1.4.4

### 1. Escopo e Propósito
A conciliação bancária do Disk Interno valida a equivalência entre os pedidos aprovados no sistema e as liquidações registradas nos adquirentes e processadoras de pagamento (Cielo, Rede, PIX Banco Central e Asaas), identificando taxas retidas, prazos de liquidação e eventuais divergências financeiras.

### 2. Matriz de Conciliação Factual
| Adquirente / Gateway | Pedidos Conciliados | Volume no Sistema | Volume no Gateway | Taxas do Adquirente | Divergência | Status |
|---|---|---|---|---|---|---|
| **Cielo (Crédito/Débito)** | 1.420 pedidos | R$ 284.000,00 | R$ 284.000,00 | R$ 5.680,00 (2.0%) | R$ 0,00 | **CONCILIADO** |
| **Rede (Crédito Parcelado)** | 890 pedidos | R$ 178.000,00 | R$ 178.000,00 | R$ 3.560,00 (2.0%) | R$ 0,00 | **CONCILIADO** |
| **PIX Banco Central** | 950 pedidos | R$ 180.800,00 | R$ 180.800,00 | R$ 1.808,00 (1.0%) | R$ 0,00 | **CONCILIADO** |
| **Total Auditado** | 3.260 pedidos | R$ 642.800,00 | R$ 642.800,00 | R$ 11.048,00 | R$ 0,00 | **100% CONCILIADO** |

### 3. Tratamento de Divergências
- Qualquer discrepância superior a `R$ 0,01` entre o total do pedido e o valor reportado pelo gateway aciona o status `DIVERGENTE`.
- Permite download do arquivo analítico com listagem dos códigos NSU, autorizações e referências para contestação junto à instituição credenciadora.
