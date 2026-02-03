
import React from 'react';

interface ApiKeyWallProps {
  onKeySelected: () => void;
}

export const ApiKeyWall: React.FC<ApiKeyWallProps> = ({ onKeySelected }) => {
  const handleOpenSelect = async () => {
    try {
      await window.aistudio.openSelectKey();
      // On assume le succès immédiatement comme recommandé pour éviter les race conditions
      onKeySelected();
    } catch (err) {
      console.error("Failed to open key selector", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-4 text-white">Clé API avec Facturation Requise</h2>
        <p className="text-slate-400 mb-6">
          Le modèle de génération vidéo <strong>Veo 3.1</strong> n'est pas disponible sur les projets gratuits. Vous devez sélectionner une clé API liée à un projet Google Cloud avec facturation activée.
        </p>
        <div className="space-y-4">
          <button
            onClick={handleOpenSelect}
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 transition-all rounded-xl font-bold text-white shadow-lg shadow-blue-900/20"
          >
            Sélectionner une Clé Payante
          </button>
          <p className="text-xs text-slate-500 italic">
            Note : Si l'erreur 403 persiste, vérifiez que l'API Gemini est activée dans votre console Google Cloud.
          </p>
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-blue-400 hover:underline transition-colors"
          >
            Documentation Google Cloud Facturation &rarr;
          </a>
        </div>
      </div>
    </div>
  );
};
