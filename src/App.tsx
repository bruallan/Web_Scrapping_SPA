import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase';
import Dashboard from './components/Dashboard';
import { Activity, Shield } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0a] text-emerald-500">
        <Activity size={48} className="animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0a] font-mono">
        <div className="max-w-md w-full p-8 border border-gray-800 bg-[#111] rounded-lg shadow-2xl flex flex-col items-center">
          <Shield size={64} className="text-emerald-500 mb-6" />
          <h1 className="text-2xl font-bold text-gray-200 mb-2 tracking-widest text-center">
            TRANSPARENT AUTOMATION
          </h1>
          <p className="text-gray-500 text-center text-sm mb-8">
            Secure Control Center. Authentication required to monitor and deploy ephemeral workers.
          </p>
          <button
            onClick={handleLogin}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded transition-colors flex items-center justify-center gap-2"
          >
            <Shield size={18} />
            AUTHENTICATE
          </button>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}
