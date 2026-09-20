import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Clock,
  Award,
  Plus,
  RefreshCw,
  ShieldAlert,
  UserCheck,
  Calendar,
  AlertTriangle,
  Phone,
  Mail,
  Building,
  CheckCircle2
} from 'lucide-react';
import {
  EventTeamDTO,
  EventTeamMemberDTO,
  EventTeamShiftDTO,
  EventResponsibilityDTO
} from '@shared/types/index';
import {
  fetchEventTeams,
  fetchTeamMembers,
  fetchShifts,
  fetchResponsibilities
} from '../api/team.api';
import { StatCard } from '../../../shared/components/StatCard';
import { Badge } from '../../../shared/components/Badge';
import { formatNumber, formatDateTime } from '../../../shared/utils/formatters';
import { AddTeamMemberModal } from './AddTeamMemberModal';
import { AddShiftModal } from './AddShiftModal';
import { AssignResponsibilityModal } from './AssignResponsibilityModal';

interface EventTeamPageProps {
  eventId: string;
  eventName?: string;
}

export const EventTeamPage: React.FC<EventTeamPageProps> = ({
  eventId,
  eventName
}) => {
  const [teams, setTeams] = useState<EventTeamDTO[]>([]);
  const [members, setMembers] = useState<EventTeamMemberDTO[]>([]);
  const [shifts, setShifts] = useState<EventTeamShiftDTO[]>([]);
  const [responsibilities, setResponsibilities] = useState<EventResponsibilityDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'members' | 'shifts' | 'responsibilities'>('members');

  // Modais
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isRespModalOpen, setIsRespModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tData, mData, sData, rData] = await Promise.all([
        fetchEventTeams(eventId),
        fetchTeamMembers(eventId),
        fetchShifts(eventId),
        fetchResponsibilities(eventId)
      ]);
      setTeams(tData || []);
      setMembers(mData || []);
      setShifts(sData || []);
      setResponsibilities(rData || []);
    } catch (err) {
      console.error('Erro ao carregar equipe e escalas:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Equipe do Evento, Escalas & Coordenação</h1>
            <Badge variant="info">Fase 1.2.7</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Escalação de postos de trabalho, turnos por sessão, líderes operacionais e contatos de contingência.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
          {activeTab === 'members' && (
            <button
              onClick={() => setIsMemberModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar Membro</span>
            </button>
          )}
          {activeTab === 'shifts' && (
            <button
              onClick={() => setIsShiftModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              <span>Agendar Turno</span>
            </button>
          )}
          {activeTab === 'responsibilities' && (
            <button
              onClick={() => setIsRespModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              <span>Atribuir Responsabilidade</span>
            </button>
          )}
        </div>
      </div>

      {/* Aviso de Invariante de Segurança (Decoupled RBAC) */}
      <div className="flex items-start gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-xs text-indigo-300">
        <ShieldAlert className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
        <div>
          <strong className="text-white block mb-0.5">Desacoplamento de Segurança (RBAC vs. Operação):</strong>
          Membros e coordenadores cadastrados nesta tela representam a escala operacional no local (crachás, contingência, sangrias e turnos). Eles <strong>não recebem</strong> permissões sistêmicas administrativas automáticas no painel.
        </div>
      </div>

      {/* Cards de Métricas Operacionais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Membros Escalados"
          value={formatNumber(members.length)}
          subtitle="Colaboradores cadastrados"
          icon={<Users className="h-5 w-5 text-indigo-400" />}
        />
        <StatCard
          title="Equipes Funcionais"
          value={formatNumber(teams.length)}
          subtitle="Frentes de trabalho ativas"
          icon={<Building className="h-5 w-5 text-cyan-400" />}
        />
        <StatCard
          title="Turnos Agendados"
          value={formatNumber(shifts.length)}
          subtitle="Escalas programadas"
          icon={<Clock className="h-5 w-5 text-amber-400" />}
        />
        <StatCard
          title="Responsáveis Formais"
          value={formatNumber(responsibilities.length)}
          subtitle="Líderes de bilheteria e acesso"
          icon={<Award className="h-5 w-5 text-emerald-400" />}
        />
      </div>

      {/* Abas */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'members'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Membros da Equipe ({members.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('shifts')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'shifts'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Escalas & Turnos ({shifts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('responsibilities')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'responsibilities'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Responsabilidades Formais ({responsibilities.length})</span>
        </button>
      </div>

      {/* Aba 1: Membros */}
      {activeTab === 'members' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Nome do Colaborador</th>
                  <th className="py-3 px-4">Função / Cargo</th>
                  <th className="py-3 px-4">Equipe</th>
                  <th className="py-3 px-4">Contato</th>
                  <th className="py-3 px-4">Contato de Emergência</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {members.map(m => (
                  <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs">
                        {m.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span>{m.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">{m.roleName}</td>
                    <td className="py-3.5 px-4 text-slate-400">{m.teamName || 'Geral'}</td>
                    <td className="py-3.5 px-4 text-slate-400">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-500" />
                        <span>{m.email}</span>
                      </div>
                      {m.phone && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <Phone className="h-3 w-3 text-slate-500" />
                          <span>{m.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {m.emergencyContact || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={m.active ? 'success' : 'default'}>
                        {m.active ? 'Escalado' : 'Inativo'}
                      </Badge>
                    </td>
                  </tr>
                ))}

                {members.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                      Nenhum membro cadastrado na equipe operacional.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Aba 2: Escalas & Turnos */}
      {activeTab === 'shifts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shifts.map(shift => {
              const assigned = shift.assignedMembers || [];

              return (
                <div key={shift.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{shift.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-normal">
                          {shift.teamName || 'Equipe'}
                        </span>
                      </div>
                      <div className="text-xs text-indigo-400 mt-0.5">
                        {shift.sessionName || 'Evento Geral'}
                      </div>
                    </div>
                    <Badge variant={shift.active ? 'info' : 'default'}>
                      {shift.active ? 'Confirmado' : 'Cancelado'}
                    </Badge>
                  </div>

                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 text-xs flex items-center justify-between text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      <span>{formatDateTime(shift.startAt)}</span>
                    </div>
                    <span className="text-slate-600">até</span>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      <span>{formatDateTime(shift.endAt)}</span>
                    </div>
                  </div>

                  {/* Membros Alocados no Turno */}
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 mb-1.5">
                      Membros Escalados ({assigned.length}):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {assigned.map(m => (
                        <span
                          key={m.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-300"
                        >
                          <UserCheck className="h-3 w-3 text-emerald-400" />
                          <span>{m.name}</span>
                          <span className="text-[10px] text-slate-500">({m.roleName})</span>
                        </span>
                      ))}
                      {assigned.length === 0 && (
                        <span className="text-xs text-amber-400/80 italic flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Nenhum membro alocado neste turno ainda</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {shifts.length === 0 && (
              <div className="col-span-2 p-12 text-center text-xs text-slate-500 rounded-2xl border border-slate-800 bg-slate-900/40">
                Nenhum turno ou escala cadastrada para o evento.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Aba 3: Responsabilidades Formais */}
      {activeTab === 'responsibilities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {responsibilities.map(r => (
            <div key={r.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{r.title}</div>
                    <div className="text-[11px] font-mono text-slate-400">{r.responsibilityType}</div>
                  </div>
                </div>
                <Badge variant="success">Ativo</Badge>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 text-xs space-y-1">
                <div>
                  <span className="text-slate-500 text-[11px] block">Membro Designado:</span>
                  <strong className="text-slate-200">{r.memberName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Escopo:</span>
                  <span className="text-slate-300 font-medium">
                    {r.scope === 'EVENT' ? 'Evento Completo' : r.scopeName || r.scope}
                  </span>
                </div>
              </div>

              {r.notes && (
                <p className="text-xs text-slate-400 italic">"{r.notes}"</p>
              )}
            </div>
          ))}

          {responsibilities.length === 0 && (
            <div className="col-span-3 p-12 text-center text-xs text-slate-500 rounded-2xl border border-slate-800 bg-slate-900/40">
              Nenhuma responsabilidade formal atribuída para este evento.
            </div>
          )}
        </div>
      )}

      {/* Modais */}
      {isMemberModalOpen && (
        <AddTeamMemberModal
          isOpen={isMemberModalOpen}
          onClose={() => setIsMemberModalOpen(false)}
          eventId={eventId}
          teams={teams}
          onSaved={loadData}
        />
      )}

      {isShiftModalOpen && (
        <AddShiftModal
          isOpen={isShiftModalOpen}
          onClose={() => setIsShiftModalOpen(false)}
          eventId={eventId}
          teams={teams}
          onSaved={loadData}
        />
      )}

      {isRespModalOpen && (
        <AssignResponsibilityModal
          isOpen={isRespModalOpen}
          onClose={() => setIsRespModalOpen(false)}
          eventId={eventId}
          members={members}
          onSaved={loadData}
        />
      )}
    </div>
  );
};
