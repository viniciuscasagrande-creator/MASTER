# MATRIZ OPERACIONAL — CENTRAL DE CONSULTA

**Fase:** 1.3.11.1.4.2 — Recuperação Completa do Atendimento SAC  
**Data:** 20/09/2026

---

## 1. Regras de Reconhecimento & Normalização de Busca

A Central de Consulta reconhece automaticamente o formato do termo digitado pelo atendente, sem exigir que ele selecione previamente a categoria de busca:

| Formato Entrada | Tipo Detectado | Normalização Aplicada | Estratégia de Busca |
| :--- | :--- | :--- | :--- |
| `123.456.789-00` ou `12345678900` | `CPF` | Remoção de pontuação (`replace(/\D/g, '')`) | Busca exata por `cpfNormalized` e `customerCpf` |
| `joao@email.com` | `EMAIL` | Conversão para minúsculas e trim | Busca exata por `emailNormalized` e `customerEmail` |
| `(41) 99999-9999` ou `41999999999` | `PHONE` | Extração de dígitos numéricos | Busca por `phoneNormalized` |
| `DK-98421` ou `98421` | `ORDER_NUMBER` | Remoção de prefixo e dígitos | Busca em pedidos cadastrados |
| `TKT-8842` | `TICKET_CODE` | Código alfanumérico direto | Busca em credenciais emitidas |
| `João Silva` | `TEXT` | Remoção de acentos e minúsculas | Busca textual parcial (`includes`) sem selecionar automaticamente |

---

## 2. Tratamento de Ambiguidade

Quando a busca por nome retornar múltiplos compradores (ex: "João Silva"), o sistema:
1. **NUNCA** seleciona ou abre um cliente automaticamente.
2. Apresenta uma listagem de cartões de compradores encontrados com dados mínimos (nome, e-mail com domínio visível, CPF mascarado, quantidade de pedidos).
3. Permite ao operador clicar em **"Abrir Ficha"** no registro correto após confirmar dados com o consumidor.
