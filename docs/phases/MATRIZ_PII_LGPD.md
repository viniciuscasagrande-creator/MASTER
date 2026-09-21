# Matriz de PII e Conformidade LGPD — Fase 1.3.11.1.5

## 1. Mapeamento de Dados Pessoais Sensíveis (PII)

Para assegurar total conformidade com a **Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)**, todos os campos contendo dados pessoais de compradores e operadores são catalogados com regras estritas de exibição, mascaramento e expurgo.

---

## 2. Catálogo de Campos PII e Políticas de Mascaramento

| Campo PII | Classificação LGPD | Regra de Exibição na Interface | Regra de Mascaramento em Logs | Base Legal de Tratamento |
|---|---|---|---|---|
| **Nome Completo** | Dado Pessoal | Exibido apenas em telas operacionais autorizadas | Parcial (`Jo** Si***`) | Execução de Contrato (Art. 7º, V) |
| **CPF / Documento** | Dado Pessoal Identificável | Mascarado por padrão (`***.456.789-**`) | Sempre Mascarado | Execução de Contrato / Fiscal |
| **E-mail** | Dado Pessoal | Parcial (`j***o@exemplo.com`) | Parcial em logs de depuração | Execução de Contrato / Suporte |
| **Telefone / WhatsApp** | Dado Pessoal | Parcial (`(41) *****-8888`) | Parcial | Execução de Contrato / Notificação |
| **Dados de Cartão** | Dado Financeiro Ultrassensível | **NUNCA ARMAZENADO**; apenas bandeira e últimos 4 dígitos | Proibido em logs (PCI-DSS) | Execução de Pagamento via Gateway |
| **Chave PIX / Conta** | Dado Financeiro | Exibido apenas para execução de estorno | Mascarado em logs | Devolução de Saldo / Fiscal |
| **Endereço IP** | Dado Técnico Identificável | Visível apenas em logs de auditoria de segurança | Retenção máxima de 6 meses (Marco Civil) | Cumprimento de Obrigação Legal |

---

## 3. Direitos do Titular e Mecanismos Operacionais

1. **Direito de Acesso e Central de Consulta:** O comprador pode consultar seus pedidos e ingressos através de solicitação atendida pelo SAC com validação de identidade prévia.
2. **Direito de Retificação:** O agente de SAC ou o próprio comprador pode corrigir dados de e-mail e telefone incorretos mediante registro auditável.
3. **Direito ao Esquecimento / Anonimização:** Ao solicitar a exclusão de dados, os campos pessoais (`name`, `email`, `document`) são substituídos por hashes irreversíveis (`ANON_8f3a...`), preservando os registros contábeis e fiscais exigidos pela legislação tributária brasileira (prazo legal de 5 anos).
4. **Log de Acesso a PII:** Toda vez que um agente do SAC visualiza o CPF ou dados bancários desmascarados, uma entrada indelével de auditoria é gravada com ID do operador, data, hora e justificativa.
