import * as THREE from 'three'

export default class AudioManager {
  _listeners = { ended: new Set() };
_suppressEndedOnce = false;

  constructor(mafukinURL) {
    this.startTime = 0        // AudioContext timestamp when play() was called
    this.pausedAt  = 0        // Accumulated seconds when pause() was called

    this.frequencyArray = []
    this.frequencyData = {
      low: 0,
      mid: 0,
      high: 0,
    }
    this.isPlaying = false
    this.lowFrequency = 10 //10Hz to 250Hz
    this.midFrequency = 150 //150Hz to 2000Hz
    this.highFrequency = 9000 //2000Hz to 20000Hz
    this.smoothedLowFrequency = 0
    this.audioContext = null
    this.song = {
      url: mafukinURL
      // url: 'https://p.scdn.co/mp3-preview/3be3fb77f5b2945c95e86d4c40ceceac20e5108f?cid=b62f0af3b0d54eca9bb49b99a2fc5820',
    }
    // Initialize audio and analyser here if not already
    const audioListener = new THREE.AudioListener();
    this.audio = new THREE.Audio(audioListener);
    this.audioAnalyser = new THREE.AudioAnalyser(this.audio, 1024);
    this.audio.setLoop(false); // do not loop by default

  }
// Optionally expose a setter
setLoop(looping) {
  if (this.audio) this.audio.setLoop(!!looping);
}
  async loadAudioBuffer() {
    // Load the audio file and create the audio buffer
    const promise = new Promise(async (resolve, reject) => {
      const audioLoader = new THREE.AudioLoader();
      audioLoader.load(this.song.url, (buffer) => {
        this.audio.setBuffer(buffer);
        this.audio.setLoop(false); // CHANGED: do not loop; playlists manage sequencing
        this.audio.setVolume(1.0);
        this.audioContext = this.audio.context;
        this.bufferLength = this.audioAnalyser.data.length;
        resolve();
      },
      undefined, // onProgress callback, not used here
      (error) => {
        console.error("Error loading audio:", error);
        reject(error);
      });
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
    try { fn(payload); } catch (e) { /* noop */ }
  }
}
// Call this whenever you intentionally interrupt current source
_markManualStop() {
  this._suppressEndedOnce = true;
  // Ensure it only suppresses the immediate onended that follows
  queueMicrotask(() => { this._suppressEndedOnce = false; });
}

pause() {
  if (!this.audio || !this.audio.context) return;
  if (!this.isPlaying) return;
  // Compute how much has played so far
  this.pausedAt = this.audio.context.currentTime - this.startTime;
  // Stop the current source cleanly
  this._stopCurrentSource();
  this.isPlaying = false;
  if (this.audio) this.audio.isPlaying = false;
}
// In play(), emit 'ended' on natural end:
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
  src.loopEnd  = this.audio.loopEnd  ?? buffer.duration;
  const output = this.audio.getOutput ? this.audio.getOutput() : this.audio.gain;
  src.connect(output);
  src.onended = () => {
    // Ignore synthetic ends from manual stop/seek
    if (this._suppressEndedOnce) return;
    if (!src.loop) {
      this.isPlaying = false;
      if (this.audio) this.audio.isPlaying = false;
      // Notify listeners so UI can advance to next track
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
  if (!this.audio || !this.audio.context) return;
  const duration = this.audio.buffer?.duration ?? this.audio.duration ?? 0;
  if (!(duration > 0)) return;

  const target = Math.max(0, Math.min(seconds, duration - 0.001));

  // Update timeline
  this.pausedAt = target;
  this.startTime = this.audio.context.currentTime - target;

  // Always stop current source so there is never overlap
  this._stopCurrentSource();

  const shouldPlay = autoplay ?? this.isPlaying;

  if (shouldPlay) {
    // Will start from pausedAt (target) without requiring a second click
    this.play();
  } else {
    // Stay paused at the new head position
    this.isPlaying = false;
    if (this.audio) this.audio.isPlaying = false;
  }
}
async changeAudio(newAudioUrl, { autoplay = true } = {}) {
  if (!newAudioUrl) return;
  // Stop current source before swapping buffer
  this._stopCurrentSource();
  this.isPlaying = false;
  if (this.audio) this.audio.isPlaying = false;
  this.song.url = newAudioUrl;
  await this.loadAudioBuffer();
  // Reset timeline to start
  this.pausedAt = 0;
  this.startTime = this.audio?.context?.currentTime ?? 0;
  if (autoplay) this.play();
}
stop() {
  // Semantic stop: pause and reset to start
  this.pause();
  this.pausedAt = 0;
  this.startTime = this.audio?.context?.currentTime ?? 0;
}
/* ─── Helpers ─────────────────────────────────────────── */
_stopCurrentSource() {
  const src = this.audio?.source;
  if (src) {
    this._suppressEndedOnce = true;
    queueMicrotask(() => { this._suppressEndedOnce = false; });
    try { src.onended = null; } catch {}
    try { src.stop(0); } catch {}
    try { src.disconnect(); } catch {}
    this.audio.source = null;
  }
}

// --- When creating a new BufferSource ---
_createAndStartSource(offsetSeconds = 0, autoplay = true) {
  const src = this.audioContext.createBufferSource();
  src.buffer = this.audio.buffer;
  src.connect(this.gainNode);
  src.onended = () => {
    // Ignore synthetic ends from manual stop/seek
    if (this._suppressEndedOnce) return;
    this.isPlaying = false;
    this._emit('ended');
  };
  if (autoplay) {
    src.start(0, offsetSeconds);
    this.isPlaying = true;
    this._startedAt = this.audioContext.currentTime - offsetSeconds;
  }
  this._currentSource = src;
}
  /**
   * @returns {string} Current playback time formatted as MM:SS
   */
  getCurrentTime() {
    // choose elapsed time depending on play/pause state
    const elapsed = (this.isPlaying
      ? this.audioContext.currentTime - this.startTime
      : this.pausedAt
    )
    // clamp to buffer duration if needed
    const clamped = Math.min(elapsed, this.audio.buffer?.duration || elapsed)
    
    const minutes = Math.floor(clamped / 60)
    const seconds = Math.floor(clamped % 60)
    
    // zero-pad both values
    const mm = String(minutes).padStart(2, '0')
    const ss = String(seconds).padStart(2, '0')
    
    return `${mm}:${ss}`
  }


    // in AudioManager
  getPlaybackSeconds() {
    return this.isPlaying
      ? this.audioContext.currentTime - this.startTime
      : this.pausedAt;
  }
  getDurationSeconds() {
    return this.audio.buffer?.duration || 0;
  }
  collectAudioData() {
    this.frequencyArray = this.audioAnalyser.getFrequencyData();
  }



  analyzeFrequency() {
    // Calculate the average frequency value for each range of frequencies
    const lowFreqRangeStart = Math.floor((this.lowFrequency * this.bufferLength) / this.audioContext.sampleRate);
    const lowFreqRangeEnd = Math.floor((this.midFrequency * this.bufferLength) / this.audioContext.sampleRate);
    const midFreqRangeStart = Math.floor((this.midFrequency * this.bufferLength) / this.audioContext.sampleRate);
    const midFreqRangeEnd = Math.floor((this.highFrequency * this.bufferLength) / this.audioContext.sampleRate);
    const highFreqRangeStart = Math.floor((this.highFrequency * this.bufferLength) / this.audioContext.sampleRate);
    const highFreqRangeEnd = this.bufferLength - 1;

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
    let sum = 0;
    for (let i = start; i <= end; i++) {
      sum += array[i];
    }
    return sum / (end - start + 1);
  }

  normalizeValue(value) {
    // Assuming the frequency values are in the range 0-256 (for 8-bit data)
    return value / 256;
  }

  update() {
    if (!this.isPlaying) return;
    this.collectAudioData();
    this.analyzeFrequency();
  }

  
  async dispose() {
    // 1. Stop playback
    this.stop()
    // 2. Disconnect analyser
    if (this.audioAnalyser && this.audioAnalyser.getFrequencyData) {
      this.audioAnalyser = null
    }
    // 3. Stop & disconnect source node (Three.js Audio.source)
    if (this.audio && this.audio.source) {
      try {
        this.audio.source.stop(0)
      } catch (e) { /* already stopped? */ }
      this.audio.source.disconnect()
    }


    this.audio = null
    this.frequencyArray = []
    this.frequencyData  = { low:0, mid:0, high:0 }
  }
}