// Renderer.jsx
import React, { Component } from 'react';
import * as THREE from 'three';
import Text3DSpin from './entities/Text_ENplusFA';
import SpotLightPLYDemo_ext1 from './entities/fromThreejs_spotlight_extension_1';
import CameraAnimator from './CameraAnimator.js';
import BPMManager from './managers/BPMManager';
import AudioManager from './managers/AudioManager';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Basic easing functions (matching those in CameraAnimator.js for consistency)
const Easing = {
  Linear: {
    None: (t) => t,
  },
  Quadratic: {
    In: (t) => t * t,
    Out: (t) => t * (2 - t),
    InOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  },
  Cubic: {
    In: (t) => t * t * t,
    Out: (t) => (--t) * t * t + 1,
    InOut: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
  },
};

export default class Renderer extends Component {
  static holder = null;
  static gui = null; // Keep for now, but consider removal if unused
  static audioManager = null;
  static bpmManager = null;
  static string = null;
  cameraAnimator = null;
  Text3DSpin = null;
  SpotLightPLYDemo_ext1 = null;

  constructor(props) {
    super(props);
    this.mountRef = React.createRef();
    this.containerRef = React.createRef();
    this.init = this.init.bind(this);
    this.update = this.update.bind(this);
    this._onWindowResize = this._onWindowResize.bind(this);
    Renderer.string = 'Select a beat';
    this._initialized = false;
    this.renderer = null;
    this.camera = null;
    this.scene = null;
    this.controls = null;
    this.handleMouseClick = this.handleMouseClick.bind(this);
    this.words_history = [];
    this.state = {
      waitingForClick: true,
    };
    this._onBeat = this._onBeat.bind(this);
    this.count_align = 0;
    this.byclick = false;
    this.beatCountForEffects = 0;
    this.beatCounter = 0; // Unified beat counter
    this.currentLoopIndex = 0; // To track index for cycling text effects
  }

  static instance = null;

  static triggerVisualEffects(settings) {
    if (!this.instance) {
      console.warn("Renderer instance not available to trigger effects.");
      return;
    }
    this.instance.applyVisualEffects(settings);
  }

  _onBeat() {
    // console.log('_onBeat triggered'); // Debugging beat events

    // Always increment beatCounter
    this.beatCounter++;

    // Update frequency data for the latest visual response
    Renderer.audioManager?.collectAudioData();
    Renderer.audioManager?.analyzeFrequency();

    // Floor ripple effect (independent of effectTriggerMode, always active for beats 1,2,3 out of 4)
    if (this.beatCounter % 4 !== 0) { // Ripple for beats 1, 2, 3
      this.SpotLightPLYDemo_ext1?.animateFloorRipple(Renderer.audioManager?.frequencyData);
    } else { // No ripple for the 4th beat
      this.SpotLightPLYDemo_ext1?.stopFloorAnimation(); // Ensure no ripple on 4th beat
    }

    // New effects for every 4th beat (4, 8, 12, 16, 20...)
    if (this.beatCounter % 4 === 0 && this.beatCounter % 16 !==0) {
      this.SpotLightPLYDemo_ext1?.animateLightStrobe(0.1, 1.0, 0); // Strobe light every 16 beats
      this.SpotLightPLYDemo_ext1?.animateLightCone(Math.PI / 8, Math.PI / 2, 0.5, "power1.inOut", 0); // Cone animation from light
    }

    // New effects for every 16th beat (16, 32, 48...)
    if (this.beatCounter % 16 === 0) {
      this.triggerCameraShake(); // Shake camera every 4 beats

      this.SpotLightPLYDemo_ext1?.animateLightStrobe(0.1, 1.0, 0); // Strobe light every 16 beats
      this.SpotLightPLYDemo_ext1?.animateFloorColorCycle();
    }


    // Trigger text effects based on 'on_word_change' (automatic mode)
    if (this.props.wordSettings.wordChangeMode === "automatic" && this.Text3DSpin.beatcount % Math.max(1, this.Text3DSpin.beatlimit) === 0) {
      const automaticTextEffects = ['bounce', 'punched', 'bigCrunch', 'slideFade']; // Cycle through these
      const nextEffect = automaticTextEffects[this.currentLoopIndex % automaticTextEffects.length];
      this.Text3DSpin?.triggerTextAnimation(nextEffect, this.Text3DSpin.text);
      this.currentLoopIndex++;
    }


    // Trigger effects based on settings.effectTriggerMode (other than 'on_word_change')
    if (this.props.wordSettings.effectTriggerMode === 'on_beat') {
      this.applyVisualEffects(this.props.wordSettings);
    } else if (this.props.wordSettings.effectTriggerMode === 'every_10_beats') {
      this.beatCountForEffects++;
      if (this.beatCountForEffects % 10 === 0) {
        this.applyVisualEffects(this.props.wordSettings);
        this.beatCountForEffects = 0; // Reset after trigger
      }
    }

    // Pass frequency data to relevant components for beat-driven effects that are not conditional to wordSettings
    if (this.SpotLightPLYDemo_ext1) {
      // General beat-driven visual feedback, not overridden by wordSettings.lightEffect or floorEffect 'none'
      // This will ensure some light/floor reaction even if effects are set to 'none' in the panel
      // unless specifically asked to be completely off.
      // Removed the wordSettings condition here to make it independent.
      this.SpotLightPLYDemo_ext1.onBPMBeat(Renderer.audioManager?.frequencyData);
    }

    // Text3DSpin handles its own word change logic
    this.Text3DSpin?.onBPMBeat?.(); // This increments Text3DSpin's beatcount
  }

  applyVisualEffects(settings) {
    // --- Camera Effects ---
    // Only apply if the cameraEffect is NOT 'none', otherwise let general update handle it.
    if (settings.cameraEffect !== 'none') {
      this.cameraAnimator?.stopAnimation(); // Stop any previous animation
      switch (settings.cameraEffect) {
        case 'home':
          this.animateToHomePosition();
          break;
        case 'top':
          this.animateToTopView();
          break;
        case 'path':
          this.animatePathAroundScene();
          break;
        case 'shake':
          this.triggerCameraShake();
          break;
        case 'dolly':
          this.animateCameraDollyEffect();
          break;
        case 'focusShift':
          this.animateCameraFocusShiftEffect();
          break;
        case 'spiral':
          this.animateCameraSpiralEffect();
          break;
        default:
          break;
      }
    } else {
      // If cameraEffect is 'none', ensure any active camera animation is stopped and reset to initial position.
      // if (this.cameraAnimator?.animation.active) {
      //   this.cameraAnimator?.resetToInitialPosition();
      // }
    }

    // --- Spotlight Effects ---
    if (settings.lightEffect === 'none') {
      this.SpotLightPLYDemo_ext1?.stopLightAnimation();
    } else {
      this.SpotLightPLYDemo_ext1?.stopLightAnimation(); // Stop any *previous* light animation
      switch (settings.lightEffect) {
        case 'pulse':
          this.SpotLightPLYDemo_ext1?.animateLightPulse();
          break;
        case 'colorShift':
          this.SpotLightPLYDemo_ext1?.animateLightColorShift();
          break;
        case 'orbit':
          this.SpotLightPLYDemo_ext1?.animateLightOrbit();
          break;
        case 'strobe':
          this.SpotLightPLYDemo_ext1?.animateLightStrobe();
          break;
        case 'cone':
          this.SpotLightPLYDemo_ext1?.animateLightCone();
          break;
        case 'penumbra':
          this.SpotLightPLYDemo_ext1?.animateLightPenumbra();
          break;
        case 'colorCycle':
          this.SpotLightPLYDemo_ext1?.animateLightColorCycle();
          break;
        case 'sweep':
          this.SpotLightPLYDemo_ext1?.animateLightSweep();
          break;
        case 'heightBounce':
          this.SpotLightPLYDemo_ext1?.animateLightHeightBounce();
          break;
        default:
          break;
      }
    }

    // --- Floor Effects ---
    // If a specific floor effect is chosen (other than 'none' or 'ripple'), apply it.
    // The general ripple on beat 1,2,3 is handled separately in _onBeat.
    if (settings.floorEffect !== 'none' && settings.floorEffect !== 'ripple') {
      this.SpotLightPLYDemo_ext1?.stopFloorAnimation(); // Stop any *previous* floor animation
      switch (settings.floorEffect) {
        case 'wave':
          this.SpotLightPLYDemo_ext1?.animateFloorWave();
          break;
        case 'colorCycle':
          this.SpotLightPLYDemo_ext1?.animateFloorColorCycle();
          break;
        case 'displace':
          this.SpotLightPLYDemo_ext1?.animateFloorDisplace();
          break;
        default:
          console.warn(`Unrecognized floor effect: ${settings.floorEffect}`);
          this.SpotLightPLYDemo_ext1?.stopFloorAnimation();
          break;
      }
    } else if (settings.floorEffect === 'none') {
      this.SpotLightPLYDemo_ext1?.stopFloorAnimation();
    } // 'ripple' is implicitly active through _onBeat function for certain beats.

    // --- Floor Texture (applied independently of floor effect, will override base texture of effect) ---
    if (settings.floorTexture && settings.floorTexture !== 'none') {
        this.SpotLightPLYDemo_ext1?.changeFloorTexture(settings.floorTexture);
    } else {
        this.SpotLightPLYDemo_ext1?.resetFloorTexture();
    }


    // --- Text Effects ---
    if (this.Text3DSpin) {
      this.Text3DSpin.currentTextEffect = settings.textEffect;
      // The actual text animation is triggered in Text3DSpin.WordChange()
    }
  }

  async init(beat_path, autoplay = true) { // Added autoplay parameter
    this.destroyManagers();
    this.destroyThree();
    document.removeEventListener('click', this.onClickBinder);
    this._initRenderer();
    if (this.mountRef.current) {
      this.mountRef.current.appendChild(this.renderer.domElement);
    }
    this._initCamera();
    this.scene = new THREE.Scene();
    this.scene.add(this.camera);
    this._initControls();
    this.cameraAnimator = new CameraAnimator(this.camera, this.controls);
    Renderer.holder = new THREE.Object3D();
    Renderer.holder.name = 'holder';
    this.scene.add(Renderer.holder);
    Renderer.holder.sortObjects = false;
    await this.createManagers(beat_path, autoplay); // Pass autoplay to createManagers
    this._onWindowResize();
    window.addEventListener('resize', this._onWindowResize);
    this._initialized = true;
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.addEventListener('click', this.handleMouseClick);
    }
    this.update(); // Start the update loop
    // Apply initial visual effects after everything is set up
    // No need to call this.applyVisualEffects here again if createManagers does it.
    // The previous implementation was a bit redundant.
  }

  destroyManagers() {
    if (Renderer.audioManager) {
      // Before disposing, remove the event listener for 'ended'
      Renderer.audioManager.removeEventListener('ended', this.props.handleAudioEnded);
      Renderer.audioManager.dispose();
      Renderer.audioManager = null;
    }
    if (Renderer.bpmManager) {
      Renderer.bpmManager.removeEventListener('beat', this._onBeat);
      Renderer.bpmManager.dispose();
      Renderer.bpmManager = null;
    }
    // Remove GUI disposal if not using
    if (Renderer.gui) {
      Renderer.gui.destroy();
      Renderer.gui = null;
    }
    const disposeEntity = (entity) => {
      if (!entity) return;
      entity.dispose?.();
    };
    disposeEntity(this.Text3DSpin);
    disposeEntity(this.SpotLightPLYDemo_ext1);
    this.Text3DSpin = null;
    this.SpotLightPLYDemo_ext1 = null;
    if (Renderer.holder) {
      // It's better to explicitly remove children from the scene before disposing the holder itself
      // or to ensure holder.clear() also disposes children properly.
      // Currently, children are disposed during scene traversal in destroyThree,
      // but holder.clear() removes them from the holder.
      Renderer.holder.traverse(object => {
        if (object.isMesh) {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              material.dispose();
            }
          }
        }
      });
      Renderer.holder.clear(); // Clears children from holder, but doesn't dispose them if not traversed above
      this.scene?.remove(Renderer.holder);
      Renderer.holder = null;
    }
    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }
    this._initialized = false;
  }

  destroyThree() {
    if (this._animationFrame) cancelAnimationFrame(this._animationFrame);
    window.removeEventListener('resize', this._onWindowResize);
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }
    if (this.scene) {
      // Recursively dispose of all objects in the scene
      this.scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach(mat => {
            // Dispose of textures if present in the material
            Object.values(mat)
              .filter(v => v && typeof v.dispose === 'function')
              .forEach(tex => tex.dispose());
            mat.dispose();
          });
        }
      });
      this.scene.clear(); // Clear all children from the scene
      this.scene = null;
    }
    if (this.renderer) {
      this.renderer.forceContextLoss(); // Release WebGL context
      this.renderer.domElement.removeEventListener('click', this.handleMouseClick);
      if (this.mountRef.current && this.mountRef.current.contains(this.renderer.domElement)) {
        try { this.mountRef.current.removeChild(this.renderer.domElement); } catch { }
      }
      this.renderer.dispose();
      this.renderer = null;
    }
    if (Renderer.gui) { // Ensure GUI is also destroyed
      Renderer.gui.destroy();
      Renderer.gui = null;
    }
    this._initialized = false;
  }

  async createManagers(audioPath, autoplay) { // Added autoplay parameter
    Renderer.audioManager = new AudioManager(audioPath);
    await Renderer.audioManager.loadAudioBuffer();
    // Only set playing state if autoplay is true and audio actually plays
    if (autoplay) {
        Renderer.audioManager.play();
    }
    this.props.setIsPlayingAudio?.(autoplay); // Set isPlayingAudio based on autoplay

    Renderer.bpmManager = new BPMManager();
    // Pass the audio context from AudioManager to BPMManager
    await Renderer.bpmManager.detectBPM(Renderer.audioManager.audio.buffer, Renderer.audioManager.audioContext);

    const userInter = document.querySelector('.user_interaction');
    if (userInter && userInter.parentNode) {
      userInter.remove();
    }

    // Start BPM tracking only if audio is intended to play
    if (autoplay && Renderer.audioManager.isPlaying) {
      Renderer.bpmManager.startBeatTracking(Renderer.audioManager.audio.source, Renderer.audioManager.audioContext);
    }

    this.Text3DSpin = new Text3DSpin();
    this.Text3DSpin.currentTextEffect = this.props.wordSettings.textEffect;
    this.Text3DSpin.init();

    this.SpotLightPLYDemo_ext1 = new SpotLightPLYDemo_ext1();
    this.SpotLightPLYDemo_ext1.init();

    Renderer.bpmManager.addEventListener('beat', this._onBeat);
    Renderer.audioManager.addEventListener('ended', this.props.handleAudioEnded);

    // Apply initial word settings which includes visual effects
    this.updateWordSettings(this.props.wordSettings); // This will call applyVisualEffects
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    const cw = this.containerRef.current?.clientWidth || window.innerWidth;
    const ch = this.containerRef.current?.clientHeight || window.innerHeight;
    this.renderer.setSize(cw, ch);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
  }

  _initCamera() {
    const cw = this.containerRef.current?.clientWidth || window.innerWidth;
    const ch = this.containerRef.current?.clientHeight || window.innerHeight;
    const aspect = cw / ch;
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
    this.camera.position.set(7, 4, 1);
  }

  _initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.minDistance = 2;
    this.controls.maxDistance = 10;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.target.set(0, 1, 0);
    this.controls.update();
  }

  _onWindowResize() {
    if (!this.camera || !this.renderer) return;
    const cw = this.containerRef.current?.clientWidth || window.innerWidth;
    const ch = this.containerRef.current?.clientHeight || window.innerHeight;
    this.camera.aspect = cw / ch;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(cw, ch);
  }

  updateWordSettings(newSettings) {
    if (this.Text3DSpin) {
      this.Text3DSpin.Lang = newSettings.selectedLanguage;
      this.Text3DSpin.currentTextEffect = newSettings.textEffect;
    }

    // Always ensure BPM listener is attached and tracking if audio is playing.
    // The conditional effects are now handled in _onBeat.
    if (Renderer.bpmManager) {
      Renderer.bpmManager.removeEventListener('beat', this._onBeat);
      Renderer.bpmManager.addEventListener('beat', this._onBeat);
      if (Renderer.audioManager?.isPlaying) {
        Renderer.bpmManager.startBeatTracking(Renderer.audioManager.audio.source, Renderer.audioManager.audioContext);
      } else {
        Renderer.bpmManager.stopBeatTracking();
      }
    }

    if (newSettings.wordChangeMode === "automatic") {
      if (this.Text3DSpin) {
        this.Text3DSpin.beatlimit = 21 - newSettings.automaticWordChange;
      }
    } else { // manual or other modes
      this.Text3DSpin.beatlimit = 0; // Disable automatic word change
    }

    // Call applyVisualEffects to update active effects based on new settings
    this.applyVisualEffects(newSettings);
  }

  async componentDidUpdate(prevProps) {
    // Only update wordSettings if they actually changed to prevent redundant calls to applyVisualEffects
    if (this.props.wordSettings !== prevProps.wordSettings) {
      this.updateWordSettings(this.props.wordSettings);
    }

    // Trigger text animation when word history length increases
    if (this.props.wordsHistory.length > prevProps.wordsHistory.length) {
      const { wordChangeMode, manualWordChange } = this.props.wordSettings;
      let effectToTrigger = this.props.wordSettings.textEffect; // Default to selected text effect

      if (wordChangeMode === 'automatic') {
        const automaticTextEffects = ['bounce', 'punched', 'bigCrunch', 'slideFade']; // Cycle through these
        effectToTrigger = automaticTextEffects[this.currentLoopIndex % automaticTextEffects.length];
        this.currentLoopIndex++;
      } else if (wordChangeMode === 'manual') {
        if (manualWordChange === 'click') {
          effectToTrigger = 'ripInHalfBlood';
        } else if (manualWordChange === 'space') {
          const manualSpaceTextEffects = ['liquidify', 'supernova']; // Cycle through these
          effectToTrigger = manualSpaceTextEffects[this.currentLoopIndex % manualSpaceTextEffects.length];
          this.currentLoopIndex++;
        }
      }
      this.Text3DSpin?.triggerTextAnimation(effectToTrigger, this.Text3DSpin.text);
      // Re-apply other effects to ensure consistency.
      // this.applyVisualEffects(this.props.wordSettings);
    }

    if (prevProps.currentAudio !== this.props.currentAudio) {
      const newUrl = this.props.currentAudio;
      const autoplay = this.props.isPlayingAudio;

      if (Renderer.audioManager) {
        // Stop current audio, change source, and play if autoplay is true
        await Renderer.audioManager.changeAudio(newUrl, { autoplay });
        // Immediately trigger camera path and floor texture change
        this.animatePathAroundScene();
        this.SpotLightPLYDemo_ext1?.changeFloorTexture('spotlight_7.jpg'); // Change to a specific texture or cycle
      } else {
        // If audioManager is not initialized, initialize it and autoplay
        await this.init(newUrl, autoplay);
        this.props.setIsPlayingAudio?.(autoplay); // Ensure React state reflects actual playing state
        // Immediately trigger camera path and floor texture change
        this.animatePathAroundScene();
        this.SpotLightPLYDemo_ext1?.changeFloorTexture('spotlight_7.jpg'); // Change to a specific texture or cycle
      }
      try {
        if (Renderer.audioManager?.audio?.buffer && Renderer.bpmManager) {
          await Renderer.bpmManager.detectBPM(Renderer.audioManager.audio.buffer, Renderer.audioManager.audioContext);
          if (Renderer.audioManager.isPlaying) {
             Renderer.bpmManager.startBeatTracking(Renderer.audioManager.audio.source, Renderer.audioManager.audioContext);
          } else {
            Renderer.bpmManager.stopBeatTracking(); // Ensure beat tracking stops if not playing
          }
        }
      } catch (e) {
        console.warn("BPM detection failed for new track:", e);
      }
    }
    // if (prevProps.isFullscreen !== this.props.isFullscreen) {
    //   this._onWindowResize();
    // }

    // Handle pause/resume effects
    if (this.props.isPlayingAudio !== prevProps.isPlayingAudio) {
      if (!this.props.isPlayingAudio) { // Just paused
        this.cameraAnimator.saveCameraState(); // Save current camera state before moving to home view
        this.animateToHomePosition(); // Camera Home view
        this.SpotLightPLYDemo_ext1?.animateFloorWave(); // Floor wave
        this.SpotLightPLYDemo_ext1?.animateLightHeightBounce(); // Light Heightbounce
      } else { // Just resumed
        this.cameraAnimator.restoreCameraState(); // Restore camera to where it was before pause
        this.SpotLightPLYDemo_ext1?.animateLightOrbit(); // Light orbit
      }
    }
  }

  addWordinPage() {
    try {
      if (typeof this.props.appendWord === 'function') {
        this.props.appendWord(this.Text3DSpin.text);
      } else {
        this.words_history = this.words_history || [];
        this.words_history.push(this.Text3DSpin.text);
      }
      return;
    } catch {
      return;
    }
  }

  handleMouseClick(event) {
    this.setState({ waitingForClick: false }, () => {
      if (this.props.wordSettings.wordChangeMode === "manual" && this.props.wordSettings.manualWordChange === "click") {
        this.addWordinPage();
        this.Text3DSpin.WordChange();
      }

      if (!this._initialized || !this.renderer || !this.renderer.domElement || !this.scene) return;
      const rect = this.renderer.domElement.getBoundingClientRect();
      const mouse = {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((event.clientY - rect.top) / rect.height) * 2 + 1,
      };
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, this.camera);
      const intersects = raycaster.intersectObjects(this.scene.children, true);
      if (intersects.length > 0) {
        const firstIntersect = intersects[0].object;
        console.log('Clicked on object:', firstIntersect);
      }
    });
  }

  onKeyDown = (event) => {
    if (this.props.wordSettings.wordChangeMode === "manual" && this.props.wordSettings.manualWordChange === "space") {
      if (event.key === " " || event.code === "Space") {
        event.preventDefault();
        this.addWordinPage();
        this.Text3DSpin.WordChange();
      }
    }
  };

  componentDidMount() {
    Renderer.instance = this;
    this.destroyManagers();
    this.destroyThree();
    this._initRenderer();
    if (this.mountRef.current) {
      this.mountRef.current.appendChild(this.renderer.domElement);
    }
    document.addEventListener('keydown', this.onKeyDown);
  }

  componentWillUnmount() {
    Renderer.instance = null;
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('click', this.onClickBinder);
    if (this._animationFrame) cancelAnimationFrame(this._animationFrame);
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.removeEventListener('click', this.handleMouseClick);
    }
    // Explicitly stop all animations on unmount
    this.cameraAnimator?.stopAnimation();
    this.SpotLightPLYDemo_ext1?.stopLightAnimation();
    this.SpotLightPLYDemo_ext1?.stopFloorAnimation();
    this.destroyManagers();
    this.destroyThree();
  }

  update() {
    if (!this._initialized) {
      this._animationFrame = requestAnimationFrame(this.update);
      return;
    }
    // CameraAnimator's update only calls controls.update() when no animation is active,
    // so this is safe and allows user interaction when no camera animation is running.
    this.cameraAnimator?.update();

    // Update audio manager to collect and analyze frequency data continuously
    Renderer.audioManager?.update();

    // Make the text face the camera
    if (this.Text3DSpin && this.Text3DSpin.group && this.camera) {
      this.Text3DSpin.group.lookAt(this.camera.position);
    }

    if (this.Text3DSpin) {
      if (this.props.wordSettings.wordChangeMode === "automatic") {
        if (Text3DSpin.word_change_counter !== this.count_align) {
          // Only add to page if a word change has occurred and hasn't been added yet
          this.addWordinPage();
          this.count_align = Text3DSpin.word_change_counter; // Update alignment counter
        }
      }
    }

    this.Text3DSpin?.update?.();
    this.SpotLightPLYDemo_ext1?.update?.();
    this.renderer.render(this.scene, this.camera);
    this._animationFrame = requestAnimationFrame(this.update);
  }


  randomSign() {
    return Math.random() < 0.5 ? -1 : 1;
  }


  animateCameraDollyEffect() {
    const result =  this.randomSign();
    this.cameraAnimator.animateCameraDolly(2000, -3); // Dolly in by 3 units
  }

  animateCameraFocusShiftEffect() {
    // Example: shift focus to a point slightly in front and above the origin
    this.cameraAnimator.animateCameraFocusShift(new THREE.Vector3(0, 2, 0), 1500, Easing.Cubic.Out);
  }

  animateCameraSpiralEffect() {
    const result =  this.randomSign();
    this.cameraAnimator.animateCameraSpiral(2000, 1.5, 3,6); // 1.5 revolutions, 3 units height change, radius 6
  }

  // Modified animateToHomePosition to optionally animate or snap
  animateToHomePosition(withAnimation = true) {
    const targetPosition = new THREE.Vector3(7, 4, 1);
    const targetLookAt = new THREE.Vector3(0, 1, 0);

    if (withAnimation) {
      this.cameraAnimator.animateCameraTo(
        targetPosition,
        targetLookAt,
        2000,
        Easing.Cubic.Out
      );
    } else {
      // No animation, just set positions
      this.camera.position.copy(targetPosition);
      this.controls.target.copy(targetLookAt);
      this.controls.update(); // Important to update controls after manual changes
    }
  }

  animateToTopView() {
    this.cameraAnimator.animateCameraTo(
      new THREE.Vector3(0, 10, 0),
      new THREE.Vector3(0, 0, 0),
      1500,
      Easing.Quadratic.InOut
    );
  }
  animatePathAroundScene() {
    const path = [
      new THREE.Vector3(10, 5, 0),
      new THREE.Vector3(0, 5, 10),
      new THREE.Vector3(-10, 5, 0),
      new THREE.Vector3(0, 5, -10),
      new THREE.Vector3(10, 5, 0)
    ];
    this.cameraAnimator.animateCameraPath(path, 10000, Easing.Linear.None, true);
  }
  triggerCameraShake() {
    this.cameraAnimator.shakeCamera(100, 0.5);
  }
  render() {
    const overlayClasses = "absolute inset-0 flex items-center justify-center bg-black/65 text-white text-2xl z-10 pointer-events-none";
    const promptClasses = "p-4 px-6 rounded-lg shadow-xl bg-black/50";

    return (
      <div
        className="three-root w-full h-full overflow-hidden relative rounded-3xl"
        ref={this.containerRef}
      >
        <div ref={this.mountRef} className="w-full h-full" />
        {this.state.waitingForClick &&
          (<div className={overlayClasses} aria-label="Click to start" role="dialog">
            <div className={promptClasses}>
              {`${Renderer.string}`}
            </div>
          </div>)}
      </div>
    );
  }
}