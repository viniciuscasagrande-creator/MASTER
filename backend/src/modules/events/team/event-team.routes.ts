import { Router } from 'express';
import { EventTeamController } from './event-team.controller';
import { requirePermission } from '../../../core/middleware/requirePermission';

const router = Router({ mergeParams: true });

// Equipes
router.get('/teams', requirePermission('eventos.equipe.visualizar'), EventTeamController.listTeams);
router.post('/teams', requirePermission('eventos.equipe.gerenciar'), EventTeamController.createTeam);

// Membros
router.get('/members', requirePermission('eventos.equipe.visualizar'), EventTeamController.listMembers);
router.post('/members', requirePermission('eventos.equipe.gerenciar'), EventTeamController.addMember);
router.put('/members/:memberId', requirePermission('eventos.equipe.gerenciar'), EventTeamController.updateMember);

// Turnos e Escalas
router.get('/shifts', requirePermission('eventos.equipe.visualizar'), EventTeamController.listShifts);
router.post('/shifts', requirePermission('eventos.equipe.escalar'), EventTeamController.createShift);
router.post('/shifts/:shiftId/assign', requirePermission('eventos.equipe.escalar'), EventTeamController.assignMembersToShift);
router.delete('/shifts/:shiftId/members/:memberId', requirePermission('eventos.equipe.escalar'), EventTeamController.removeMemberFromShift);

// Responsabilidades Operacionais
router.get('/responsibilities', requirePermission('eventos.equipe.visualizar'), EventTeamController.listResponsibilities);
router.post('/responsibilities', requirePermission('eventos.equipe.gerenciar'), EventTeamController.assignResponsibility);

export default router;
