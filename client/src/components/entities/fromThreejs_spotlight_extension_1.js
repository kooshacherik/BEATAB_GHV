// client/src/components/entities/fromThreejs_spotlight_extension_1.js
import * as THREE from 'three';
import gsap from 'gsap';
import Renderer from '../Renderer'; // Import Renderer to access global state/instance

/**
 * Manages a Three.js spotlight, floor, and various light animations.
 * Synchronizes animations with BPM beats and audio frequency data.
 */
export default class SpotLightPLYDemo_ext1 extends THREE.Object3D {
  /** @type {THREE.SpotLight|null} The main spotlight. */
  spotLight = null;
  /** @type {THREE.SpotLightHelper|null} Helper for visualizing the spotlight. */
  lightHelper = null;
  /** @type {THREE.Mesh|null} The floor mesh. */
  floor = null;
  /** @type {Object.<string, THREE.Texture|null>} Loaded textures for spotlight map and floor. */
  textures = { none: null };
  /** @type {Object3D|null} Holder for all objects managed by this class. */
  holderObjects = null;

  /**
   * @typedef {object} LightParameters
   * @property {THREE.Texture|null} map - Spotlight texture map.
   * @property {number} color - Spotlight color in hexadecimal.
   * @property {number} intensity - Spotlight intensity.
   * @property {number} distance - Maximum range of the spotlight.
   * @property {number} angle - Angular extent of the spotlight.
   * @property {number} penumbra - Percentage of the spotlight cone that is attenuated due to penumbra.
   * @property {number} decay - The amount the light dims along the distance of the light.
   * @property {number} focus - Focus of the spotlight.
   * @property {boolean} shadows - Whether the spotlight casts shadows.
   */
  /** @type {LightParameters} Default and current spotlight parameters. */
  params = {
    map: null,
    color: 0xffffff,
    intensity: 800,
    distance: 20,
    angle: Math.PI / 4,
    penumbra: 1,
    decay: 2,
    focus: 1,
    shadows: true,
  };

  /**
   * @typedef {object} AnimationState
   * @property {gsap.core.Timeline|null} lightTimeline - GSAP Timeline for light animations.
   * @property {gsap.core.Timeline|null} floorTimeline - GSAP Timeline for floor animations.
   * @property {object} originalLightState - Original properties of the light for resetting.
   * @property {object} originalFloorState - Original properties of the floor for resetting.
   */
  /** @type {AnimationState} Current animation state and original values for resetting. */
  animation = {
    lightTimeline: null,
    floorTimeline: null,
    // Store original properties for robust resetting
    originalLightState: {
      intensity: 0,
      color: new THREE.Color(),
      position: new THREE.Vector3(),
      angle: 0,
      penumbra: 0,
      map: null,
    },
    originalFloorState: {
      color: new THREE.Color(),
      map: null,
    },
  };

  constructor() {
    super();
  }

  /**
   * Initializes the spotlight, floor, and loads textures.
   * Adds itself to the global Renderer.holder.
   */
  init() {
    if (Renderer.holder) {
      Renderer.holder.add(this);
    } else {
      console.warn("Renderer.holder is not initialized. Spotlight will not be added to the scene.");
    }

    this.holderObjects = new THREE.Object3D();
    this.add(this.holderObjects); // Add a local holder for easier management

    this._initLights();
    this._loadTextures();
    this._loadAndSetSpotlightMap('transition2.png'); // Default map

    // Store initial properties for resetting
    if (this.spotLight) {
      this.animation.originalLightState.intensity = this.spotLight.intensity;
      this.animation.originalLightState.color.copy(this.spotLight.color);
      this.animation.originalLightState.position.copy(this.spotLight.position);
      this.animation.originalLightState.angle = this.spotLight.angle;
      this.animation.originalLightState.penumbra = this.spotLight.penumbra;
      this.animation.originalLightState.map = this.spotLight.map;
    }
    if (this.floor && this.floor.material) {
      this.animation.originalFloorState.color.copy(this.floor.material.color);
      this.animation.originalFloorState.map = this.floor.material.map;
    }
  }

  /**
   * Initializes the Three.js spotlight and a floor mesh.
   */
  _initLights() {
    this.spotLight = new THREE.SpotLight(0xb6b7b8, this.params.intensity);
    this.spotLight.position.set(2.5, 5, 2.5);
    this.spotLight.angle = this.params.angle;
    this.spotLight.penumbra = this.params.penumbra;
    this.spotLight.decay = this.params.decay;
    this.spotLight.distance = this.params.distance;
    this.spotLight.castShadow = true;
    this.spotLight.shadow.mapSize.set(4096, 4096);
    this.spotLight.shadow.camera.near = 1;
    this.spotLight.shadow.camera.far = 100;
    this.spotLight.shadow.focus = this.params.focus;
    this.holderObjects.add(this.spotLight);

    this.lightHelper = new THREE.SpotLightHelper(this.spotLight);
    this.holderObjects.add(this.lightHelper);

    const floorSize = 20;
    const floorRes = 120;
    const floorGeo = new THREE.PlaneGeometry(floorSize, floorSize, floorRes, floorRes);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0xbcbcbc, side: THREE.DoubleSide });
    this.floor = new THREE.Mesh(floorGeo, floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.receiveShadow = true;
    this.floor.geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
    this.floor.geometry.computeVertexNormals();
    this.holderObjects.add(this.floor);

    // Store base vertex positions for floor animations (e.g., ripple effect)
    this.floor.userData.basePositions = Array.from(this.floor.geometry.attributes.position.array);
  }

  /**
   * Loads textures from the 'textures/' path.
   */
  _loadTextures() {
    const loader = new THREE.TextureLoader().setPath('textures/');
    const files = ['transition2.png', 'spotlight_7.jpg', 'colors.png', 'uv_grid_opengl.jpg'];
    files.forEach((fn) => {
      const tex = loader.load(fn);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      tex.colorSpace = THREE.SRGBColorSpace;
      this.textures[fn] = tex;
    });
  }

  /**
   * Loads and sets a texture as the spotlight's map.
   * @param {string} imageFile - The filename of the texture.
   */
  _loadAndSetSpotlightMap(imageFile) {
    this.params.map = this.textures[imageFile];
    this.spotLight.map = this.params.map;
    this.spotLight.needsUpdate = true;
  }

  /**
   * Changes the floor texture.
   * @param {string} textureName - The name of the texture to apply (key in `this.textures`).
   */
  changeFloorTexture(textureName) {
    // This function is now solely responsible for setting the texture.
    // It does not stop animations directly; the calling context (Renderer.jsx)
    // should handle animation stopping for effects that might conflict.
    if (this.textures[textureName]) {
      this.floor.material.map = this.textures[textureName];
      this.floor.material.needsUpdate = true;
    } else if (textureName === 'none') {
      this.floor.material.map = null;
      this.floor.material.needsUpdate = true;
    }
  }

  /**
   * Resets the floor texture to null (no texture) and its color to original.
   */
  resetFloorTexture() {
    this.floor.material.map = null;
    this.floor.material.needsUpdate = true;
    this.floor.material.color.copy(this.animation.originalFloorState.color); // Also reset color
  }

  /**
   * Stops any active light animations and resets relevant light properties to their original values.
   * Only kills the light-specific timeline, allowing other animations to continue.
   */
  stopLightAnimation() {
    if (this.animation.lightTimeline) {
      this.animation.lightTimeline.kill();
      this.animation.lightTimeline = null;
    }
    // Reset properties to their initial states
    if (this.spotLight) {
      this.spotLight.intensity = this.animation.originalLightState.intensity;
      this.spotLight.color.copy(this.animation.originalLightState.color);
      this.spotLight.position.copy(this.animation.originalLightState.position);
      this.spotLight.angle = this.animation.originalLightState.angle;
      this.spotLight.penumbra = this.animation.originalLightState.penumbra;
      this.spotLight.map = this.animation.originalLightState.map;
      this.spotLight.needsUpdate = true;
    }
  }

  /**
   * Stops any active floor animations and resets the floor properties.
   */
  stopFloorAnimation() {
    if (this.animation.floorTimeline) {
      this.animation.floorTimeline.kill();
      this.animation.floorTimeline = null;
    }
    // Cancel the default ripple animation if active
    if (this._currentFloorRippleAnimation) {
      cancelAnimationFrame(this._currentFloorRippleAnimation);
      this._currentFloorRippleAnimation = null;
    }
    // Reset floor positions to base
    if (this.floor && this.floor.geometry) {
      const pos = this.floor.geometry.attributes.position;
      const base = this.floor.userData.basePositions;
      for (let i = 0; i < pos.count; i++) {
        pos.array[i * 3 + 2] = base[i * 3 + 2]; // Reset Z position (assuming Z is vertical for plane)
      }
      pos.needsUpdate = true;
      this.floor.geometry.computeVertexNormals();
    }
    // Reset floor color (texture is handled by resetFloorTexture)
    if (this.floor && this.floor.material) {
      this.floor.material.color.copy(this.animation.originalFloorState.color);
      // Do not reset map here, let resetFloorTexture handle it if needed
    }
  }

  /* Light Animation Methods */
  /** Animates the spotlight intensity in a pulse effect. */
  animateLightPulse(duration = 1.0, maxIntensity = 1500, minIntensity = 500, ease = "power1.inOut", repeat = -1) {
    this.stopLightAnimation();
    this.animation.lightTimeline = gsap.timeline({ repeat: repeat, yoyo: true });
    this.animation.lightTimeline.to(this.spotLight, {
      intensity: maxIntensity,
      duration: duration / 2,
      ease: ease,
    });
    this.animation.lightTimeline.to(this.spotLight, {
      intensity: minIntensity,
      duration: duration / 2,
      ease: ease,
    });
  }

  /** Animates the spotlight color through a sequence of colors. */
  animateLightColorShift(colors = [0xff0000, 0x00ff00, 0x0000ff], duration = 3.0, ease = "linear", repeat = -1) {
    this.stopLightAnimation();
    const colorObjects = colors.map(c => ({ color: new THREE.Color(c) }));
    this.animation.lightTimeline = gsap.timeline({ repeat: repeat });
    for (let i = 0; i < colorObjects.length; i++) {
      const currentColor = { r: this.spotLight.color.r, g: this.spotLight.color.g, b: this.spotLight.color.b };
      this.animation.lightTimeline.to(currentColor, {
        r: colorObjects[i].color.r,
        g: colorObjects[i].color.g,
        b: colorObjects[i].color.b,
        duration: duration / colors.length,
        ease: ease,
        onUpdate: () => {
          this.spotLight.color.setRGB(currentColor.r, currentColor.g, currentColor.b);
        },
      });
    }
  }

  /** Animates the spotlight in a circular orbit. */
  animateLightOrbit(radius = 5, speed = 1, height = 5, duration = 10.0, ease = "none", repeat = -1) {
    this.stopLightAnimation();
    const orbitData = { angle: 0 };
    this.animation.lightTimeline = gsap.timeline({ repeat: repeat });
    this.animation.lightTimeline.to(orbitData, {
      angle: Math.PI * 2,
      duration: duration / speed,
      ease: ease,
      onUpdate: () => {
        this.spotLight.position.x = Math.cos(orbitData.angle) * radius;
        this.spotLight.position.z = Math.sin(orbitData.angle) * radius;
        this.spotLight.position.y = height;
      },
    });
  }

  /** Animates the spotlight intensity to create a strobe effect. */
  animateLightStrobe(strobeFrequency = 0.1, duration = 5.0, repeat = -1) {
    this.stopLightAnimation();
    this.animation.lightTimeline = gsap.timeline({ repeat: repeat });
    this.animation.lightTimeline.to(this.spotLight, {
      intensity: 0,
      duration: strobeFrequency / 2,
      ease: "steps(1)",
    });
    this.animation.lightTimeline.to(this.spotLight, {
      intensity: this.animation.originalLightState.intensity,
      duration: strobeFrequency / 2,
      ease: "steps(1)",
    });
  }

  /** Animates the spotlight's cone angle. */
  animateLightCone(minAngle = Math.PI / 8, maxAngle = Math.PI / 2, duration = 2.0, ease = "power1.inOut", repeat = -1) {
    this.stopLightAnimation();
    this.animation.lightTimeline = gsap.timeline({ repeat: repeat, yoyo: true });
    this.animation.lightTimeline.to(this.spotLight, {
      angle: maxAngle,
      duration: duration / 2,
      ease: ease,
    });
    this.animation.lightTimeline.to(this.spotLight, {
      angle: minAngle,
      duration: duration / 2,
      ease: ease,
    });
  }

  /** Animates the spotlight's penumbra. */
  animateLightPenumbra(minPenumbra = 0, maxPenumbra = 1, duration = 2.0, ease = "power1.inOut", repeat = -1) {
    this.stopLightAnimation();
    this.animation.lightTimeline = gsap.timeline({ repeat: repeat, yoyo: true });
    this.animation.lightTimeline.to(this.spotLight, {
      penumbra: maxPenumbra,
      duration: duration / 2,
      ease: ease,
    });
    this.animation.lightTimeline.to(this.spotLight, {
      penumbra: minPenumbra,
      duration: duration / 2,
      ease: ease,
    });
  }

  animateLightColorCycle(duration = 5.0, ease = "linear", repeat = -1) {
    this.stopLightAnimation();
    const hsl = { h: 0, s: 1, l: 0.5 }; // Start at red hue
    this.animation.lightTimeline = gsap.timeline({
      repeat: repeat, onUpdate: () => {
        this.spotLight.color.setHSL(hsl.h, hsl.s, hsl.l);
      }
    });
    this.animation.lightTimeline.to(hsl, {
      h: 1, // Cycle hue from 0 to 1
      duration: duration,
      ease: ease,
      modifiers: {
        h: (h) => parseFloat(h) % 1 // Ensure hue wraps around
      }
    });
  }

  animateLightSweep(duration = 3.0, sweepAngle = Math.PI / 2, ease = "power1.inOut", repeat = -1) {
    this.stopLightAnimation();
    // Use current position as start for the sweep calculation
    const startX = this.spotLight.position.x;
    const startZ = this.spotLight.position.z;
    const currentAngle = { value: Math.atan2(startZ, startX) }; // Angle from origin to current light position

    this.animation.lightTimeline = gsap.timeline({ repeat: repeat, yoyo: true });
    this.animation.lightTimeline.to(currentAngle, {
      value: currentAngle.value + sweepAngle,
      duration: duration / 2,
      ease: ease,
      onUpdate: () => {
        const radius = Math.sqrt(startX * startX + startZ * startZ); // Maintain current radius
        this.spotLight.position.x = Math.cos(currentAngle.value) * radius;
        this.spotLight.position.z = Math.sin(currentAngle.value) * radius;
        this.spotLight.target.position.set(0, 0, 0); // Keep target fixed (e.g., at origin)
      },
    });
  }

  animateLightHeightBounce(duration = 1.5, minHeight = 2, maxHeight = 6, ease = "power2.inOut", repeat = -1) {
    this.stopLightAnimation();
    this.animation.lightTimeline = gsap.timeline({ repeat: repeat, yoyo: true });
    this.animation.lightTimeline.to(this.spotLight.position, {
      y: maxHeight,
      duration: duration / 2,
      ease: ease,
    });
    this.animation.lightTimeline.to(this.spotLight.position, {
      y: minHeight,
      duration: duration / 2,
      ease: ease,
    });
  }

  /**
   * Triggers rhythmic light and floor animation on BPM beat.
   * Enhances reactivity based on audio frequency data.
   * @param {object} frequencyData - Object containing low, mid, high frequency averages (0-1).
   */
  onBPMBeat(frequencyData = { low: 0, mid: 0, high: 0 }) {
    // This function provides general beat-driven visual feedback,
    // and is not overridden by specific wordSettings.lightEffect or floorEffect 'none'.
    // If a specific effect is active from wordSettings, it takes precedence and this
    // default beat reaction will not interfere with it.

    // If no specific light effect is active from wordSettings, apply default beat flash
    if (!this.animation.lightTimeline) { // Only apply if no explicit light animation is running
      gsap.to(this.spotLight, {
        intensity: this.animation.originalLightState.intensity * (1.5 + frequencyData.high * 0.5), // Brighter with high frequencies
        duration: 0.1,
        yoyo: true,
        repeat: 1, // Flash once
        ease: "power1.out",
        onComplete: () => {
          this.spotLight.intensity = this.animation.originalLightState.intensity; // Ensure it resets
        }
      });
      // Color shift influenced by mid frequencies, more subtle
      const beatColor = new THREE.Color();
      beatColor.setRGB(0.5 + frequencyData.mid * 0.5,  // More red/yellow with mid frequencies
        0.5 + frequencyData.low * 0.3,  // More green with low frequencies
        0.5 + frequencyData.high * 0.2  // More blue with high frequencies
      );
      gsap.to(this.spotLight.color, {
        r: beatColor.r,
        g: beatColor.g,
        b: beatColor.b,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: "power1.out",
        onComplete: () => {
          this.spotLight.color.copy(this.animation.originalLightState.color); // Reset color
        }
      });
    }
  }

  // New property to store the current floor ripple animation frame ID
  _currentFloorRippleAnimation = null;

  animateFloorRipple(frequencyData = { low: 0, mid: 0, high: 0 }) {
    if (!this.floor) return;
    // Only apply if no explicit floor effect is running
    if (this.animation.floorTimeline) return;

    const geom = this.floor.geometry;
    const pos = geom.attributes.position;
    const base = this.floor.userData.basePositions;
    const now = performance.now() / 1000;

    // Make ripple frequency and amplitude dynamic based on frequency data
    const freq = 4 + (frequencyData.mid * 5); // Mid frequencies can influence ripple speed
    const amp = 0.18 + (frequencyData.low * 0.5) + (frequencyData.high * 0.2); // Low for intensity, high for sharpness
    let t = 0;
    const duration = 0.45; // Duration of the ripple animation

    // To prevent overlapping ripple animations, ensure only one is active
    if (this._currentFloorRippleAnimation) {
      cancelAnimationFrame(this._currentFloorRippleAnimation);
    }

    const animateRipples = () => {
      t += 1 / 60; // Assume 60fps for consistent time step
      for (let i = 0; i < pos.count; i++) {
        const ix = i * 3;
        const px = pos.array[ix + 0];
        const py = pos.array[ix + 1]; // Assuming Y is the depth for floor, Z for vertical in Three.js plane
        const d = Math.sqrt(px * px + py * py) / (20 * 0.48); // floorSize is 20
        const attenuation = 1 - Math.min(d, 1);
        const pulse = Math.exp(-t * 6) * amp * attenuation * Math.sin(Math.PI * 2 * (1.5 - t * 1.1));
        const fine = Math.sin((now + t) * freq + d * 19) * 0.025 * attenuation * Math.exp(-t * 2.2);
        pos.array[ix + 2] = base[ix + 2] + pulse + fine; // Modify Z-coordinate for ripple
      }
      pos.needsUpdate = true;
      geom.computeVertexNormals();

      if (t < duration) {
        this._currentFloorRippleAnimation = requestAnimationFrame(animateRipples);
      } else {
        // Reset floor positions to base after animation
        for (let i = 0; i < pos.count; i++) {
          pos.array[i * 3 + 2] = base[i * 3 + 2];
        }
        pos.needsUpdate = true;
        geom.computeVertexNormals();
        this._currentFloorRippleAnimation = null;
      }
    };
    this._currentFloorRippleAnimation = requestAnimationFrame(animateRipples);
  }

  animateFloorDisplace(duration = 2.0, maxDisplacement = 1.0, ease = "power2.inOut", repeat = -1) {
    this.stopFloorAnimation();
    if (!this.floor) return;
    this.animation.floorTimeline = gsap.timeline({
      repeat: repeat, yoyo: true, onUpdate: () => {
        const geom = this.floor.geometry;
        const pos = geom.attributes.position;
        const base = this.floor.userData.basePositions;
        const progress = this.animation.floorTimeline.progress(); // Get current progress of the tween
        for (let i = 0; i < pos.count; i++) {
          const ix = i * 3;
          // Apply displacement to the Z-axis for a plane that lies on X-Y
          pos.array[ix + 2] = base[ix + 2] + ((Math.random() - 0.5) * 2 * maxDisplacement) * gsap.parseEase(ease)(progress);
        }
        pos.needsUpdate = true;
        geom.computeVertexNormals();
      }
    });
    this.animation.floorTimeline.to({}, { duration: duration }); // Dummy tween to control overall duration
  }

  animateFloorColorCycle(colors = [0xff0000, 0x00ff00, 0x0000ff], duration = 5.0, ease = "linear", repeat = -1) {
    this.stopFloorAnimation();
    if (!this.floor || !this.floor.material.color) return;
    const colorObjects = colors.map(c => ({ color: new THREE.Color(c) }));
    this.animation.floorTimeline = gsap.timeline({ repeat: repeat });
    for (let i = 0; i < colorObjects.length; i++) {
      // GSAP directly animates THREE.Color objects
      this.animation.floorTimeline.to(this.floor.material.color, {
        r: colorObjects[i].color.r,
        g: colorObjects[i].color.g,
        b: colorObjects[i].color.b,
        duration: duration / colors.length,
        ease: ease,
        onUpdate: () => {
          this.floor.material.color.setRGB(colorObjects[i].color.r, colorObjects[i].color.g, colorObjects[i].color.b);
        },
      });
    }
  }

  animateFloorWave(duration = 3.0, amplitude = 0.5, frequency = 2, ease = "sine.inOut", repeat = -1) {
    this.stopFloorAnimation(); // Assuming a new stopFloorAnimation method
    if (!this.floor) return;
    const clock = new THREE.Clock(); // Use a clock for time
    this.animation.floorTimeline = gsap.timeline({
      repeat: repeat, onUpdate: () => {
        const geom = this.floor.geometry;
        const pos = geom.attributes.position;
        const base = this.floor.userData.basePositions;
        const elapsedTime = clock.getElapsedTime();
        for (let i = 0; i < pos.count; i++) {
          const ix = i * 3;
          const x = base[ix + 0]; // X coordinate
          const y = base[ix + 1]; // Y coordinate (plane's 'depth')
          // Assuming Z is the vertical displacement axis for the floor
          pos.array[ix + 2] = base[ix + 2] + Math.sin(x * frequency + elapsedTime * 5) * Math.cos(y * frequency + elapsedTime * 4) * amplitude;
        }
        pos.needsUpdate = true;
        geom.computeVertexNormals();
      }
    });
    this.animation.floorTimeline.to({}, { duration: duration, ease: ease }); // Dummy tween to control duration
  }

  /** Updates the light helper. This should be called in the main render loop. */
  update() {
    this.lightHelper?.update();
    // GSAP handles the updates for light and floor timelines, so no manual update needed here
    // unless there are non-GSAP animations still running (e.g., the default ripple in onBPMBeat)
  }

  /**
   * Disposes of all Three.js objects and GSAP timelines managed by this class.
   */
  dispose() {
    this.stopLightAnimation(); // Kill any active light animations
    this.stopFloorAnimation(); // Kill any active floor animations
    if (this._currentFloorRippleAnimation) {
      cancelAnimationFrame(this._currentFloorRippleAnimation);
      this._currentFloorRippleAnimation = null;
    }

    // Dispose Three.js objects
    if (this.lightHelper) {
      this.lightHelper.dispose();
      this.lightHelper = null;
    }
    if (this.spotLight) {
      if (this.holderObjects) this.holderObjects.remove(this.spotLight);
      this.spotLight.dispose();
      this.spotLight = null;
    }
    if (this.floor) {
      if (this.holderObjects) this.holderObjects.remove(this.floor);
      if (this.floor.geometry) this.floor.geometry.dispose();
      if (this.floor.material) {
        if (Array.isArray(this.floor.material)) {
          this.floor.material.forEach(m => m.dispose());
        } else {
          m.dispose();
        }
      }
      this.floor = null;
    }
    if (this.holderObjects) {
      if (Renderer.holder) Renderer.holder.remove(this.holderObjects); // Remove local holder from global holder
      this.holderObjects.clear();
      this.holderObjects = null;
    }

    // Dispose textures
    for (const key in this.textures) {
      if (this.textures[key] instanceof THREE.Texture) {
        this.textures[key].dispose();
      }
    }
    this.textures = { none: null };
  }
}