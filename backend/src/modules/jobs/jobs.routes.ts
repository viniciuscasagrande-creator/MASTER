import { Router } from 'express';
import { JobsController } from './jobs.controller';

export const createJobsRoutes = (controller?: JobsController): Router => {
  const router = Router();
  const ctrl = controller || new JobsController();

  // Overview Stats & Metadata
  router.get('/stats', ctrl.getStats);
  router.get('/registry', ctrl.getRegistry);

  // Jobs CRUD & Actions
  router.get('/', ctrl.listJobs);
  router.post('/', ctrl.createJob);
  router.get('/:id', ctrl.getJob);
  router.get('/:id/history', ctrl.getHistory);
  router.get('/:id/progress', ctrl.getProgress);
  router.post('/:id/cancel', ctrl.cancelJob);
  router.post('/:id/pause', ctrl.pauseJob);
  router.post('/:id/resume', ctrl.resumeJob);
  router.post('/:id/retry', ctrl.retryJob);

  return router;
};

export const createJobBatchesRoutes = (controller?: JobsController): Router => {
  const router = Router();
  const ctrl = controller || new JobsController();

  router.get('/', ctrl.listBatches);
  router.post('/', ctrl.createBatch);
  router.get('/:id', ctrl.getBatch);
  router.post('/:id/retry-failures', ctrl.retryBatchFailures);
  router.post('/:id/cancel', ctrl.cancelBatch);

  return router;
};

export const createJobSchedulesRoutes = (controller?: JobsController): Router => {
  const router = Router();
  const ctrl = controller || new JobsController();

  router.get('/', ctrl.listSchedules);
  router.post('/', ctrl.createSchedule);
  router.get('/:id', async (req, res) => {
    try {
      const schedule = await (ctrl as any).schedulerService.findById(req.params.id);
      if (!schedule) {
        res.status(404).json({ error: 'Agendamento não encontrado.' });
        return;
      }
      res.json(schedule);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
  router.patch('/:id', ctrl.updateSchedule);
  router.delete('/:id', ctrl.deleteSchedule);
  router.post('/:id/run-now', ctrl.runScheduleNow);
  router.post('/:id/enable', ctrl.toggleSchedule);
  router.post('/:id/disable', ctrl.toggleSchedule);

  return router;
};

export const createAdminProcessingRoutes = (controller?: JobsController): Router => {
  const router = Router();
  const ctrl = controller || new JobsController();

  router.get('/workers', ctrl.listWorkers);
  router.get('/queues', ctrl.listQueues);
  router.get('/dead-letters', ctrl.listDeadLetters);
  router.post('/dead-letters/:id/investigate', ctrl.investigateDeadLetter);
  router.post('/dead-letters/:id/reprocess', ctrl.reprocessDeadLetter);

  return router;
};
