import React, { useState, useEffect } from 'react';
import { Users, Clock, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { Badge } from '../../shared/components/Badge';
import { useDiskContext } from '../../core/context/DiskContext';
import { TeamItem } from './tasks.types';

export const TeamAdminView: React.FC = () => {
  const { apiFetch } = useDiskContext();

  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch('/api/v1/tasks/admin/teams');
      if (res.ok) {
        const json = await res.json();
        setTeams(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-amber-400" /> Equipes Operacionais & Escala de Plantão
        </h2>
        <p className="text-xs text-slate-400">
          Distribuição inteligente por carga ponderada e roteamento de plantão
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400">Carregando equipes operacionais...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => {
            const members = (team as any).members || [];
            return (
              <div
                key={team.id}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {team.code}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1">{team.name}</h3>
                    </div>
                    <Badge variant={team.isActive ? 'success' : 'default'}>
                      {team.isActive ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>

                  {team.description && (
                    <p className="text-xs text-slate-400">{team.description}</p>
                  )}

                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs space-y-1">
                    <div className="text-slate-400">Líder Responsável:</div>
                    <div className="text-white font-medium">{team.leaderUserId || 'Coordenação Geral'}</div>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-slate-500" />
                    <span>{members.length} membros vinculados</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
