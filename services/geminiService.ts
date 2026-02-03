
import { GoogleGenAI, Modality } from "@google/genai";

export class GeminiAdService {
  private static async getAI() {
    // Creating fresh instance right before use to ensure the latest API key from the dialog is used.
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  /**
   * Generates an 8-second video using Veo 3.1.
   */
  static async generateVideo(prompt: string): Promise<string> {
    const ai = await this.getAI();
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: '16:9'
      }
    });

    // Poll for operation completion. Guideline recommends 10s interval.
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed - no URI returned.");

    // Fetch video bytes using the API key.
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  /**
   * Generates audio using Gemini 2.5 Flash TTS.
   */
  static async generateAudio(text: string): Promise<Uint8Array> {
    const ai = await this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Audio generation failed.");

    return this.decode(base64Audio);
  }

  /**
   * Decodes a base64 string to Uint8Array.
   * Implementation follows guidelines exactly.
   */
  private static decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Decodes raw PCM audio bytes to AudioBuffer.
   * Gemini TTS returns raw PCM data at 24kHz Mono.
   */
  static async decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext
  ): Promise<AudioBuffer> {
    const sampleRate = 24000;
    const numChannels = 1;
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }
}
