// AudioManager.js
import * as THREE from 'three';

export default class AudioManager {
  _listeners = { ended: new Set() };
  _suppressEndedOnce = false;

  constructor(mafukinURL) {
    this.startTime = 0; // AudioContext timestamp when play() was called
    this.pausedAt = 0; // Accumulated seconds when pause() was called
    this.frequencyArray = [];
    this.frequencyData = { low: 0, mid: 0, high: 0 };
    this.isPlaying = false;
    // Tuned frequency ranges for instrumental hip-hop (can be further optimized)
    this.lowFrequency = 60;   // Emphasize bass and kick drums
    this.midFrequency = 600;  // Snares, samples, melodic elements
    this.highFrequency = 6000; // Hi-hats, cymbals, higher-pitched samples
    this.smoothedLowFrequency = 0;
    this.audioContext = null;
    this.audio = null;
    this.audioAnalyser = null;
    this.bufferLength = 0;
    this.song = { url: mafukinURL };

    const audioListener = new THREE.AudioListener();
    this.audio = new THREE.Audio(audioListener);
    this.audioAnalyser = new THREE.AudioAnalyser(this.audio, 2048); // Increased FFT size for more detail
    this.bufferLength = this.audioAnalyser.data.length; // Update bufferLength after FFT size change
    this.audio.setLoop(false); // Do not loop by default
  }

  // Optionally expose a setter
  setLoop(looping) {
    if (this.audio) this.audio.setLoop(!!looping);
  }

  async loadAudioBuffer() {
    const promise = new Promise(async (resolve, reject) => {
      const audioLoader = new THREE.AudioLoader();
      audioLoader.load(
        this.song.url,
        (buffer) => {
          this.audio.setBuffer(buffer);
          this.audio.setLoop(false); // Do not loop; playlists manage sequencing
          this.audio.setVolume(1.0);
          this.audioContext = this.audio.context;
          this.bufferLength = this.audioAnalyser.data.length; // Ensure this is set correctly after buffer
          resolve();
        },
        undefined, // onProgress callback, not used here
        (error) => {
          console.error("Error loading audio:", error);
          reject(error);
        }
      );
    });
    return promise;
  }

  addEventListener(type, fn) {
    if (this._listeners[type]) this._listeners[type].add(fn);
  }

  removeEventListener(type, fn) {
    if (this._listeners[type]) this._listeners[type].delete(fn);
  }

  _emit(type, payload) {
    if (!this._listeners[type]) return;
    for (const fn of this._listeners[type]) {
      try {
        fn(payload);
      } catch (e) {
        console.error(`Error in event listener for ${type}:`, e);
      }
    }
  }

  // Call this whenever you intentionally interrupt current source
  _markManualStop() {
    this._suppressEndedOnce = true;
    queueMicrotask(() => {
      this._suppressEndedOnce = false;
    });
  }

  pause() {
    if (!this.audio || !this.audio.context) return;
    if (!this.isPlaying) return;

    this.pausedAt = this.audio.context.currentTime - this.startTime;
    this._stopCurrentSource();
    this.isPlaying = false;
    if (this.audio) this.audio.isPlaying = false;
  }

  play() {
    const ctx = this.audio?.context;
    const buffer = this.audio?.buffer;
    if (!ctx || !buffer) return;

    const offset = Math.max(0, Math.min(this.pausedAt || 0, buffer.duration - 0.001));
    this._stopCurrentSource();

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = this.audio.loop === true;
    src.loopStart = this.audio.loopStart ?? 0;
    src.loopEnd = this.audio.loopEnd ?? buffer.duration;
    const output = this.audio.getOutput ? this.audio.getOutput() : this.audio.gain;
    src.connect(output);

    src.onended = () => {
      if (this._suppressEndedOnce) return;
      if (!src.loop) {
        this.isPlaying = false;
        if (this.audio) this.audio.isPlaying = false;
        this._emit('ended');
      }
    };

    try {
      src.start(0, offset);
    } catch (e) {
      console.error('Failed to start source:', e);
      return;
    }
    this.audio.source = src;
    this.startTime = ctx.currentTime - offset;
    this.isPlaying = true;
    if (this.audio) this.audio.isPlaying = true;
  }

  seek(seconds, { autoplay } = {}) {
    if (!this.audio || !this.audio.context || !this.audio.buffer) return;
    const duration = this.audio.buffer.duration;
    if (!(duration > 0)) return;

    const target = Math.max(0, Math.min(seconds, duration - 0.001));

    this.pausedAt = target;
    this.startTime = this.audio.context.currentTime - target; // Corrected startTime calculation
    this._stopCurrentSource();

    const shouldPlay = autoplay ?? this.isPlaying;
    if (shouldPlay) {
      this.play();
    } else {
      this.isPlaying = false;
      if (this.audio) this.audio.isPlaying = false;
    }
  }

  async changeAudio(newAudioUrl, { autoplay = true } = {}) {
    if (!newAudioUrl) return;

    this._stopCurrentSource();
    this.isPlaying = false;
    if (this.audio) this.audio.isPlaying = false;

    this.song.url = newAudioUrl;
    await this.loadAudioBuffer();

    this.pausedAt = 0;
    this.startTime = this.audio?.context?.currentTime ?? 0; // Reset startTime for new audio

    if (autoplay) {
      this.play();
    }
  }

  stop() {
    this.pause();
    this.pausedAt = 0;
    this.startTime = this.audio?.context?.currentTime ?? 0;
  }

  /* --- Helpers ----------------------------------------- */
  _stopCurrentSource() {
    const src = this.audio?.source;
    if (src) {
      this._markManualStop(); // Ensure any onended event is suppressed
      try { src.onended = null; } catch (e) { /* ignore */ }
      try { src.stop(0); } catch (e) { /* already stopped? */ }
      try { src.disconnect(); } catch (e) { /* ignore */ }
      this.audio.source = null;
    }
  }

  getCurrentTime() {
    const elapsed = this.isPlaying ? this.audioContext.currentTime - this.startTime : this.pausedAt;
    const clamped = Math.min(elapsed, this.audio.buffer?.duration || elapsed);
    const minutes = Math.floor(clamped / 60);
    const seconds = Math.floor(clamped % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  getPlaybackSeconds() {
    return this.isPlaying
      ? this.audioContext.currentTime - this.startTime
      : this.pausedAt;
  }

  getDurationSeconds() {
    return this.audio.buffer?.duration || 0;
  }

  collectAudioData() {
    if (this.audioAnalyser) {
      this.audioAnalyser.getFrequencyData();
    }
  }

  analyzeFrequency() {
    if (!this.audioAnalyser || !this.audioContext) return;
    const data = this.audioAnalyser.getFrequencyData(); // Get current frequency data
    this.frequencyArray = Array.from(data); // Convert Uint8Array to regular Array for easier processing

    const sampleRate = this.audioContext.sampleRate;
    // Calculate ranges dynamically based on desired frequencies and sample rate
    const getFrequencyIndex = (freq) => Math.floor((freq * this.bufferLength) / sampleRate);

    const lowFreqRangeStart = getFrequencyIndex(this.lowFrequency);
    const lowFreqRangeEnd = getFrequencyIndex(this.midFrequency) - 1; // Ensure no overlap
    const midFreqRangeStart = getFrequencyIndex(this.midFrequency);
    const midFreqRangeEnd = getFrequencyIndex(this.highFrequency) - 1; // Corrected high freq end
    const highFreqRangeStart = getFrequencyIndex(this.highFrequency);
    const highFreqRangeEnd = this.bufferLength - 1; // Up to Nyquist frequency

    const lowAvg = this.normalizeValue(this.calculateAverage(this.frequencyArray, lowFreqRangeStart, lowFreqRangeEnd));
    const midAvg = this.normalizeValue(this.calculateAverage(this.frequencyArray, midFreqRangeStart, midFreqRangeEnd));
    const highAvg = this.normalizeValue(this.calculateAverage(this.frequencyArray, highFreqRangeStart, highFreqRangeEnd));

    this.frequencyData = {
      low: lowAvg,
      mid: midAvg,
      high: highAvg,
    };
  }

  calculateAverage(array, start, end) {
    if (start > end || start < 0 || end >= array.length) return 0;
    let sum = 0;
    for (let i = start; i <= end; i++) {
      sum += array[i];
    }
    return sum / (end - start + 1);
  }

  normalizeValue(value) {
    // Assuming frequency values are 0-255 (Uint8Array)
    return value / 255; // Normalize to 0-1 range
  }

  update() {
    if (!this.isPlaying) return;
    this.collectAudioData();
    this.analyzeFrequency();
  }

  async dispose() {
    this.stop();
    if (this.audioAnalyser) {
      // Disconnect analyser from audio graph
      // Note: THREE.AudioAnalyser usually manages its own connections,
      // but ensure no lingering references
      this.audioAnalyser = null;
    }
    if (this.audio) {
      // Ensure the underlying AudioContext source and gain node are properly disconnected
      if (this.audio.source) {
        try { this.audio.source.stop(0); } catch (e) { /* already stopped? */ }
        try { this.audio.source.disconnect(); } catch (e) { /* ignore */ }
        this.audio.source = null;
      }
      if (this.audio.getOutput()) {
        try { this.audio.getOutput().disconnect(); } catch (e) { /* ignore */ }
      }
      this.audio = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try { await this.audioContext.close(); } catch (e) { console.error("Error closing AudioContext:", e); }
      this.audioContext = null;
    }
    this.frequencyArray = [];
    this.frequencyData = { low: 0, mid: 0, high: 0 };
    this._listeners = { ended: new Set() }; // Reset listeners
  }
}