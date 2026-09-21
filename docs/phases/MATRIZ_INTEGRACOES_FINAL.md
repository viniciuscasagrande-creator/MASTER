# Matriz Definitiva de Integrações Externas — Fase 1.3.11.1.5

## 1. Visão Geral do Ecossistema de Integrações

O Disk Interno integra-se com serviços externos críticos para processamento de pagamentos, controle de acesso físico em eventos, comunicação com o comprador e rastreamento de marketing.

---

## 2. Inventário de Integrações por Finalidade

| Serviço / Parceiro | Finalidade Operacional | Protocolo / Transporte | Autenticação | Tratamento de Erros / Resiliência |
|---|---|---|---|---|
| **Gateway de Pagamento (PIX / Cartão)** | Processamento de vendas e liquidação | REST / Webhook HTTPS | API Key + Assinatura de Payload HMAC-SHA256 | Retentativa com backoff exponencial; idempotência em webhooks |
| **Gateway de Estorno** | Devolução de saldo via PIX e estorno de fatura | REST HTTPS | Mutual TLS / Bearer Token seguro | Fila assíncrona; reprocessamento em caso de indisponibilidade |
| **Catracas de Portaria (Contingência)** | Validação de QR Code no local do evento | WebSocket + REST Local / SQLite Sync | Chave de dispositivo local criptografada | Funcionamento 100% offline com sincronização posterior |
| **WhatsApp Business API** | Notificações de compra, ingressos e SAC | REST HTTPS Webhooks | Bearer Token permanente via Meta Cloud API | Fila com limitação de taxa (Rate Limit) para evitar bloqueio |
| **Serviço de E-mail Transacional** | Envio de ingressos em PDF e comprovantes de estorno | SMTP / SES REST | Credenciais IAM assinadas | Fila com fallback secundário automático |
| **Meta Ads / Google Tag Manager** | Rastreamento de conversão e campanhas | Server-Side API (CAPI) + Client-side script | Conversions API Token | Processamento assíncrono em lote |

---

## 3. Diretrizes de Webhooks e Segurança

1. **Validação Obrigatória de Assinatura:** Todos os webhooks recebidos (gateways, mensagens) são validados contra a assinatura criptográfica (`x-signature` ou similar) antes de processar qualquer mutação.
2. **Idempotência no Processamento de Webhooks:** O ID de notificação do gateway é registrado na tabela de conciliação; mensagens duplicadas retornam `HTTP 200 OK` imediatamente sem reprocessar o pedido.
3. **Quarentena de Webhooks com Erro:** Payloads malformados ou divergências de valor são salvos em log de quarentena para intervenção da equipe técnica.
