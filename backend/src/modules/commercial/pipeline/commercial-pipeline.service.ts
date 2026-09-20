import { prisma } from '../../../core/database/prisma';
import {
  CommercialPipelineDTO,
  CommercialPipelineStageDTO,
  OpportunityCloseReasonDTO,
  PipelineStageType
} from '../../../../../shared/types';

export class CommercialPipelineService {
  /**
   * Obtém o pipeline comercial padrão completo com estágios ordenados por posição
   */
  public static async getDefaultPipeline(): Promise<CommercialPipelineDTO> {
    let pipeline = await prisma.commercialPipeline.findFirst({
      where: { isDefault: true, active: true }
    });

    if (!pipeline) {
      pipeline = await prisma.commercialPipeline.findFirst({ where: { active: true } });
    }

    if (!pipeline) {
      throw new Error('Nenhum pipeline comercial configurado no sistema.');
    }

    const stages = await prisma.commercialPipelineStage.findMany({
      where: { pipelineId: pipeline.id, active: true }
    });

    stages.sort((a: any, b: any) => a.position - b.position);

    return {
      id: pipeline.id,
      name: pipeline.name,
      active: pipeline.active,
      isDefault: pipeline.isDefault,
      version: pipeline.version,
      stages: stages.map((s: any) => ({
        id: s.id,
        pipelineId: s.pipelineId,
        name: s.name,
        code: s.code,
        position: s.position,
        stageType: s.stageType as PipelineStageType,
        active: s.active,
        createdAt: new Date(s.createdAt).toISOString(),
        updatedAt: new Date(s.updatedAt).toISOString()
      })),
      createdAt: new Date(pipeline.createdAt).toISOString(),
      updatedAt: new Date(pipeline.updatedAt).toISOString()
    };
  }

  /**
   * Lista todos os pipelines
   */
  public static async listPipelines(): Promise<CommercialPipelineDTO[]> {
    const pipelines = await prisma.commercialPipeline.findMany({ where: { active: true } });
    const stages = await prisma.commercialPipelineStage.findMany({ where: { active: true } });

    return pipelines.map((p: any) => {
      const pStages = stages
        .filter((s: any) => s.pipelineId === p.id)
        .sort((a: any, b: any) => a.position - b.position);

      return {
        id: p.id,
        name: p.name,
        active: p.active,
        isDefault: p.isDefault,
        version: p.version,
        stages: pStages.map((s: any) => ({
          id: s.id,
          pipelineId: s.pipelineId,
          name: s.name,
          code: s.code,
          position: s.position,
          stageType: s.stageType as PipelineStageType,
          active: s.active,
          createdAt: new Date(s.createdAt).toISOString(),
          updatedAt: new Date(s.updatedAt).toISOString()
        })),
        createdAt: new Date(p.createdAt).toISOString(),
        updatedAt: new Date(p.updatedAt).toISOString()
      };
    });
  }

  /**
   * Lista estágios de um pipeline específico
   */
  public static async listStages(pipelineId: string): Promise<CommercialPipelineStageDTO[]> {
    const stages = await prisma.commercialPipelineStage.findMany({
      where: { pipelineId, active: true }
    });

    stages.sort((a: any, b: any) => a.position - b.position);

    return stages.map((s: any) => ({
      id: s.id,
      pipelineId: s.pipelineId,
      name: s.name,
      code: s.code,
      position: s.position,
      stageType: s.stageType as PipelineStageType,
      active: s.active,
      createdAt: new Date(s.createdAt).toISOString(),
      updatedAt: new Date(s.updatedAt).toISOString()
    }));
  }

  /**
   * Catálogo de motivos objetivos de encerramento de negociações
   */
  public static async listCloseReasons(): Promise<OpportunityCloseReasonDTO[]> {
    const reasons = await prisma.opportunityCloseReason.findMany({ where: { active: true } });
    reasons.sort((a: any, b: any) => a.sortOrder - b.sortOrder);

    return reasons.map((r: any) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      active: r.active,
      sortOrder: r.sortOrder
    }));
  }
}
