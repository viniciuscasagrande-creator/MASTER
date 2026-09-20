import { WorkerRegistry } from './worker.registry';
import { EventBus } from '../../events/event-bus';

export class HeartbeatService {
  private registry: WorkerRegistry;
  private readonly offlineThresholdMs: number = 60000; // 60s without heartbeat = offline

  constructor(registry?: WorkerRegistry) {
    this.registry = registry || WorkerRegistry.getInstance();
  }

  public recordHeartbeat(workerId: string, metrics?: any): void {
    this.registry.updateHeartbeat(workerId, metrics);
  }

  public async checkWorkerHealth(): Promise<{ healthyCount: number; offlineWorkers: string[] }> {
    const workers = this.registry.list();
    const now = Date.now();
    const offlineWorkers: string[] = [];

    for (const worker of workers) {
      const lastHb = new Date(worker.lastHeartbeatAt).getTime();
      if (now - lastHb > this.offlineThresholdMs) {
        if (worker.status !== 'OFFLINE') {
          this.registry.setStatus(worker.id, 'OFFLINE');
          offlineWorkers.push(worker.id);

          try {
            await EventBus.publish({
              id: `evt_wrk_offline_${worker.id}_${now}`,
              type: 'SUPPORT_INCIDENT_OPENED',
              resourceType: 'WORKER',
              resourceId: worker.id,
              actorUserId: 'SYSTEM',
              data: {
                workerId: worker.id,
                name: worker.name,
                lastHeartbeatAt: worker.lastHeartbeatAt,
                severity: 'HIGH'
              },
              timestamp: new Date()
            });
          } catch {}
        }
      }
    }

    const healthyCount = workers.filter(w => w.status !== 'OFFLINE').length;
    return { healthyCount, offlineWorkers };
  }
}
