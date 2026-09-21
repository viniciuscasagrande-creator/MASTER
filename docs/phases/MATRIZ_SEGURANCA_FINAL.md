# Matriz de Segurança e Proteção de Dados — Fase 1.3.11.1.5

## 1. Princípios de Arquitetura de Segurança

A plataforma Disk Interno segue o princípio de **Defesa em Profundidade** (Defense in Depth) e **Menor Privilégio** (Least Privilege), garantindo a proteção de transações financeiras, credenciais e dados pessoais dos clientes.

---

## 2. Controles de Segurança por Camada

| Camada | Mecanismo de Proteção | Implementação no MASTER | Garantia Técnica |
|---|---|---|---|
| **Rede & Transporte** | HTTPS / TLS 1.3 | Terminação SSL no Load Balancer / Nginx | Criptografia ponta a ponta em trânsito |
| **HTTP Headers** | Helmet | `helmet()` no Express (`backend/src/server.ts`) | Mitigação de Clickjacking, XSS, MIME sniffing |
| **CORS** | Política Estrita de Origem | Configurado com lista de origens autorizadas | Bloqueio de requisições cross-origin não autorizadas |
| **Autenticação** | JWT com Assinatura Segura | `jsonwebtoken` com algoritmo HS256/RS256 | Expiração curta de tokens (15m) + Refresh Token rotativo |
| **Autorização** | RBAC Declarativo | Middleware `requirePermission(...)` | Bloqueio em tempo de compilação/execução |
| **Multi-Tenancy** | Filtros de Escopo Forçados | Cláusula `where: { producerId }` no Prisma | Prevenção absoluta contra vulnerabilidades IDOR |
| **Camada de Banco** | Queries Parametrizadas | Prisma ORM | Imunidade contra SQL Injection |
| **Sanitização de Input** | Validação Zod / DOMPurify | Schemas Zod em rotas + Purify no frontend | Prevenção contra XSS e payloads maliciosos |
| **Segredos e Chaves** | Variáveis de Ambiente | `.env` com gitignore estrito e vault em produção | Zero chaves em texto claro no código fonte |
| **Senhas de Usuário** | Hashing Criptográfico | `bcrypt` com salt factor 12 | Senhas nunca armazenadas em texto claro |

---

## 3. Política de Prevenção contra Ataques de Força Bruta

- **Rate Limiting:** Rotas de autenticação (`/api/auth/login`) são limitadas a no máximo 5 tentativas por minuto por endereço IP.
- **Bloqueio Temporário:** Após 5 tentativas consecutivas com falha, o IP ou usuário entra em espera exponencial de 15 minutos.
- **Auditoria de Acessos:** Tentativas anômalas ou fora de horário padrão disparam alertas no módulo de auditoria.
