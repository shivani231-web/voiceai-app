"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Types
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface PerformanceMetrics {
  sttLatency: number;
  apiLatency: number;
  ttsLatency: number;
  totalLatency: number;
  playbackStart: number;
}

interface WhisperWorkerMessage {
  type: 'load' | 'transcribe' | 'model-loaded' | 'transcript' | 'error';
  audio?: Blob;
  text?: string;
  error?: string;
  latency?: number;
}

// Mock Whisper Web Worker
class MockWhisperWorker {
  private isLoaded = false;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor() {
    setTimeout(() => {
      this.isLoaded = true;
      this.sendMessage({ type: 'model-loaded' });
    }, 2000);
  }

  postMessage(data: WhisperWorkerMessage) {
    if (data.type === 'load') return;

    if (data.type === 'transcribe' && data.audio) {
      if (!this.isLoaded) {
        this.sendMessage({ type: 'error', error: 'Model not loaded yet' });
        return;
      }

      const startTime = Date.now();
      setTimeout(() => {
        const mockTranscripts = [
          "Hello, how are you today?",
          "What's the weather like?",
          "Can you tell me a joke?",
          "What time is it?",
          "Tell me about artificial intelligence",
          "How does machine learning work?",
          "What's the capital of France?",
          "Can you help me with my project?"
        ];
        
        const transcript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
        const latency = Date.now() - startTime;
        
        this.sendMessage({ 
          type: 'transcript', 
          text: transcript,
          latency 
        });
      }, 1000 + Math.random() * 2000);
    }
  }

  private sendMessage(data: WhisperWorkerMessage) {
    if (this.onmessage) {
      this.onmessage({ data } as MessageEvent);
    }
  }

  terminate() {}
}

// Mock TTS Engine
class MockTTSEngine {
  private isLoaded = false;
  private audioContext: AudioContext | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      setTimeout(() => {
        this.isLoaded = true;
      }, 3000);
    } catch (error) {
      console.error('Failed to initialize TTS engine:', error);
    }
  }

  async synthesize(text: string): Promise<{ audioBuffer: AudioBuffer; latency: number }> {
    if (!this.isLoaded) {
      throw new Error('TTS model not loaded yet');
    }

    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1500));

    const sampleRate = 22050;
    const duration = Math.max(1, text.length * 0.1);
    const audioBuffer = this.audioContext!.createBuffer(1, sampleRate * duration, sampleRate);
    
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < channelData.length; i++) {
      channelData[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.1;
    }

    const latency = Date.now() - startTime;
    return { audioBuffer, latency };
  }

  async playAudio(audioBuffer: AudioBuffer): Promise<void> {
    if (!this.audioContext) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    
    return new Promise((resolve) => {
      source.onended = () => resolve();
      source.start();
    });
  }

  isModelLoaded(): boolean {
    return this.isLoaded;
  }
}

// OpenAI Client
class OpenAIClient {
  constructor(private apiKey: string) {}

  async chatCompletion(messages: Message[]): Promise<{ response: string; latency: number }> {
    const startTime = Date.now();
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          max_tokens: 150,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;
      
      return {
        response: data.choices[0]?.message?.content || 'Sorry, I could not generate a response.',
        latency
      };
    } catch (error) {
      console.error('OpenAI API Error:', error);
      // Fallback to mock response
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1500));
      const latency = Date.now() - startTime;
      return {
        response: this.generateFallbackResponse(messages[messages.length - 1]?.content || ''),
        latency
      };
    }
  }

  private generateFallbackResponse(input: string): string {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
      return "Hello! I'm your AI assistant. How can I help you today?";
    } else if (lowerInput.includes('weather')) {
      return "I don't have access to real-time weather data, but I hope it's pleasant where you are!";
    } else if (lowerInput.includes('joke')) {
      const jokes = [
        "Why don't scientists trust atoms? Because they make up everything!",
        "What do you call a fake noodle? An impasta!",
        "Why did the scarecrow win an award? He was outstanding in his field!"
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    } else if (lowerInput.includes('time')) {
      return `The current time is ${new Date().toLocaleTimeString()}.`;
    } else {
      return `I understand you said: "${input}". That's interesting! What would you like to know more about?`;
    }
  }
}

// Audio recording hook
function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    // ...existing code...
  }, []);

  const stopRecording = useCallback(() => {
    // ...existing code...
  }, [isRecording]);

  const resetAudio = useCallback(() => {
    setAudioBlob(null);
  }, []);

  return { startRecording, stopRecording, audioBlob, isRecording, resetAudio };
}

// Main Component
export default function VoiceAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [isOnline, setIsOnline] = useState(true);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isTTSLoaded, setIsTTSLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>('Initializing...');

  const whisperWorkerRef = useRef<MockWhisperWorker | null>(null);
  const ttsEngineRef = useRef<MockTTSEngine | null>(null);
  const openaiClientRef = useRef<OpenAIClient | null>(null);

  const { startRecording, stopRecording, audioBlob, isRecording,resetAudio } = useAudioRecorder();

  // Initialize services
  useEffect(() => {
   if (audioBlob && whisperWorkerRef.current && isModelLoaded) {
      setIsProcessing(true);
      setCurrentStatus('Processing speech...');
      whisperWorkerRef.current.postMessage({ type: 'transcribe', audio: audioBlob });
      resetAudio();
   }
  }, [audioBlob, isModelLoaded, resetAudio]);

  // Handle API key changes
  useEffect(() => {
    if (apiKey && apiKey.trim()) {
      openaiClientRef.current = new OpenAIClient(apiKey);
    }
  }, [apiKey]);

  // Process audio blob
  useEffect(() => {
   if (audioBlob && whisperWorkerRef.current && isModelLoaded) {
      setIsProcessing(true);
      setCurrentStatus('Processing speech...');
      whisperWorkerRef.current.postMessage({ type: 'transcribe', audio: audioBlob });
      resetAudio(); // <-- Use resetAudio instead of audioBlob(null)
    }
  }, [audioBlob, isModelLoaded, resetAudio]);
  

  const handleTranscript = useCallback(async (text: string, sttLatency: number) => {
    const overallStartTime = Date.now();
    
    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentStatus('Getting AI response...');

    try {
      const apiStartTime = Date.now();
      let aiResponse: string;
      let apiLatency: number;

      if (isOnline && openaiClientRef.current) {
        const result = await openaiClientRef.current.chatCompletion([...messages, userMessage]);
        aiResponse = result.response;
        apiLatency = result.latency;
      } else {
        await new Promise(resolve => setTimeout(resolve, 500));
        aiResponse = getOfflineResponse(text);
        apiLatency = Date.now() - apiStartTime;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setCurrentStatus('Synthesizing speech...');

      if (ttsEngineRef.current && isTTSLoaded) {
        try {
          const ttsStartTime = Date.now();
          const { audioBuffer, latency: ttsLatency } = await ttsEngineRef.current.synthesize(aiResponse);
          
          setCurrentStatus('Playing audio...');
          setIsPlaying(true);
          const playbackStart = Date.now();
          
          await ttsEngineRef.current.playAudio(audioBuffer);
          
          setIsPlaying(false);
          setCurrentStatus('Ready to chat!');

          const totalLatency = Date.now() - overallStartTime;
          setPerformanceMetrics({
            sttLatency,
            apiLatency,
            ttsLatency,
            totalLatency,
            playbackStart: playbackStart - overallStartTime
          });

        } catch (ttsError) {
          console.error('TTS Error:', ttsError);
          setCurrentStatus('TTS error, but response received');
        }
      }

    } catch (error) {
      console.error('Error processing transcript:', error);
      setCurrentStatus('Error processing request');
      
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [messages, isOnline, isTTSLoaded]);

  const getOfflineResponse = useCallback((input: string): string => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
      return 'Hello! I\'m running in offline mode with local speech processing. How can I help you?';
    }
    if (lowerInput.includes('time')) {
      return `The current time is ${new Date().toLocaleTimeString()}`;
    }
    if (lowerInput.includes('date')) {
      return `Today's date is ${new Date().toLocaleDateString()}`;
    }
    
    return `You said: "${input}". I'm running offline with local STT and TTS. What would you like to know?`;
  }, []);

  const handleRecordingToggle = () => {
    if (isRecording) {
      stopRecording();
      setCurrentStatus('Processing recording...');
    } else {
      if (!isModelLoaded) {
        alert('Please wait for the Whisper model to load first!');
        return;
      }
      startRecording();
      setCurrentStatus('Listening... Click stop when done');
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setPerformanceMetrics(null);
    setCurrentStatus('Ready to chat!');
  };

  const isReady = isModelLoaded && isTTSLoaded;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🎤 Offline Voice AI Assistant
          </h1>
          <p className="text-gray-600 mb-4">
            Local Whisper STT + OpenAI API + Local TTS Pipeline
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-600">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <div className="text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${isModelLoaded ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-xs text-gray-600">Whisper STT</span>
            </div>
            <div className="text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${isTTSLoaded ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-xs text-gray-600">Coqui TTS</span>
            </div>
            <div className="text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${isPlaying ? 'bg-purple-500' : 'bg-gray-400'}`}></div>
              <span className="text-xs text-gray-600">{isPlaying ? 'Playing' : 'Silent'}</span>
            </div>
          </div>

          <div className="text-center py-2">
            <span className="text-sm font-medium text-gray-700">{currentStatus}</span>
          </div>

          <div className="mb-4">
            <input
              type="password"
              placeholder="Enter OpenAI API Key (optional - works offline too)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {performanceMetrics && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">Last Response Performance:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">STT:</span>
                  <span className="font-mono ml-1">{performanceMetrics.sttLatency}ms</span>
                </div>
                <div>
                  <span className="text-gray-600">API:</span>
                  <span className="font-mono ml-1">{performanceMetrics.apiLatency}ms</span>
                </div>
                <div>
                  <span className="text-gray-600">TTS:</span>
                  <span className="font-mono ml-1">{performanceMetrics.ttsLatency}ms</span>
                </div>
                <div>
                  <span className="text-gray-600">Total:</span>
                  <span className="font-mono ml-1 font-bold">{performanceMetrics.totalLatency}ms</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={handleRecordingToggle}
              disabled={!isReady || isProcessing}
              className={`px-8 py-4 rounded-xl font-semibold text-white transition-all duration-200 ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : isReady && !isProcessing
                  ? 'bg-blue-500 hover:bg-blue-600 hover:scale-105'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {isRecording ? '🔴 Stop Recording' : '🎤 Start Recording'}
            </button>

            <button
              onClick={clearConversation}
              className="px-6 py-4 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all duration-200 hover:scale-105"
            >
              🗑️ Clear Chat
            </button>
          </div>

          {(isProcessing || isRecording) && (
            <div className="text-center mt-4">
              <div className="inline-flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
                <span className="text-gray-600 font-medium">
                  {isRecording ? 'Recording audio...' : 'Processing...'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">💬 Conversation</h2>
          
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <div className="text-6xl mb-4">🎙️</div>
              <p className="text-lg">Ready for your first voice message!</p>
              <p className="text-sm mt-2">Click "Start Recording" to begin</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-md px-6 py-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">
                        {message.role === 'user' ? '👤' : '🤖'}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p className="text-xs opacity-75 mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center text-gray-500 text-sm mt-6">
          <p>🔐 Runs offline after initial load • 🎯 Target: &lt;1.2s response time</p>
          <p className="mt-1">Uses local Whisper WASM + Coqui TTS + OpenAI API</p>
        </div>
      </div>
    </div>
  );
}