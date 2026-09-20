import { prisma } from '../../../../core/database/prisma';
import { CommercialOfferingCompositionDTO } from '../../../../../../shared/types';

export class OfferingCompositionService {
  /**
   * Detecta se a adição de um filho criaria um ciclo na hierarquia de pacotes/ofertas (DFS).
   * Exemplo: Pacote A inclui Pacote B, e Pacote B tenta incluir Pacote A -> Ciclo!
   */
  public static async detectCycle(parentOfferingId: string, childOfferingId: string): Promise<boolean> {
    if (parentOfferingId === childOfferingId) {
      return true;
    }

    const visited = new Set<string>();
    const stack = [childOfferingId];

    while (stack.length > 0) {
      const currentId = stack.pop()!;
      if (currentId === parentOfferingId) {
        return true;
      }

      if (!visited.has(currentId)) {
        visited.add(currentId);

        // Busca todas as composições onde currentId é o pai
        const compositions = await prisma.commercialOfferingComposition.findMany({
          where: { parentOfferingId: currentId }
        });

        for (const comp of compositions) {
          if (comp.childOfferingId === parentOfferingId) {
            return true;
          }
          if (!visited.has(comp.childOfferingId)) {
            stack.push(comp.childOfferingId);
          }
        }
      }
    }

    return false;
  }

  /**
   * Valida lista de itens filhos antes de persistir uma nova versão ou composição.
   * Lança erro se houver ciclo ou itens inexistentes.
   */
  public static async validateCompositions(
    parentOfferingId: string,
    items: Array<{ childOfferingId: string; quantity?: number; required?: boolean }>
  ): Promise<void> {
    for (const item of items) {
      if (item.childOfferingId === parentOfferingId) {
        throw new Error(`Um pacote/plano não pode incluir a si próprio como componente.`);
      }

      const child = await prisma.commercialOffering.findUnique({
        where: { id: item.childOfferingId }
      });

      if (!child) {
        throw new Error(`Item componente de oferta ID "${item.childOfferingId}" não encontrado.`);
      }

      const hasCycle = await this.detectCycle(parentOfferingId, item.childOfferingId);
      if (hasCycle) {
        throw new Error(
          `Ciclo detectado na composição do pacote: o componente "${child.name}" (${child.code}) conteria recursivamente o próprio pacote pai.`
        );
      }
    }
  }

  /**
   * Persiste as composições de uma versão específica de uma oferta
   */
  public static async setCompositions(
    parentOfferingId: string,
    parentOfferingVersionId: string,
    items: Array<{
      childOfferingId: string;
      childOfferingVersionId?: string | null;
      quantity?: number;
      required?: boolean;
      sortOrder?: number;
    }>
  ): Promise<CommercialOfferingCompositionDTO[]> {
    // 1. Valida ausência de ciclos
    await this.validateCompositions(parentOfferingId, items);

    // 2. Remove composições antigas desta versão específica
    await prisma.commercialOfferingComposition.deleteMany({
      where: { parentOfferingVersionId }
    });

    // 3. Insere novas composições
    const createdList: CommercialOfferingCompositionDTO[] = [];
    let order = 1;

    for (const item of items) {
      const child = await prisma.commercialOffering.findUnique({
        where: { id: item.childOfferingId }
      });

      const comp = await prisma.commercialOfferingComposition.create({
        data: {
          parentOfferingId,
          parentOfferingVersionId,
          childOfferingId: item.childOfferingId,
          childOfferingVersionId: item.childOfferingVersionId || child?.currentVersionId || null,
          quantity: item.quantity && item.quantity > 0 ? item.quantity : 1,
          required: item.required !== undefined ? item.required : true,
          sortOrder: item.sortOrder || order++
        }
      });

      createdList.push({
        id: comp.id,
        parentOfferingId: comp.parentOfferingId,
        parentOfferingVersionId: comp.parentOfferingVersionId,
        childOfferingId: comp.childOfferingId,
        childOfferingPublicCode: child?.publicCode,
        childOfferingName: child?.name,
        childOfferingType: child?.type,
        childOfferingVersionId: comp.childOfferingVersionId,
        quantity: comp.quantity,
        required: comp.required,
        sortOrder: comp.sortOrder,
        createdAt: comp.createdAt ? new Date(comp.createdAt).toISOString() : new Date().toISOString()
      });
    }

    return createdList;
  }

  /**
   * Lista as composições de uma versão ou de uma oferta
   */
  public static async listCompositions(
    parentOfferingId: string,
    parentOfferingVersionId?: string
  ): Promise<CommercialOfferingCompositionDTO[]> {
    const where: any = { parentOfferingId };
    if (parentOfferingVersionId) {
      where.parentOfferingVersionId = parentOfferingVersionId;
    }

    const comps = await prisma.commercialOfferingComposition.findMany({ where });

    return comps.map((comp: any) => ({
      id: comp.id,
      parentOfferingId: comp.parentOfferingId,
      parentOfferingVersionId: comp.parentOfferingVersionId,
      childOfferingId: comp.childOfferingId,
      childOfferingPublicCode: comp.childOffering?.publicCode || comp.childOfferingPublicCode,
      childOfferingName: comp.childOffering?.name || comp.childOfferingName,
      childOfferingType: comp.childOffering?.type || comp.childOfferingType,
      childOfferingVersionId: comp.childOfferingVersionId,
      quantity: comp.quantity,
      required: comp.required,
      sortOrder: comp.sortOrder,
      createdAt: comp.createdAt ? new Date(comp.createdAt).toISOString() : new Date().toISOString()
    }));
  }
}
