import { prisma } from '../../../core/database/prisma';
import { ValidateRequirementsInput, RequirementValidationResult } from '../document.types';

export class DocumentRequirementService {
  /**
   * Validate if all required documents for an operation are present
   */
  public static async validateRequirements(
    input: ValidateRequirementsInput
  ): Promise<RequirementValidationResult> {
    const { operation, amount, producerId, eventId, linkedCategoryCodes } = input;

    // Fetch requirements for this operation
    const requirements = await prisma.documentRequirement.findMany({
      where: { operation }
    });

    if (!requirements || requirements.length === 0) {
      return {
        valid: true,
        operation,
        requiredCategories: [],
        missingCategories: []
      };
    }

    // Filter by scope hierarchy: Event > Producer > Global
    let applicableRequirements = requirements.filter((req: any) => {
      // Event scope match
      if (req.eventId && eventId && req.eventId !== eventId) return false;
      // Producer scope match
      if (req.producerId && producerId && req.producerId !== producerId) return false;
      // Amount range check
      if (amount !== undefined) {
        if (req.minAmount !== null && amount < req.minAmount) return false;
        if (req.maxAmount !== null && amount > req.maxAmount) return false;
      }
      return true;
    });

    if (applicableRequirements.length === 0) {
      return {
        valid: true,
        operation,
        requiredCategories: [],
        missingCategories: []
      };
    }

    // Sort by specificity: eventId present first, then producerId present, then global
    applicableRequirements.sort((a: any, b: any) => {
      const scoreA = (a.eventId ? 2 : 0) + (a.producerId ? 1 : 0);
      const scoreB = (b.eventId ? 2 : 0) + (b.producerId ? 1 : 0);
      return scoreB - scoreA;
    });

    // Pick most specific rule
    const rule = applicableRequirements[0];
    let requiredCategories: string[] = [];

    try {
      requiredCategories = typeof rule.requiredCategories === 'string'
        ? JSON.parse(rule.requiredCategories)
        : rule.requiredCategories;
    } catch {
      requiredCategories = [];
    }

    const normalizedAttached = linkedCategoryCodes.map(c => c.toUpperCase());
    const missingCategories = requiredCategories.filter(
      reqCat => !normalizedAttached.includes(reqCat.toUpperCase())
    );

    const valid = missingCategories.length === 0;

    return {
      valid,
      operation,
      requiredCategories,
      missingCategories,
      message: valid
        ? 'Todos os documentos obrigatórios foram fornecidos.'
        : `Documentos obrigatórios ausentes: ${missingCategories.join(', ')}. Anexe os comprovantes necessários.`
    };
  }
}
