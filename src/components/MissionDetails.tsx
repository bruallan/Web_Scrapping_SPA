import { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Mission, Log, RawFile } from '../types';
import { cn } from '../lib/utils';
import { Terminal, ShieldCheck, AlertTriangle, Info, CheckCircle, Clock, FileDown, Database } from 'lucide-react';
import { format } from 'date-fns';

export default function MissionDetails({ mission }: { mission: Mission }) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [files, setFiles] = useState<RawFile[]>([]);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'files'>('telemetry');
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const qLogs = query(
      collection(db, 'logs'),
      where('missionId', '==', mission.id),
      where('ownerId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'asc')
    );

    const unsubscribeLogs = onSnapshot(qLogs, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Log[];
      setLogs(logsData);
    }, (error) => console.error("Error fetching logs:", error));

    const qFiles = query(
      collection(db, 'files'),
      where('missionId', '==', mission.id),
      where('ownerId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeFiles = onSnapshot(qFiles, (snapshot) => {
      const filesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RawFile[];
      setFiles(filesData);
    }, (error) => console.error("Error fetching files:", error));

    return () => {
      unsubscribeLogs();
      unsubscribeFiles();
    };
  }, [mission.id]);

  useEffect(() => {
    if (activeTab === 'telemetry') {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 bg-[#111] flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-200 mb-1 flex items-center gap-2">
            <Terminal size={20} className="text-emerald-500" />
            {mission.target}
          </h2>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {mission.createdAt?.toDate ? format(mission.createdAt.toDate(), 'PPpp') : 'Starting...'}
            </span>
            <span className="uppercase tracking-widest font-bold flex items-center gap-1">
              <StatusBadge status={mission.status} />
            </span>
          </div>
        </div>
        
        {/* Progress Circle */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-gray-800"
              strokeWidth="3"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={cn(
                "transition-all duration-1000 ease-out",
                mission.status === 'failed' ? "text-red-500" : "text-emerald-500"
              )}
              strokeWidth="3"
              strokeDasharray={`${mission.progress}, 100`}
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute text-xs font-bold text-gray-300">
            {mission.progress}%
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 bg-[#111] px-6">
        <button
          onClick={() => setActiveTab('telemetry')}
          className={cn(
            "px-4 py-3 text-sm font-bold tracking-widest uppercase transition-colors border-b-2",
            activeTab === 'telemetry' 
              ? "border-emerald-500 text-emerald-500" 
              : "border-transparent text-gray-500 hover:text-gray-300"
          )}
        >
          Telemetry Logs
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={cn(
            "px-4 py-3 text-sm font-bold tracking-widest uppercase transition-colors border-b-2 flex items-center gap-2",
            activeTab === 'files' 
              ? "border-emerald-500 text-emerald-500" 
              : "border-transparent text-gray-500 hover:text-gray-300"
          )}
        >
          Raw Files
          {files.length > 0 && (
            <span className="bg-gray-800 text-gray-300 py-0.5 px-2 rounded-full text-[10px]">
              {files.length}
            </span>
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto font-mono text-sm bg-black p-6">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'telemetry' ? (
            <div className="space-y-2">
              {logs.length === 0 ? (
                <div className="text-gray-600 italic flex items-center gap-2">
                  <span className="animate-pulse">_</span> Waiting for telemetry...
                </div>
              ) : (
                logs.map((log) => (
                  <div 
                    key={log.id} 
                    className={cn(
                      "flex items-start gap-3 py-1 border-l-2 pl-3 transition-colors",
                      getLevelStyles(log.level)
                    )}
                  >
                    <span className="text-gray-600 text-xs mt-0.5 whitespace-nowrap">
                      {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'HH:mm:ss.SSS') : '00:00:00.000'}
                    </span>
                    <LevelIcon level={log.level} />
                    <span className="text-gray-300 break-words flex-1">
                      {log.message}
                    </span>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          ) : (
            <div className="space-y-4">
              {files.length === 0 ? (
                <div className="text-center py-12 text-gray-600 flex flex-col items-center gap-3">
                  <Database size={32} className="opacity-20" />
                  <p>No files extracted yet.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {files.map((file) => (
                    <div key={file.id} className="bg-[#111] border border-gray-800 p-4 rounded flex items-center justify-between group hover:border-gray-700 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded bg-gray-900 flex items-center justify-center text-emerald-500">
                          <FileDown size={20} />
                        </div>
                        <div>
                          <h3 className="text-gray-200 font-bold">{file.name}</h3>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span className="uppercase tracking-widest text-emerald-500/70">{file.category}</span>
                            <span>•</span>
                            <span>{formatBytes(file.size)}</span>
                            <span>•</span>
                            <span>{file.timestamp?.toDate ? format(file.timestamp.toDate(), 'PPpp') : ''}</span>
                          </div>
                        </div>
                      </div>
                      <a 
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-emerald-500 rounded text-xs font-bold tracking-widest uppercase transition-colors opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          if (file.url === '#') {
                            e.preventDefault();
                            alert('This is a simulated file. In a real environment, this would download the extracted CSV.');
                          }
                        }}
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Mission['status'] }) {
  switch (status) {
    case 'pending': return <span className="text-gray-500">PENDING</span>;
    case 'running': return <span className="text-emerald-500 animate-pulse">RUNNING</span>;
    case 'completed': return <span className="text-blue-500">COMPLETED</span>;
    case 'failed': return <span className="text-red-500">FAILED</span>;
  }
}

function getLevelStyles(level: Log['level']) {
  switch (level) {
    case 'info': return "border-gray-800 hover:bg-gray-900/50";
    case 'warning': return "border-yellow-500/50 bg-yellow-500/5 text-yellow-200";
    case 'error': return "border-red-500/50 bg-red-500/5 text-red-200";
    case 'success': return "border-emerald-500/50 bg-emerald-500/5 text-emerald-200";
  }
}

function LevelIcon({ level }: { level: Log['level'] }) {
  switch (level) {
    case 'info': return <Info size={14} className="text-blue-400 mt-0.5" />;
    case 'warning': return <AlertTriangle size={14} className="text-yellow-500 mt-0.5" />;
    case 'error': return <AlertTriangle size={14} className="text-red-500 mt-0.5" />;
    case 'success': return <CheckCircle size={14} className="text-emerald-500 mt-0.5" />;
  }
}
