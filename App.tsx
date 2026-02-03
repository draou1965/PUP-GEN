
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GeminiAdService } from './services/geminiService';
import { ApiKeyWall } from './components/ApiKeyWall';
import { AdState } from './types';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [state, setState] = useState<AdState>({
    isGenerating: false,
    statusMessage: '',
    videoUrl: null,
    audioBuffer: null,
    error: null,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        try {
          const selected = await window.aistudio.hasSelectedApiKey();
          setHasKey(selected);
        } catch (err) {
          console.error("Error checking API key status:", err);
          setHasKey(false);
        }
      } else {
        setHasKey(true);
      }
    };
    checkKey();
  }, []);

  const handleGenerate = async () => {
    setState(prev => ({ 
      ...prev, 
      isGenerating: true, 
      statusMessage: 'Vérification des permissions...',
      error: null 
    }));

    try {
      const videoPrompt = `
        A cinematic 8-second advertisement for a productivity app. 
        Start: A 35-year-old male entrepreneur in a blue shirt looks stressed and overwhelmed in a workspace cluttered with floating physical post-it notes and aggressive digital notification pop-ups. 
        Transition: He discovers a sleek mobile app on his phone and smiles with relief. 
        End: Suddenly, the chaos transforms into a clean, minimalist, and perfectly organized office with calm blue lighting and streamlined digital dashboards.
        Atmosphere: Modern, high-end corporate style.
      `;

      const voiceOverText = "Say confidently: Le chaos, c’est terminé.";

      setState(prev => ({ ...prev, statusMessage: 'Génération vidéo avec Veo 3.1... (1-2 min)' }));
      const videoUrl = await GeminiAdService.generateVideo(videoPrompt);

      setState(prev => ({ ...prev, statusMessage: 'Production de la voix-off...' }));
      const audioData = await GeminiAdService.generateAudio(voiceOverText);

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      }
      const decodedBuffer = await GeminiAdService.decodeAudioData(audioData, audioContextRef.current);

      setState(prev => ({
        ...prev,
        isGenerating: false,
        statusMessage: 'Publicité générée avec succès !',
        videoUrl,
        audioBuffer: decodedBuffer
      }));

    } catch (err: any) {
      console.error("Generation Error Details:", err);
      
      // Extraction du message d'erreur pour analyse
      const errorStr = typeof err === 'string' ? err : JSON.stringify(err);
      const isPermissionError = errorStr.includes("PERMISSION_DENIED") || errorStr.includes("403");
      const isNotFoundError = errorStr.includes("Requested entity was not found");

      // Si c'est une erreur de permission ou de projet, on réinitialise la clé
      if (isPermissionError || isNotFoundError) {
        setHasKey(false);
      }
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: isPermissionError 
          ? "Accès refusé (403). Veo nécessite une clé API provenant d'un projet Google Cloud avec FACTURATION ACTIVÉE. Veuillez sélectionner une clé payante."
          : "Erreur de génération. Vérifiez votre projet API et réessayez."
      }));
    }
  };

  const playAd = useCallback(() => {
    if (!videoRef.current || !state.audioBuffer || !audioContextRef.current) return;
    videoRef.current.currentTime = 0;
    const source = audioContextRef.current.createBufferSource();
    source.buffer = state.audioBuffer;
    source.connect(audioContextRef.current.destination);
    videoRef.current.play();
    source.start(audioContextRef.current.currentTime + 3.5);
  }, [state.audioBuffer]);

  if (hasKey === false) {
    return <ApiKeyWall onKeySelected={() => setHasKey(true)} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12 max-w-6xl mx-auto">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 mb-4">
          ProducTV
        </h1>
        <p className="text-slate-400 text-lg">Créez vos pubs avec Gemini Veo 3.1 & TTS</p>
      </header>

      <main className="w-full grid lg:grid-cols-2 gap-12 items-start">
        <section className="bg-slate-800/50 border border-slate-700 p-8 rounded-3xl shadow-xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">Script Actif</h2>
          <div className="space-y-6">
            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
              <label className="text-xs uppercase font-bold text-slate-500 mb-2 block">Visuel</label>
              <p className="text-slate-300 text-sm">Chaos digital vers organisation parfaite. (8s)</p>
            </div>
            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
              <label className="text-xs uppercase font-bold text-slate-500 mb-2 block">Audio</label>
              <p className="text-slate-300 italic">« Le chaos, c’est terminé. »</p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={state.isGenerating}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
                state.isGenerating 
                ? 'bg-slate-700 cursor-not-allowed text-slate-400' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
              }`}
            >
              {state.isGenerating ? "Production..." : "Générer la Publicité"}
            </button>
            {state.statusMessage && <p className="text-center text-sm text-blue-400 animate-pulse">{state.statusMessage}</p>}
            {state.error && <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-xl text-red-400 text-sm">{state.error}</div>}
          </div>
        </section>

        <section className="relative">
          <div className="aspect-video bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl flex items-center justify-center relative">
            {state.videoUrl ? (
              <>
                <video ref={videoRef} src={state.videoUrl} className="w-full h-full object-cover" controls playsInline />
                <button onClick={playAd} className="absolute bottom-4 right-4 bg-blue-600 p-3 rounded-full hover:scale-110 transition-transform shadow-xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                </button>
              </>
            ) : (
              <div className="text-center text-slate-600">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <p>L'aperçu apparaîtra ici</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
