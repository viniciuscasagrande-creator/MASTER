import { MigrationProject, MigrationStage } from '@shared/types/index';
import { prisma } from '../../core/database/prisma';
import { EventBus } from '../../events/event-bus';
import { LegacyIdService } from './legacy-id.service';
import { ReconciliationService } from './reconciliation.service';

export class MigrationService {
  /**
   * Creates a new Migration Project with default or custom stages
   */
  public static async createProject(
    name: string,
    description: string,
    sourceSystem: string,
    customStages?: MigrationStage[]
  ): Promise<MigrationProject> {
    const defaultStages: MigrationStage[] = [
      {
        stageNumber: 1,
        entityType: 'SUPPLIERS',
        dependsOn: [],
        status: 'PENDING',
        totalRecords: 0,
        migratedRecords: 0,
        divergentRecords: 0
      },
      {
        stageNumber: 2,
        entityType: 'EVENT_PARTICIPANTS',
        dependsOn: ['SUPPLIERS'],
        status: 'PENDING',
        totalRecords: 0,
        migratedRecords: 0,
        divergentRecords: 0
      },
      {
        stageNumber: 3,
        entityType: 'CUSTOMERS',
        dependsOn: [],
        status: 'PENDING',
        totalRecords: 0,
        migratedRecords: 0,
        divergentRecords: 0
      },
      {
        stageNumber: 4,
        entityType: 'LEGACY_ORDERS',
        dependsOn: ['EVENT_PARTICIPANTS', 'CUSTOMERS'],
        status: 'PENDING',
        totalRecords: 0,
        migratedRecords: 0,
        divergentRecords: 0
      },
      {
        stageNumber: 5,
        entityType: 'FINANCIAL_TRANSACTIONS',
        dependsOn: ['LEGACY_ORDERS'],
        status: 'PENDING',
        totalRecords: 0,
        migratedRecords: 0,
        divergentRecords: 0
      }
    ];

    const stages = customStages && customStages.length > 0 ? customStages : defaultStages;

    const record = await prisma.migrationProjectModel.create({
      data: {
        name,
        description,
        sourceSystem,
        stages: JSON.stringify(stages),
        status: 'PLANNING',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return {
      id: record.id,
      name: record.name,
      description: record.description || null,
      sourceSystem: record.sourceSystem,
      stages,
      status: 'PLANNING',
      createdAt: record.createdAt.toISOString ? record.createdAt.toISOString() : record.createdAt,
      updatedAt: record.updatedAt.toISOString ? record.updatedAt.toISOString() : record.updatedAt
    };
  }

  /**
   * List all migration projects
   */
  public static async listProjects(): Promise<MigrationProject[]> {
    const records = await prisma.migrationProjectModel.findMany();
    return records.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description || null,
      sourceSystem: r.sourceSystem,
      stages: typeof r.stages === 'string' ? JSON.parse(r.stages) : r.stages,
      status: r.status as any,
      createdAt: r.createdAt.toISOString ? r.createdAt.toISOString() : r.createdAt,
      updatedAt: r.updatedAt.toISOString ? r.updatedAt.toISOString() : r.updatedAt
    }));
  }

  /**
   * Get migration project by ID
   */
  public static async getProject(id: string): Promise<MigrationProject> {
    const r = await prisma.migrationProjectModel.findUnique({ where: { id } });
    if (!r) throw new Error(`Projeto de migração "${id}" não encontrado.`);

    return {
      id: r.id,
      name: r.name,
      description: r.description || null,
      sourceSystem: r.sourceSystem,
      stages: typeof r.stages === 'string' ? JSON.parse(r.stages) : r.stages,
      status: r.status as any,
      createdAt: r.createdAt.toISOString ? r.createdAt.toISOString() : r.createdAt,
      updatedAt: r.updatedAt.toISOString ? r.updatedAt.toISOString() : r.updatedAt
    };
  }

  /**
   * Execute stage of migration verifying DAG dependencies
   */
  public static async executeStage(
    projectId: string,
    stageNumber: number,
    records: { legacyId: string; data: Record<string, any> }[],
    reconciliationMeta?: { sourceCount: number; sourceSum?: number; sumFieldName?: string }
  ): Promise<MigrationProject> {
    const project = await this.getProject(projectId);
    const stage = project.stages.find(s => s.stageNumber === stageNumber);
    if (!stage) throw new Error(`Etapa de migração #${stageNumber} não encontrada no projeto.`);

    // 1. Dependency check
    for (const depType of stage.dependsOn) {
      const depStage = project.stages.find(s => s.entityType === depType);
      if (depStage && depStage.status !== 'COMPLETED') {
        throw new Error(`Dependência não satisfeita: a etapa anterior "${depStage.entityType}" deve ser concluída antes.`);
      }
    }

    // 2. Mark stage as RUNNING
    stage.status = 'RUNNING';
    stage.totalRecords = records.length;
    project.status = 'EXECUTING';

    const migratedTargetRecords: any[] = [];

    try {
      for (const item of records) {
        const newId = `mig-${stage.entityType.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        await LegacyIdService.registerMapping(projectId, project.sourceSystem, stage.entityType, item.legacyId, newId);
        migratedTargetRecords.push({ ...item.data, id: newId });
      }

      stage.migratedRecords = migratedTargetRecords.length;
      stage.divergentRecords = 0;
      stage.status = 'COMPLETED';

      // 3. Perform reconciliation if provided
      if (reconciliationMeta) {
        await ReconciliationService.reconcile({
          migrationId: projectId,
          entityType: stage.entityType,
          sourceCount: reconciliationMeta.sourceCount,
          sourceSum: reconciliationMeta.sourceSum,
          targetEntityRecords: migratedTargetRecords,
          sumFieldName: reconciliationMeta.sumFieldName
        });
      }

      // Check if all stages completed
      const allCompleted = project.stages.every(s => s.status === 'COMPLETED');
      if (allCompleted) {
        project.status = 'COMPLETED';
        await EventBus.publish({
          id: `evt-mig-${Date.now()}`,
          type: 'DATA_MIGRATION_COMPLETED',
          resourceType: 'MIGRATION_PROJECT',
          resourceId: project.id,
          timestamp: new Date(),
          data: {
            projectId: project.id,
            projectName: project.name,
            totalStages: project.stages.length,
            completedAt: new Date().toISOString()
          }
        });
      }

      await prisma.migrationProjectModel.update({
        where: { id: projectId },
        data: {
          stages: JSON.stringify(project.stages),
          status: project.status,
          updatedAt: new Date()
        }
      });

      return project;
    } catch (err: any) {
      stage.status = 'FAILED';
      project.status = 'FAILED';

      await prisma.migrationProjectModel.update({
        where: { id: projectId },
        data: {
          stages: JSON.stringify(project.stages),
          status: project.status,
          updatedAt: new Date()
        }
      });
      throw err;
    }
  }
}
