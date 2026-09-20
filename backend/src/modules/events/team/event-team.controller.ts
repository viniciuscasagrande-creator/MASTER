import { Request, Response } from 'express';
import { EventTeamService } from './event-team.service';
import { TeamSchedulingService } from './team-scheduling.service';
import { ResponsibilityService } from './responsibility.service';

export class EventTeamController {
  // Equipes
  static async listTeams(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const teams = await EventTeamService.listTeams(eventId);
      res.json(teams);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao listar equipes do evento' });
    }
  }

  static async createTeam(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const team = await EventTeamService.createTeam(eventId, req.body);
      res.status(201).json(team);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao criar equipe' });
    }
  }

  // Membros
  static async listMembers(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const teamId = req.query.teamId as string | undefined;
      const members = await EventTeamService.listMembers(eventId, teamId);
      res.json(members);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao listar membros' });
    }
  }

  static async addMember(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const member = await EventTeamService.addMember(eventId, req.body);
      res.status(201).json(member);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao adicionar membro à equipe' });
    }
  }

  static async updateMember(req: Request, res: Response): Promise<void> {
    try {
      const memberId = req.params.memberId as string;
      const updated = await EventTeamService.updateMember(memberId, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao atualizar membro' });
    }
  }

  // Turnos & Escala
  static async listShifts(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const teamId = req.query.teamId as string | undefined;
      const sessionId = req.query.sessionId as string | undefined;
      const shifts = await TeamSchedulingService.listShifts(eventId, teamId, sessionId);
      res.json(shifts);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao listar escalas e turnos' });
    }
  }

  static async createShift(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const shift = await TeamSchedulingService.createShift(eventId, req.body);
      res.status(201).json(shift);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao criar turno de trabalho' });
    }
  }

  static async assignMembersToShift(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const shiftId = req.params.shiftId as string;
      const { memberIds } = req.body;
      const result = await TeamSchedulingService.assignMembersToShift(eventId, shiftId, memberIds || []);
      if (result.conflicts && result.conflicts.length > 0) {
        res.status(409).json({
          error: 'Conflito de escala detectado para um ou mais membros',
          conflicts: result.conflicts
        });
        return;
      }
      res.json({ success: true, assignedCount: result.assignedCount });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao alocar membros no turno' });
    }
  }

  static async removeMemberFromShift(req: Request, res: Response): Promise<void> {
    try {
      const shiftId = req.params.shiftId as string;
      const memberId = req.params.memberId as string;
      await TeamSchedulingService.removeMemberFromShift(shiftId, memberId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao desvincular membro da escala' });
    }
  }

  // Responsabilidades Operacionais
  static async listResponsibilities(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const responsibilities = await ResponsibilityService.listResponsibilities(eventId);
      res.json(responsibilities);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao listar responsabilidades operacionais' });
    }
  }

  static async assignResponsibility(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const resp = await ResponsibilityService.assignResponsibility(eventId, req.body);
      res.status(201).json(resp);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao atribuir responsabilidade operacional' });
    }
  }
}
