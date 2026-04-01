import { Mission } from '../types';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Play, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface MissionListProps {
  missions: Mission[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function MissionList({ missions, selectedId, onSelect }: MissionListProps) {
  if (missions.length === 0) {
    return (
      <div className="p-4 text-center text-gray-600 text-sm">
        No missions found. Start a simulation below.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {missions.map((mission) => {
        const isSelected = mission.id === selectedId;
        
        return (
          <button
            key={mission.id}
            onClick={() => onSelect(mission.id)}
            className={cn(
              "text-left p-4 border-b border-gray-800 transition-colors hover:bg-[#1a1a1a]",
              isSelected && "bg-[#1a1a1a] border-l-2 border-l-emerald-500"
            )}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-gray-400 truncate max-w-[180px]">
                {mission.target}
              </span>
              <StatusIcon status={mission.status} />
            </div>
            
            <div className="flex justify-between items-end">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                  {mission.status}
                </span>
                <span className="text-[10px] text-gray-600">
                  {mission.createdAt?.toDate ? formatDistanceToNow(mission.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                </span>
              </div>
              
              {mission.status === 'running' && (
                <div className="text-emerald-500 text-xs font-bold">
                  {mission.progress}%
                </div>
              )}
            </div>
            
            {mission.status === 'running' && (
              <div className="mt-3 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                  style={{ width: `${mission.progress}%` }}
                />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function StatusIcon({ status }: { status: Mission['status'] }) {
  switch (status) {
    case 'pending':
      return <Clock size={14} className="text-gray-500" />;
    case 'running':
      return <Play size={14} className="text-emerald-500 animate-pulse" />;
    case 'completed':
      return <CheckCircle2 size={14} className="text-blue-500" />;
    case 'failed':
      return <XCircle size={14} className="text-red-500" />;
  }
}
