import { useState } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Play, Loader2 } from 'lucide-react';

export default function Simulator() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [target, setTarget] = useState('https://example.com/data');

  const startSimulation = async () => {
    if (!auth.currentUser || isSimulating) return;
    setIsSimulating(true);

    try {
      // 1. Create Mission (The Awakening)
      const missionRef = await addDoc(collection(db, 'missions'), {
        status: 'pending',
        progress: 0,
        target,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ownerId: auth.currentUser.uid
      });

      const addLog = async (message: string, level: 'info' | 'warning' | 'error' | 'success') => {
        await addDoc(collection(db, 'logs'), {
          missionId: missionRef.id,
          message,
          level,
          timestamp: serverTimestamp(),
          ownerId: auth.currentUser.uid
        });
      };

      // 2. Environment Creation (The Clean Room)
      await updateDoc(missionRef, { status: 'running', updatedAt: serverTimestamp() });
      await addLog('System awakened. Initializing clean room environment...', 'info');
      await new Promise(r => setTimeout(r, 1500));
      
      await addLog('Injecting secure credentials into volatile memory.', 'info');
      await new Promise(r => setTimeout(r, 1000));
      
      await addLog('Environment ready. Launching headless browser.', 'success');
      await updateDoc(missionRef, { progress: 10, updatedAt: serverTimestamp() });
      await new Promise(r => setTimeout(r, 2000));

      // 3. Execution and Telemetry (The Spacewalk)
      await addLog(`Navigating to target: ${target}`, 'info');
      await updateDoc(missionRef, { progress: 30, updatedAt: serverTimestamp() });
      await new Promise(r => setTimeout(r, 2500));

      // Simulate some work
      const steps = [
        { msg: 'Bypassing initial security checks...', p: 40 },
        { msg: 'Authenticating with user I857...', p: 45 },
        { msg: 'Authentication successful. Entering dashboard.', p: 50 },
        { msg: 'Locating unit dropdown (#select2-franquiaSelecionadaId-container)...', p: 55 },
        { msg: 'Selecting unit: ADMINISTRAÇÃO', p: 60 },
        { msg: 'Navigating to Atendimento...', p: 65 },
        { msg: 'Extracting Atendimento reports...', p: 70 },
        { msg: 'Navigating to Cadastros...', p: 75 },
        { msg: 'Extracting Cadastros data...', p: 80 },
        { msg: 'Navigating to Comercial...', p: 85 },
        { msg: 'Extracting Comercial metrics...', p: 90 },
      ];

      for (const step of steps) {
        await addLog(step.msg, step.level || 'info');
        await updateDoc(missionRef, { progress: step.p, updatedAt: serverTimestamp() });
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
      }

      // 4. Delivery and Self-Destruction
      await addLog('Data extraction complete. Compiling payload.', 'success');
      await updateDoc(missionRef, { progress: 95, updatedAt: serverTimestamp() });
      await new Promise(r => setTimeout(r, 1500));

      // Simulate saving extracted files
      const categories = ['Atendimento', 'Cadastros', 'Comercial', 'Configurações', 'Estoque', 'Financeiro', 'Franqueadora', 'Marketing', 'Relatórios'];
      
      for (let i = 0; i < 3; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        await addDoc(collection(db, 'files'), {
          missionId: missionRef.id,
          name: `export_${category.toLowerCase()}_${new Date().getTime()}.csv`,
          url: '#', // In a real app, this would be a Firebase Storage URL
          size: Math.floor(Math.random() * 5000000) + 10000,
          category: category,
          timestamp: serverTimestamp(),
          ownerId: auth.currentUser.uid
        });
      }

      await addLog('Payload delivered to secure cloud storage. 3 files saved.', 'success');
      await new Promise(r => setTimeout(r, 1000));

      await addLog('Initiating self-destruct sequence. Wiping volatile memory.', 'warning');
      await updateDoc(missionRef, { progress: 100, status: 'completed', updatedAt: serverTimestamp() });
      await new Promise(r => setTimeout(r, 1000));

      await addLog('Mission Accomplished. Environment destroyed.', 'success');

    } catch (error) {
      console.error("Simulation error:", error);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">
        Manual Override
      </div>
      <input
        type="text"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        placeholder="Target URL"
        className="bg-black border border-gray-800 text-gray-300 text-sm rounded px-3 py-2 outline-none focus:border-emerald-500 transition-colors"
        disabled={isSimulating}
      />
      <button
        onClick={startSimulation}
        disabled={isSimulating}
        className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSimulating ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            DEPLOYING...
          </>
        ) : (
          <>
            <Play size={16} />
            LAUNCH WORKER
          </>
        )}
      </button>
    </div>
  );
}
