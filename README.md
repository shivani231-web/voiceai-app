# voiceai-app

A **Next.js + TypeScript** web application that runs entirely in the browser, enabling **offline speech-to-text (STT)**, **large language model (LLM) integration**, and **local text-to-speech (TTS)** — all without relying on server-side processing for audio.  

---

## 📌 Project Overview
The voiceai-app is designed to:
- Capture speech in real-time and transcribe it locally.
- Process the transcribed text with an AI model (OpenAI API).
- Convert the AI-generated text back to speech locally.
- Provide fast, privacy-friendly AI interactions with minimal network dependency.

---

## 🛠 Tech Stack
- **Frontend Framework**: [Next.js](https://nextjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Speech-to-Text**: [`whisper.cpp`](https://github.com/ggerganov/whisper.cpp) (WASM) in a Web Worker
- **LLM API**: OpenAI Chat Completion
- **Text-to-Speech**: Coqui-style local TTS model
- **Service Worker**: For caching WASM & model files for offline usage
- **Web Audio API**: For handling audio input/output in the browser

---

## 📋 Assignment Steps

### 1. Initialize Next.js + TypeScript
- Add a Web App Manifest and register a Service Worker.
- Precache on install:
  - Whisper WASM file
  - TTS model files

### 2. Local STT
- Integrate [`whisper.cpp`](https://github.com/ggerganov/whisper.cpp) (WASM) in a Web Worker.
- Stream audio chunks from the main thread to the worker and emit live transcripts.

### 3. LLM Integration
- On final transcript, send the prompt to OpenAI’s Chat Completion endpoint.

### 4. Local TTS
- Load a Coqui-style TTS model in a Web Worker.
- Convert LLM-generated text to audio (`AudioBuffer` or blob).

### 5. Interaction Flow & Performance
- Trigger **STT → LLM → TTS** pipeline on end-of-speech.
- Play back audio immediately when ready.
- Log and display latencies for:
  - STT
  - API
  - TTS
  - Playback start
- **Target total response time**:  
  `< 1.2 s` on good networks.

---

## 🚀 Getting Started
1. Clone the repository:
   ```bash
   git clone https://github.com/shivani231/voiceai-app.git
   cd voiceai-app
