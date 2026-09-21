# Integração Inter-Módulos do Financeiro — Disk Interno PDT
## Fase 1.3.11.1.4.4

### 1. Mapa de Interações de Domínio
O módulo Financeiro atua como o ponto focal de liquidação e custódia da plataforma Disk Interno, comunicando-se com:
```text
           [ COMERCIAL ]
                 │ (Pedidos Pagos / Vendas Brutas / Taxas de Serviço)
                 ▼
           [ FINANCEIRO ] ◄────► [ CONTABILIDADE ] (Livro Diário / Razonete / DRE Oficial)
            ▲         ▲
            │         │
[ ESTORNO ] ┘         └─ [ AUDITORIA & SEGURANÇA ]
(Devoluções Efetivadas)   (Logs Imutáveis / Step-Up Token / Maker-Checker)
```

### 2. Integrações Específicas
1. **Comercial -> Financeiro:**
   - Cada pedido concluído no Comercial gera o fato contábil de receita bruta (`SALE`) e a respectiva dedução de comissão (`COMMISSION_FEE`).
   - O saldo disponível do evento é alimentado em tempo real pelo volume transacionado.
2. **Estorno -> Financeiro:**
   - O módulo de Estorno solicita ao Financeiro a validação de disponibilidade de fundos antes de aprovar uma devolução.
   - A devolução concluída abate o saldo líquido do evento no Financeiro, registrando uma linha de estorno (`REFUND`) no extrato analítico.
3. **Financeiro -> Contabilidade (Fase Subsequente 1.3.11.1.4.5):**
   - Todas as movimentações do Financeiro (Vendas, Repasses, Transferências, Estornos, Provisões de Pagamento) emitem eventos via `EventBus` para geração das partidas dobradas no Livro Diário da Contabilidade.
4. **Financeiro -> Auditoria & Segurança:**
   - Registro síncrono de logs estruturados no `AuditService`.
   - Exigência de token Step-Up emitido pelo `SecurityService` para operações sensíveis.
