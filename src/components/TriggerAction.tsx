import { useState } from 'react';
import { Play, Loader2, Github, KeyRound } from 'lucide-react';

export default function TriggerAction() {
  const [isLoading, setIsLoading] = useState(false);
  const [repo, setRepo] = useState('bruallan/Web_Scrapping_SPA');
  const [token, setToken] = useState('');

  const handleTrigger = async () => {
    if (!token || !repo) {
      alert('Por favor, preencha o nome do repositório e o Token do GitHub.');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/scraper.yml/dispatches`, {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref: 'main' })
      });

      if (response.ok) {
        alert('Sinal enviado com sucesso! O robô vai iniciar no GitHub em instantes. Acompanhe os logs na aba ao lado.');
      } else {
        const err = await response.json();
        alert(`Erro ao iniciar o robô: ${err.message}`);
      }
    } catch (error) {
      alert('Erro de rede ao tentar contactar o GitHub.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1 flex items-center gap-2">
        <Github size={14} />
        Disparador Remoto
      </div>
      
      <input
        type="text"
        value={repo}
        onChange={(e) => setRepo(e.target.value)}
        placeholder="usuario/repositorio"
        className="bg-black border border-gray-800 text-gray-300 text-sm rounded px-3 py-2 outline-none focus:border-emerald-500 transition-colors"
        disabled={isLoading}
      />
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <KeyRound size={14} className="text-gray-500" />
        </div>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="GitHub Personal Access Token"
          className="bg-black border border-gray-800 text-gray-300 text-sm rounded pl-9 pr-3 py-2 outline-none focus:border-emerald-500 transition-colors w-full"
          disabled={isLoading}
        />
      </div>

      <button
        onClick={handleTrigger}
        disabled={isLoading || !token || !repo}
        className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            ENVIANDO SINAL...
          </>
        ) : (
          <>
            <Play size={16} />
            INICIAR ROBÔ
          </>
        )}
      </button>
      
      <p className="text-[10px] text-gray-600 text-center mt-2 leading-tight">
        O token é usado apenas localmente no seu navegador para autorizar o disparo no GitHub.
      </p>
    </div>
  );
}
