import { Request, Response } from 'express';
import { ContractService } from './contract.service';
import { ContractQueryService } from './contract-query.service';
import { ContractDocumentService } from './generation/contract-document.service';
import { SignatureService } from './signatures/signature.service';
import { ContractAmendmentService } from './amendments/amendment.service';
import { ContractRenewalService } from './renewals/renewal.service';
import { ContractTermsProvider } from './terms/contract-terms.provider';

export class ContractController {
  public static async listContracts(req: Request, res: Response) {
    try {
      const result = await ContractQueryService.listContracts(req.query as any, (req as any).user);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  public static async getMetrics(req: Request, res: Response) {
    try {
      const metrics = await ContractQueryService.getMetrics((req as any).user);
      return res.status(200).json(metrics);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  public static async getContractById(req: Request, res: Response) {
    try {
      const contract = await ContractQueryService.getContractById(req.params.id as string, (req as any).user);
      return res.status(200).json(contract);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  public static async createFromProposal(req: Request, res: Response) {
    try {
      const contract = await ContractService.createContractFromProposal(req.body, (req as any).user);
      return res.status(201).json(contract);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  public static async createDirect(req: Request, res: Response) {
    try {
      const contract = await ContractService.createDirectContract(req.body, (req as any).user);
      return res.status(201).json(contract);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  public static async updateDraft(req: Request, res: Response) {
    try {
      const contract = await ContractService.updateContractDraft(req.params.id as string, req.body, (req as any).user);
      return res.status(200).json(contract);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  public static async submitApproval(req: Request, res: Response) {
    try {
      const contract = await ContractService.submitContractApproval(req.params.id as string, (req as any).user);
      return res.status(200).json(contract);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  public static async processDecision(req: Request, res: Response) {
    try {
      const contract = await ContractService.processContractDecision(req.params.id as string, req.body, (req as any).user);
      return res.status(200).json(contract);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  public static async generateDocument(req: Request, res: Response) {
    try {
      const versionNumber = Number(req.params.versionNumber) || 1;
      const document = await ContractDocumentService.generateDocument(req.params.id as string, versionNumber);
      return res.status(200).json(document);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  public static async prepareAndSendSignature(req: Request, res: Response) {
    try {
      const envelope = await SignatureService.prepareAndSendEnvelope(req.params.id as string, req.body, (req as any).user);
      return res.status(200).json(envelope);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  public static async handleSignatureWebhook(req: Request, res: Response) {
    try {
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const result = await SignatureService.processWebhook(req.body, req.headers, rawBody);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  public static async createAmendment(req: Request, res: Response) {
    try {
      const amendment = await ContractAmendmentService.createAmendment(req.params.id as string, req.body, (req as any).user);
      return res.status(201).json(amendment);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  public static async approveAmendment(req: Request, res: Response) {
    try {
      const amendment = await ContractAmendmentService.approveAmendment(req.params.amendmentId as string, (req as any).user);
      return res.status(200).json(amendment);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  public static async activateAmendment(req: Request, res: Response) {
    try {
      const amendment = await ContractAmendmentService.activateAmendment(req.params.amendmentId as string, (req as any).user);
      return res.status(200).json(amendment);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  public static async createRenewal(req: Request, res: Response) {
    try {
      const renewal = await ContractRenewalService.createRenewal(req.params.id as string, req.body, (req as any).user);
      return res.status(201).json(renewal);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  public static async completeRenewal(req: Request, res: Response) {
    try {
      const renewal = await ContractRenewalService.completeSimpleRenewal(req.params.renewalId as string, (req as any).user);
      return res.status(200).json(renewal);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  public static async suspendContract(req: Request, res: Response) {
    try {
      const contract = await ContractService.suspendContract(req.params.id as string, req.body, (req as any).user);
      return res.status(200).json(contract);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  public static async reactivateContract(req: Request, res: Response) {
    try {
      const contract = await ContractService.reactivateContract(req.params.id as string, (req as any).user);
      return res.status(200).json(contract);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  public static async terminateContract(req: Request, res: Response) {
    try {
      const contract = await ContractService.terminateContract(req.params.id as string, req.body, (req as any).user);
      return res.status(200).json(contract);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  public static async getEffectiveTerms(req: Request, res: Response) {
    try {
      const producerId = req.params.producerId as string;
      const atDate = req.query.at ? new Date(req.query.at as string) : new Date();
      const terms = await ContractTermsProvider.getTermsForProducer(producerId, atDate);
      return res.status(200).json(terms);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
}
