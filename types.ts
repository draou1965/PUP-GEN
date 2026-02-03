
export interface AdState {
  isGenerating: boolean;
  statusMessage: string;
  videoUrl: string | null;
  audioBuffer: AudioBuffer | null;
  error: string | null;
}

export interface AdScript {
  sceneDescription: string;
  voiceOverText: string;
  tone: string;
}

declare global {
  /**
   * AIStudio interface for managing API keys.
   * Defined here to avoid conflicts with existing global declarations.
   */
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    /**
     * The aistudio object provided by the environment.
     * Fixed: Added readonly modifier to match the environment's global declaration.
     */
    readonly aistudio: AIStudio;
    webkitAudioContext: typeof AudioContext;
  }
}
