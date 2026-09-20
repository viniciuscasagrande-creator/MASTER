import React from 'react';
import {
  FileSpreadsheet,
  Download,
  Info,
  CheckCircle2,
  FileCheck,
  HelpCircle
} from 'lucide-react';
import { ImportType } from '../data-management.types';

const TEMPLATES = [
  {
    type: 'CUSTOMERS' as ImportType,
    name: 'Modelo Oficial: Clientes e Compradores',
    fileName: 'modelo_importacao_customers.csv',
    desc: 'Cadastro de clientes com CPF (Mod11), contatos de e-mail/telefone e localização.',
    columns: ['Nome do Cliente (Obrigatório)', 'CPF (Obrigatório - 11 dígitos)', 'E-mail (Obrigatório)', 'Telefone', 'Cidade', 'Estado (UF)']
  },
  {
    type: 'EVENT_PARTICIPANTS' as ImportType,
    name: 'Modelo Oficial: Participantes e Cortesias',
    fileName: 'modelo_importacao_event_participants.csv',
    desc: 'Lista de participantes, portadores de cortesias e convidados VIP por evento.',
    columns: ['Nome do Participante (Obrigatório)', 'Documento (Obrigatório)', 'E-mail', 'Tipo de Ingresso', 'Código / Código de Barras']
  },
  {
    type: 'SUPPLIERS' as ImportType,
    name: 'Modelo Oficial: Fornecedores e Prestadores',
    fileName: 'modelo_importacao_suppliers.csv',
    desc: 'Fornecedores para contas a pagar com CNPJ e chave PIX para liquidação.',
    columns: ['Razão Social (Obrigatório)', 'CNPJ (Obrigatório - 14 dígitos)', 'E-mail Comercial', 'Chave PIX', 'Banco', 'Agência / Conta']
  },
  {
    type: 'ACCOUNTS_PAYABLE' as ImportType,
    name: 'Modelo Oficial: Contas a Pagar',
    fileName: 'modelo_importacao_accounts_payable.csv',
    desc: 'Lote de despesas operacionais com datas de vencimento e centro de custo.',
    columns: ['Descrição da Despesa (Obrigatório)', 'Valor R$ (Obrigatório)', 'Data de Vencimento (DD/MM/AAAA)', 'Favorecido']
  },
  {
    type: 'ACCOUNTS_RECEIVABLE' as ImportType,
    name: 'Modelo Oficial: Contas a Receber',
    fileName: 'modelo_importacao_accounts_receivable.csv',
    desc: 'Previsões de recebimento, borderôs de bilheteria e patrocínios.',
    columns: ['Descrição do Título (Obrigatório)', 'Valor Previsto R$ (Obrigatório)', 'Data Prevista (DD/MM/AAAA)', 'Pagador / Origem']
  },
  {
    type: 'FINANCIAL_TRANSACTIONS' as ImportType,
    name: 'Modelo Oficial: Transações Financeiras',
    fileName: 'modelo_importacao_financial_transactions.csv',
    desc: 'Extrato financeiro com tipo de lançamento (DEBIT ou CREDIT) e montante.',
    columns: ['Descrição (Obrigatório)', 'Montante R$ (Obrigatório)', 'Tipo: DEBIT ou CREDIT', 'Data (DD/MM/AAAA)']
  },
  {
    type: 'MARKETING_CONTACTS' as ImportType,
    name: 'Modelo Oficial: Contatos de Marketing (LGPD)',
    fileName: 'modelo_importacao_marketing_contacts.csv',
    desc: 'Contatos com registro explícito de base legal e opt-in para réguas promocionais.',
    columns: ['Nome (Obrigatório)', 'E-mail (Obrigatório)', 'WhatsApp / Telefone', 'Consentimento LGPD (SIM / NÃO)']
  },
  {
    type: 'LEGACY_ORDERS' as ImportType,
    name: 'Modelo Oficial: Pedidos Históricos',
    fileName: 'modelo_importacao_legacy_orders.csv',
    desc: 'Carga de pedidos antigos para conciliação contábil e auditoria.',
    columns: ['ID Pedido Legado (Obrigatório)', 'Valor Total R$ (Obrigatório)', 'Data da Compra', 'Status do Pedido']
  }
];

export const TemplatesTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white">Modelos Oficiais de Planilha</h3>
        <p className="text-xs text-slate-400">
          Baixe os modelos padronizados com cabeçalhos oficiais, exemplos de preenchimento e compatibilidade nativa UTF-8 BOM.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((tpl) => (
          <div
            key={tpl.type}
            className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700 transition-all"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                  CSV / XLSX
                </span>
              </div>

              <h4 className="mt-3 font-bold text-white text-sm">{tpl.name}</h4>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">{tpl.desc}</p>

              <div className="mt-4 border-t border-slate-800 pt-3">
                <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold">
                  Colunas Esperadas:
                </span>
                <ul className="mt-1.5 space-y-1 text-xs text-slate-300">
                  {tpl.columns.map((col, idx) => (
                    <li key={idx} className="flex items-center gap-1.5 text-[11px]">
                      <span className="h-1 w-1 rounded-full bg-emerald-400" />
                      {col}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800">
              <a
                href={`/api/data/import-templates/${tpl.type}/download`}
                download={tpl.fileName}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950/40"
              >
                <Download className="h-3.5 w-3.5" />
                Baixar Modelo Oficial (.csv)
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
