import crypto from 'crypto';
import { prisma } from '../../../../core/database/prisma';
import { AuditService } from '../../../audit/audit.service';

export class ProposalDocumentService {
  /**
   * Gera o documento formal imutável da versão da proposta comercial
   */
  public static async generateDocument(
    proposalId: string,
    versionNumber: number,
    user: any
  ): Promise<{ documentId: string; documentChecksum: string; htmlContent: string }> {
    const proposal = await prisma.commercialProposal.findUnique({
      where: { id: proposalId },
      include: { producer: true }
    });

    if (!proposal) {
      throw new Error('Proposta comercial não encontrada.');
    }

    const version = await prisma.commercialProposalVersion.findUnique({
      where: {
        proposalId_versionNumber: {
          proposalId,
          versionNumber: Number(versionNumber)
        }
      },
      include: { terms: true, events: true }
    });

    if (!version) {
      throw new Error(`Versão V${versionNumber} da proposta não encontrada.`);
    }

    const producerName = proposal.producer?.name || 'Produtor Parceiro';
    const producerDoc = proposal.producer?.cnpj || proposal.producer?.cpf || 'Não informado';
    const validUntilFormatted = version.validUntil
      ? new Date(version.validUntil).toLocaleDateString('pt-BR')
      : '30 dias';

    const termsRows = (version.terms || []).map((t: any, idx: number) => {
      let valorFormatado = '-';
      if (t.calculationType === 'PERCENTAGE') {
        valorFormatado = `${Number(t.percentage).toFixed(2)}%`;
      } else if (t.calculationType === 'FIXED_AMOUNT') {
        valorFormatado = `R$ ${Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      } else if (t.calculationType === 'PER_TICKET') {
        valorFormatado = `R$ ${Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / ingresso`;
      }

      const payerLabel = t.payer === 'PRODUCER' ? 'Produtor' : t.payer === 'BUYER' ? 'Comprador (Taxa de Conveniência)' : 'Compartilhado (Split)';

      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${t.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${t.calculationType}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #1e3a8a;">${valorFormatado}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${payerLabel}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">${t.conditions || 'Padrão'}</td>
        </tr>
      `;
    }).join('');

    const eventsRows = (version.events || []).map((e: any) => {
      const dateFormatted = e.estimatedDate ? new Date(e.estimatedDate).toLocaleDateString('pt-BR') : 'A definir';
      const revFormatted = e.estimatedGrossRevenue ? `R$ ${Number(e.estimatedGrossRevenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-';

      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${e.estimatedEventName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${dateFormatted}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${e.estimatedVenue || 'A definir'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${e.estimatedTickets ? e.estimatedTickets.toLocaleString('pt-BR') : '-'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${revFormatted}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Proposta Comercial ${proposal.publicCode} V${version.versionNumber} — DiskIngressos</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 40px; background: #ffffff; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: 800; color: #1d4ed8; letter-spacing: -0.5px; }
    .code { font-size: 16px; font-weight: 700; color: #475569; }
    .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 25px; }
    .table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 30px; font-size: 14px; }
    .table th { background: #f1f5f9; padding: 10px; text-align: left; font-weight: 600; color: #334155; border-bottom: 2px solid #cbd5e1; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
    .hash { font-family: monospace; font-size: 11px; color: #0f172a; word-break: break-all; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">DiskIngressos</div>
      <div style="font-size: 13px; color: #64748b;">Formalização de Condições Comerciais B2B</div>
    </div>
    <div style="text-align: right;">
      <div class="code">${proposal.publicCode} (Versão ${version.versionNumber})</div>
      <div style="font-size: 13px; color: #64748b;">Emissão: ${new Date().toLocaleDateString('pt-BR')}</div>
    </div>
  </div>

  <div class="meta-box">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
      <div>
        <div style="font-size: 12px; color: #64748b; text-transform: uppercase;">Produtor Destinatário</div>
        <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${producerName}</div>
        <div style="font-size: 13px; color: #475569;">Documento: ${producerDoc}</div>
      </div>
      <div>
        <div style="font-size: 12px; color: #64748b; text-transform: uppercase;">Validade da Proposta</div>
        <div style="font-size: 16px; font-weight: 700; color: #dc2626;">Até ${validUntilFormatted}</div>
        <div style="font-size: 13px; color: #475569;">Modelo Comercial: ${version.commercialModel}</div>
      </div>
    </div>
  </div>

  <h3 style="color: #0f172a; margin-top: 30px; margin-bottom: 10px;">1. Objeto & Escopo da Negociação</h3>
  <p style="font-size: 14px; line-height: 1.6; color: #334155;">${proposal.description || 'Formalização das condições comerciais para prestação de serviços de bilheteria, emissão de ingressos, suporte operacional e controle de acesso para os eventos descritos abaixo.'}</p>

  ${eventsRows.length > 0 ? `
    <h3 style="color: #0f172a; margin-top: 30px; margin-bottom: 10px;">2. Eventos Abrangidos</h3>
    <table class="table">
      <thead>
        <tr>
          <th>Evento Estimado</th>
          <th>Data Prevista</th>
          <th>Local / Praça</th>
          <th style="text-align: right;">Público Estimado</th>
          <th style="text-align: right;">Faturamento Previsto</th>
        </tr>
      </thead>
      <tbody>
        ${eventsRows}
      </tbody>
    </table>
  ` : ''}

  <h3 style="color: #0f172a; margin-top: 30px; margin-bottom: 10px;">3. Condições Comerciais & Remuneração</h3>
  <table class="table">
    <thead>
      <tr>
        <th>Serviço / Condição</th>
        <th>Tipo de Cobrança</th>
        <th style="text-align: right;">Taxa / Valor</th>
        <th>Pagador</th>
        <th>Observações / Regras</th>
      </tr>
    </thead>
    <tbody>
      ${termsRows}
    </tbody>
  </table>

  <h3 style="color: #0f172a; margin-top: 30px; margin-bottom: 10px;">4. Disposições Gerais</h3>
  <ul style="font-size: 13px; line-height: 1.7; color: #475569; padding-left: 20px;">
    <li>A presente proposta comercial estabelece as bases econômicas pactuadas e servirá como parâmetro vinculante para a elaboração do Contrato de Prestação de Serviços.</li>
    <li>O aceite formal desta proposta não constitui início imediato de repasses financeiros ou abertura de vendas sem a assinatura do respectivo instrumento contratual e validação cadastral.</li>
    <li>As condições acordadas possuem validade irrevogável até a data de vigência estipulada neste documento.</li>
  </ul>

  <div class="footer">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <strong>DiskIngressos — Sistema Comercial B2B</strong><br>
        Documento gerado eletronicamente por ${user.name || 'Usuário do Sistema'}
      </div>
      <div style="text-align: right;">
        Status: <strong>${version.status}</strong>
      </div>
    </div>
    <div style="margin-top: 15px;">
      <strong>Checksum de Integridade (SHA-256):</strong><br>
      <span class="hash">${version.contentHash}</span>
    </div>
  </div>
</body>
</html>
    `;

    // Calcula checksum SHA-256 do documento gerado
    const documentChecksum = crypto.createHash('sha256').update(htmlContent, 'utf8').digest('hex');
    const documentId = `doc_prop_${proposal.publicCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}_v${version.versionNumber}`;

    // Atualiza a versão com o documentId e documentChecksum
    await prisma.commercialProposalVersion.update({
      where: { id: version.id },
      data: {
        documentId,
        documentChecksum
      }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'GENERATE_PROPOSAL_DOCUMENT',
      resource: 'PROPOSTA_COMERCIAL',
      resourceId: proposal.id,
      producerId: proposal.producerId,
      details: `Documento da proposta ${proposal.publicCode} V${version.versionNumber} gerado com checksum: ${documentChecksum.substring(0, 8)}...`
    });

    return {
      documentId,
      documentChecksum,
      htmlContent
    };
  }
}
