import crypto from 'crypto';
import { prisma } from '../../../../core/database/prisma';

export interface GeneratedDocumentResult {
  documentId: string;
  documentChecksum: string;
  htmlContent: string;
  title: string;
}

export class ContractDocumentService {
  /**
   * Gera a minuta formal do contrato em HTML/texto com todas as partes, cláusulas e termos comerciais.
   * Calcula o documentChecksum SHA-256 para garantia de integridade.
   */
  public static async generateDocument(
    contractId: string,
    versionNumber: number
  ): Promise<GeneratedDocumentResult> {
    const contract = await prisma.commercialContract.findUnique({
      where: { id: contractId },
      include: {
        producer: true,
        parties: true
      }
    });

    if (!contract) {
      const err: any = new Error(`Contrato ${contractId} não encontrado.`);
      err.statusCode = 404;
      throw err;
    }

    const version = await prisma.commercialContractVersion.findUnique({
      where: {
        contractId_versionNumber: {
          contractId,
          versionNumber
        }
      },
      include: {
        terms: true
      }
    });

    if (!version) {
      const err: any = new Error(`Versão ${versionNumber} do contrato ${contractId} não encontrada.`);
      err.statusCode = 404;
      throw err;
    }

    const diskParty = (contract.parties || []).find((p: any) => p.partyType === 'DISK_INGRESSOS') || {
      legalName: 'Disk Ingressos Serviços de Informática Ltda.',
      tradeName: 'Disk Ingressos',
      document: '05.123.456/0001-78',
      address: 'Rua Marechal Deodoro, 500 - Curitiba - PR',
      representativeName: 'Vinicius Casagrande',
      representativeRole: 'Diretor Geral',
      representativeCpf: '123.456.789-00'
    };

    const producerParty = (contract.parties || []).find((p: any) => p.partyType === 'PRODUCER') || {
      legalName: contract.producer?.corporateName || 'Produtor Contratante',
      tradeName: contract.producer?.name || 'Produtor',
      document: contract.producer?.document || '00.000.000/0001-00',
      address: 'Endereço Comercial Cadastrado',
      representativeName: 'Representante Legal do Produtor',
      representativeRole: 'Representante',
      representativeCpf: '000.000.000-00'
    };

    const effectiveFromStr = version.effectiveFrom
      ? new Date(version.effectiveFrom).toLocaleDateString('pt-BR')
      : 'Data de assinatura';

    const effectiveUntilStr = version.effectiveUntil
      ? new Date(version.effectiveUntil).toLocaleDateString('pt-BR')
      : 'Indeterminado';

    // Termos formatados
    const termsHtml = (version.terms || []).map((t: any, idx: number) => {
      let rateStr = '';
      if (t.calculationType === 'PERCENTAGE') {
        rateStr = `${t.percentage}%`;
      } else if (t.calculationType === 'FIXED_AMOUNT') {
        rateStr = `R$ ${Number(t.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      } else if (t.calculationType === 'PER_TICKET') {
        rateStr = `R$ ${Number(t.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por ingresso`;
      } else {
        rateStr = 'Sob consulta / customizado';
      }

      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${idx + 1}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>${t.name}</strong><br><small style="color: #64748b;">${t.termType}</small></td>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${rateStr}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${t.payer === 'PRODUCER' ? 'Produtor' : t.payer === 'BUYER' ? 'Comprador (Taxa de Conveniência)' : 'Rateio'}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${t.conditions || 'Condições padrão'}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${contract.title} - ${contract.publicCode} (V${versionNumber})</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; margin: 40px; }
    .header { border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px; }
    .title { font-size: 20px; font-weight: bold; color: #0f172a; text-transform: uppercase; }
    .code { font-size: 14px; color: #64748b; margin-top: 4px; }
    .section { margin-top: 24px; margin-bottom: 16px; }
    .section-title { font-size: 15px; font-weight: bold; color: #0284c7; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    .footer { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 16px; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">Instrumento Particular de Prestação de Serviços Comerciais e Bilheteria</div>
    <div class="code">Código de Registro: <strong>${contract.publicCode}</strong> | Versão: <strong>${versionNumber}</strong> | Hash: <code>${version.contentHash}</code></div>
  </div>

  <div class="section">
    <div class="section-title">1. Das Partes Contratantes</div>
    <p>
      <strong>CONTRATADA:</strong> ${diskParty.legalName}, pessoa jurídica de direito privado inscrita no CNPJ sob o nº ${diskParty.document}, sediada em ${diskParty.address}, neste ato representada por seu ${diskParty.representativeRole}, ${diskParty.representativeName}, inscrito no CPF sob nº ${diskParty.representativeCpf}.
    </p>
    <p>
      <strong>CONTRATANTE:</strong> ${producerParty.legalName}, pessoa jurídica de direito privado inscrita no CNPJ sob o nº ${producerParty.document}, sediada em ${producerParty.address}, neste ato representada por seu ${producerParty.representativeRole}, ${producerParty.representativeName}, inscrito no CPF sob nº ${producerParty.representativeCpf}.
    </p>
  </div>

  <div class="section">
    <div class="section-title">2. Do Objeto e Escopo de Serviços</div>
    <p>
      O presente contrato tem por objeto a prestação de serviços de gestão, processamento e comercialização de ingressos, controle de acesso e soluções operacionais pela CONTRATADA em favor da CONTRATANTE, nos termos estipulados nesta minuta e conforme condições comerciais acordadas.
    </p>
  </div>

  <div class="section">
    <div class="section-title">3. Da Vigência e Prazos</div>
    <p>
      O presente contrato terá vigência a partir de <strong>${effectiveFromStr}</strong> até <strong>${effectiveUntilStr}</strong>, podendo ser aditado ou renovado mediante mútuo consentimento formal das partes.
    </p>
  </div>

  <div class="section">
    <div class="section-title">4. Das Condições Comerciais e Remuneração</div>
    <p>
      Pelos serviços prestados, vigorarão as seguintes condições comerciais durante a vigência deste instrumento:
    </p>
    <table>
      <thead>
        <tr style="background: #f8fafc;">
          <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left; width: 40px;">#</th>
          <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Item / Serviço</th>
          <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Taxa / Valor</th>
          <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Pagador</th>
          <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Condições</th>
        </tr>
      </thead>
      <tbody>
        ${termsHtml}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">5. Da Imutabilidade e Aditivos Contratuais</div>
    <p>
      Uma vez assinado este instrumento pelas partes, suas cláusulas e condições tornam-se imutáveis e definitivas. Qualquer alteração de escopo, taxas, vigência ou modelo comercial somente terá validade jurídica mediante a celebração de competente <strong>Termo Aditivo Contratual (ContractAmendment)</strong> formalmente aprovado e assinado por ambas as partes.
    </p>
  </div>

  <div class="footer">
    Documento formal gerado eletronicamente pela Plataforma DiskIngressos B2B.<br>
    Integridade do Documento assegurada por SHA-256. Versão de termos: ${version.contentHash}.
  </div>
</body>
</html>
    `.trim();

    const documentChecksum = crypto.createHash('sha256').update(htmlContent, 'utf8').digest('hex');
    const documentId = `doc_${contract.publicCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}_v${versionNumber}`;

    // Atualiza a versão do contrato com o documento gerado
    await prisma.commercialContractVersion.update({
      where: { id: version.id },
      data: {
        documentId,
        documentChecksum
      }
    });

    return {
      documentId,
      documentChecksum,
      htmlContent,
      title: contract.title
    };
  }
}
