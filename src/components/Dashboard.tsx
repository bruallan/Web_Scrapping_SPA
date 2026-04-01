import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Mission } from '../types';
import MissionList from './MissionList';
import MissionDetails from './MissionDetails';
import Simulator from './Simulator';
import { Activity, LogOut } from 'lucide-react';

export default function Dashboard() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'missions'),
      where('ownerId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const missionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Mission[];
      setMissions(missionsData);
    }, (error) => {
      console.error("Error fetching missions:", error);
    });

    return () => unsubscribe();
  }, []);

  const selectedMission = missions.find(m => m.id === selectedMissionId) || null;

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-gray-300 font-mono overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-800 flex flex-col bg-[#111]">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-500">
            <Activity size={20} />
            <h1 className="font-bold tracking-wider text-sm">CONTROL CENTER</h1>
          </div>
          <button 
            onClick={() => auth.signOut()}
            className="text-gray-500 hover:text-gray-300 transition-colors"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <MissionList 
            missions={missions} 
            selectedId={selectedMissionId} 
            onSelect={setSelectedMissionId} 
          />
        </div>
        
        <div className="p-4 border-t border-gray-800">
          <Simulator />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-[#0a0a0a]">
        {selectedMission ? (
          <MissionDetails mission={selectedMission} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-600 flex-col gap-4">
            <Activity size={48} className="opacity-20" />
            <p>Select a mission to view telemetry</p>
          </div>
        )}
      </div>
    </div>
  );
}
