// BPMManager.js
import { EventDispatcher } from 'three';
import { guess } from 'web-audio-beat-detector'; // Consider more advanced libraries for specific hip-hop sub-genres

export default class BPMManager extends EventDispatcher {
  constructor() {
    super();
    this.interval = 0; // Milliseconds per beat
    this.intervalId = null; // Timer ID for beat interval
    this.bpmValue = 0; // Detected BPM value
    this.lastBeatTime = 0; // Timestamp of the last dispatched beat
    this.beatCounter = 0; // Counter for beat events
    this.audioSource = null; // Reference to the audio source for accurate beat timing
    this.isPlaying = false; // Internal state for beat tracking
  }

  /**
   * Sets the BPM and starts a high-resolution interval to emit beat events.
   * Uses requestAnimationFrame for more precise timing if audio context is available.
   * @param {number} bpm - The detected BPM value.
   * @param {AudioContext} audioContext - The Web Audio API AudioContext for precise timing.
   */
  setBPM(bpm, audioContext = null) {
    this.bpmValue = bpm;
    this.interval = 60000 / bpm; // Milliseconds per beat

    // Clear any existing interval
    if (this.intervalId) {
      if (typeof this.intervalId === 'number') {
        clearInterval(this.intervalId);
      } else {
        cancelAnimationFrame(this.intervalId);
      }
      this.intervalId = null;
    }

    // Use a more precise timing mechanism if AudioContext is available
    if (audioContext && audioContext.state === 'running') {
      console.log(`BPMManager using AudioContext for beat timing. Interval: ${this.interval}ms`);
      this.lastBeatTime = audioContext.currentTime * 1000; // Convert to milliseconds
      const beatScheduler = () => {
        // Only schedule beats if audio is playing and audioSource is valid
        if (this.isPlaying && this.audioSource && audioContext) {
          const currentTime = audioContext.currentTime * 1000; // Current time in milliseconds
          while (currentTime >= this.lastBeatTime + this.interval) {
            this.dispatchEvent({ type: 'beat', beatNumber: ++this.beatCounter, timestamp: this.lastBeatTime });
            this.lastBeatTime += this.interval;
          }
          this.intervalId = requestAnimationFrame(beatScheduler);
        } else {
            this.stopBeatTracking(); // Ensure cleanup if conditions are not met
        }
      };
      this.intervalId = requestAnimationFrame(beatScheduler);
    } else {
      console.log(`BPMManager using setInterval for beat timing. Interval: ${this.interval}ms`);
      // Fallback to setInterval if AudioContext is not available or not running
      this.intervalId = setInterval(() => {
        if (this.isPlaying) { // Only dispatch if playing
          this.dispatchEvent({ type: 'beat', beatNumber: ++this.beatCounter, timestamp: performance.now() });
        }
      }, this.interval);
    }
  }

  /**
   * Detects BPM from an audio buffer and updates the BPM.
   * @param {AudioBuffer} audioBuffer - The audio buffer to analyze.
   * @param {AudioContext} audioContext - The AudioContext used for the audio buffer.
   */
  async detectBPM(audioBuffer, audioContext) {
    try {
      const { bpm } = await guess(audioBuffer);
      this.setBPM(bpm, audioContext);
      console.log(`BPM detected: ${bpm}`);
    } catch (error) {
      console.error("BPM detection failed:", error);
      // Fallback to a default BPM or handle gracefully
      this.setBPM(120, audioContext); // Default to 120 BPM if detection fails
    }
  }

  /**
   * Returns the duration of one beat in milliseconds.
   * @returns {number} Duration of one beat in milliseconds.
   */
  getBPMDuration() {
    return this.interval;
  }

  // Lifecycle methods
  stop() {
    this.stopBeatTracking(); // Call the more specific stop method
    this.bpmValue = 0;
    this.lastBeatTime = 0;
    this.beatCounter = 0;
  }

  dispose() {
    this.stop();
    this.dispatchEvent({ type: 'disposed' });
    this._listeners = {}; // Clear all event listeners
  }

  /**
   * Call this when audio starts playing to enable precise beat scheduling.
   * @param {AudioBufferSourceNode} audioSource - The active audio buffer source node.
   * @param {AudioContext} audioContext - The active Web Audio API AudioContext.
   */
  startBeatTracking(audioSource, audioContext) {
    this.audioSource = audioSource;
    this.isPlaying = true;
    this.lastBeatTime = audioContext.currentTime * 1000;
    this.beatCounter = 0;
    // Restart the scheduler using the precise AudioContext timing
    this.setBPM(this.bpmValue, audioContext);
  }

  /**
   * Call this when audio stops or pauses.
   */
  stopBeatTracking() {
    this.isPlaying = false;
    this.audioSource = null;
    if (this.intervalId) {
      if (typeof this.intervalId === 'number') { // Check if it's a setInterval ID
        clearInterval(this.intervalId);
      } else { // Assume it's a requestAnimationFrame ID
        cancelAnimationFrame(this.intervalId);
      }
      this.intervalId = null;
    }
  }
}