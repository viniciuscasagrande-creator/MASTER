import { Request, Response } from 'express';
import { ConfigurationService } from '../../core/configuration/configuration.service';
import { ConfigurationRegistry } from '../../core/configuration/configuration.registry';
import { ConfigurationRepository } from '../../core/configuration/configuration.repository';
import { AuthenticatedUser } from '../../core/middleware/authenticate';

export class ConfigurationController {
  public static async getEffective(req: Request, res: Response): Promise<void> {
    const key = req.params.key as string;
    const producerId = (req.query.producerId as string) || (req.headers['x-producer-id'] as string) || null;
    const eventId = (req.query.eventId as string) || (req.headers['x-event-id'] as string) || null;

    const result = await ConfigurationService.getEffective(key, { producerId, eventId });
    res.json(result);
  }

  public static async getAllEffective(req: Request, res: Response): Promise<void> {
    const domain = (req.query.domain as string) || undefined;
    const producerId = (req.query.producerId as string) || (req.headers['x-producer-id'] as string) || null;
    const eventId = (req.query.eventId as string) || (req.headers['x-event-id'] as string) || null;

    const results = await ConfigurationService.getAllEffective(domain, { producerId, eventId });
    res.json(results);
  }

  public static async listDefinitions(req: Request, res: Response): Promise<void> {
    const domain = (req.query.domain as string) || undefined;
    const definitions = await ConfigurationRepository.listDefinitions(domain);
    const registryDefs = domain ? ConfigurationRegistry.listByDomain(domain) : ConfigurationRegistry.list();

    res.json({
      definitions,
      registry: registryDefs
    });
  }

  public static async setOverride(req: Request, res: Response): Promise<void> {
    const user = (req as any).user as AuthenticatedUser;
    const key = req.params.key as string;
    const { scopeType, producerId, eventId, value, changeReason, effectiveFrom, effectiveUntil } = req.body;

    const result = await ConfigurationService.setOverride(
      key,
      {
        scopeType,
        producerId,
        eventId,
        value,
        changeReason,
        effectiveFrom,
        effectiveUntil
      },
      user
    );

    res.status(200).json(result);
  }

  public static async removeOverride(req: Request, res: Response): Promise<void> {
    const user = (req as any).user as AuthenticatedUser;
    const key = req.params.key as string;
    const { scopeType, producerId, eventId, changeReason } = req.body;

    const result = await ConfigurationService.removeOverride(
      key,
      {
        scopeType,
        producerId,
        eventId,
        changeReason: changeReason || 'Remoção de override de configuração'
      },
      user
    );

    res.status(200).json(result);
  }

  public static async getHistory(req: Request, res: Response): Promise<void> {
    const key = (req.query.key as string) || undefined;
    const producerId = (req.query.producerId as string) || undefined;
    const take = parseInt(req.query.take as string) || 50;

    const history = await ConfigurationService.getHistory(key, producerId, take);
    res.json(history);
  }
}
