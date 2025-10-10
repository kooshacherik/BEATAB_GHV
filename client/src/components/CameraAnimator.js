// client/src/components/CameraAnimator.js
import * as THREE from 'three'; 
import { Easing } from '../utils/EasingFunctions'; // Import Easing functions 
import gsap from 'gsap'; // Import GSAP for more flexible animation control
/** 
 * Manages camera animations and control in a Three.js scene. 
 * Supports "move to", "path following", and "shake" animations. 
 */ 
export default class CameraAnimator { 
  camera; 
  controls; // OrbitControls or similar 
  // Current animation state and original values for resetting specific effects 
  animation = { 
    active: false, 
    type: null, // 'to', 'path', 'shake', 'dolly', 'focusShift', 'spiral' 
    timeline: null, // GSAP Timeline for current animation 
    onCompleteCallback: null,
    // Store original states for shake for proper reset 
    originalShakePosition: new THREE.Vector3(), 
    originalShakeLookAt: new THREE.Vector3(),
    // Parameters for specific animation types (no need to store start/target positions globally anymore 
    // as GSAP handles these implicitly or they are passed per-animation call) 
    spiralParams: null, // For spiral animation 
    path: null, // THREE.CatmullRomCurve3 for path animation 
    pathLoop: false, 
  };
  /** 
   * @param {THREE.PerspectiveCamera} camera - The camera to animate. 
   * @param {OrbitControls} controls - The OrbitControls (or similar) instance for the camera. 
   */ 
  constructor(camera, controls) { 
    if (!camera || !controls) { 
      console.error("CameraAnimator: Camera and controls must be provided."); 
      return; 
    } 
    this.camera = camera; 
    this.controls = controls; 
    this.initialCameraPosition = this.camera.position.clone();
    this.initialControlsTarget = this.controls.target.clone();
  }
  /** 
   * Stops any active camera animation gracefully. 
   * If a GSAP timeline is active, it kills it. Otherwise, it just resets the internal state. 
   */ 
  stopAnimation() { 
    if (this.animation.timeline) { 
      this.animation.timeline.kill(); 
      this.animation.timeline = null; 
    } 
    this.animation.active = false; 
    this.animation.onCompleteCallback = null; 
    this.animation.type = null; 
    this.animation.spiralParams = null; // Clear specific params
    // Re-enable controls if they were disabled for animation 
    if (this.controls) { 
      this.controls.enabled = true; 
    } 
  }
  /** 
   * Animates the camera to a new position and look-at target. 
   * Uses GSAP for smooth transitions, starting from the camera's current state. 
   */ 
  animateCameraTo(targetPosition, targetLookAt, duration = 2000, easing = Easing.Quadratic.Out, onComplete = null) { 
    this.stopAnimation(); // Stop any current animation
    if (!targetPosition || !targetLookAt) { 
      console.error("animateCameraTo: targetPosition and targetLookAt are required."); 
      return; 
    }
    this.animation.active = true;
    this.animation.type = 'to';
    this.animation.onCompleteCallback = onComplete;
    if (this.controls) { 
      this.controls.enabled = false; // Disable controls during animation 
    }
    this.animation.timeline = gsap.timeline({ 
      onUpdate: () => this.controls.update(), // Ensure controls are updated 
      onComplete: () => { 
        this.animation.active = false; 
        if (this.controls) this.controls.enabled = true; 
        if (this.animation.onCompleteCallback) this.animation.onCompleteCallback(); 
      } 
    });
    this.animation.timeline.to(this.camera.position, { 
      x: targetPosition.x, 
      y: targetPosition.y, 
      z: targetPosition.z, 
      duration: duration / 1000, // GSAP duration in seconds 
      ease: this._gsapEase(easing), 
    }, 0); // Start at the same time
    this.animation.timeline.to(this.controls.target, {
      x: targetLookAt.x,
      y: targetLookAt.y,
      z: targetLookAt.z,
      duration: duration / 1000,
      ease: this._gsapEase(easing),
    }, 0);
  }
  /** 
   * Animates the camera along a predefined path. 
   * Uses GSAP's `motionPath` plugin or a custom onUpdate for smoother path following. 
   */ 
  animateCameraPath(pathPoints, duration = 5000, easing = Easing.Linear.None, loop = false, onComplete = null) { 
    this.stopAnimation();
    if (!Array.isArray(pathPoints) || pathPoints.length < 2) { 
      console.warn('Camera path requires at least two points.'); 
      return; 
    }
    this.animation.active = true;
    this.animation.type = 'path';
    this.animation.path = new THREE.CatmullRomCurve3(pathPoints);
    this.animation.pathLoop = loop;
    this.animation.onCompleteCallback = onComplete;
    if (this.controls) {
      this.controls.enabled = false;
    }
    const pathData = { progress: 0 }; 
    this.animation.timeline = gsap.timeline({ 
      onUpdate: () => { 
        const point = this.animation.path.getPointAt(pathData.progress); 
        this.camera.position.copy(point); // Assuming a fixed look-at target for path animations, or calculate dynamic look-at 
        // For simplicity, we'll keep the current controls target. 
        // If a dynamic look-at along the path is desired, it needs more complex calculation. 
        // this.controls.target.copy(someCalculatedLookAtPoint); 
        this.controls.update(); 
      }, 
      onComplete: () => { 
        if (this.animation.pathLoop) { 
          // Restart timeline for looping 
          this.animation.timeline.restart(); 
        } else { 
          this.animation.active = false; 
          if (this.controls) this.controls.enabled = true; 
          if (this.animation.onCompleteCallback) this.animation.onCompleteCallback(); 
        } 
      }, 
      repeat: loop ? -1 : 0, // -1 for infinite repeat 
      ease: this._gsapEase(easing), 
    });
    this.animation.timeline.to(pathData, {
      progress: 1,
      duration: duration / 1000,
    });
  }
  /** 
   * Applies a temporary shake effect to the camera. 
   */ 
  shakeCamera(duration = 500, intensity = 0.1, onComplete = null) { 
    this.stopAnimation();
    this.animation.active = true;
    this.animation.type = 'shake';
    this.animation.onCompleteCallback = onComplete;
    this.animation.originalShakePosition.copy(this.camera.position);
    this.animation.originalShakeLookAt.copy(this.controls.target);
    if (this.controls) {
      this.controls.enabled = false;
    }
    this.animation.timeline = gsap.timeline({ 
      onUpdate: () => { 
        const shakeX = (Math.random() - 0.5) * 2 * intensity; 
        const shakeY = (Math.random() - 0.5) * 2 * intensity; 
        const shakeZ = (Math.random() - 0.5) * 2 * intensity; 
        this.camera.position.set( 
          this.animation.originalShakePosition.x + shakeX, 
          this.animation.originalShakePosition.y + shakeY, 
          this.animation.originalShakePosition.z + shakeZ 
        ); 
        this.controls.update(); 
      }, 
      onComplete: () => { 
        this.camera.position.copy(this.animation.originalShakePosition); // Reset position 
        this.controls.target.copy(this.animation.originalShakeLookAt); // Reset look-at 
        this.controls.update(); 
        this.animation.active = false; 
        if (this.controls) this.controls.enabled = true; 
        if (this.animation.onCompleteCallback) this.animation.onCompleteCallback(); 
      } 
    });
    this.animation.timeline.to({}, { 
      duration: duration / 1000, 
      ease: "power1.out", // Decay shake over time implicitly by duration 
      onRepeat: () => { 
        // Optionally decay intensity on repeat if repeat > 0 
        intensity *= 0.8; // Example decay 
      } 
    }); 
  }
  animateCameraDolly(duration = 2000, distance = 5, easing = Easing.Quadratic.Out, onComplete = null) { 
    this.stopAnimation();
    const currentDirection = new THREE.Vector3(); 
    this.camera.getWorldDirection(currentDirection); 
    const targetPosition = new THREE.Vector3().copy(this.camera.position).add(currentDirection.multiplyScalar(distance));
    this.animation.active = true;
    this.animation.type = 'dolly';
    this.animation.onCompleteCallback = onComplete;
    if (this.controls) {
      this.controls.enabled = false;
    }
    this.animation.timeline = gsap.timeline({ 
      onUpdate: () => this.controls.update(), 
      onComplete: () => { 
        this.animation.active = false; 
        if (this.controls) this.controls.enabled = true; 
        if (this.animation.onCompleteCallback) this.animation.onCompleteCallback(); 
      } 
    });
    this.animation.timeline.to(this.camera.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration: duration / 1000,
      ease: this._gsapEase(easing),
    }, 0);
  }
  animateCameraFocusShift(targetFocusPoint, duration = 1500, easing = Easing.Quadratic.Out, onComplete = null) { 
    this.stopAnimation();
    if (!targetFocusPoint) {
      console.error("animateCameraFocusShift: targetFocusPoint is required.");
      return;
    }
    this.animation.active = true;
    this.animation.type = 'focusShift';
    this.animation.onCompleteCallback = onComplete;
    if (this.controls) {
      this.controls.enabled = false;
    }
    this.animation.timeline = gsap.timeline({ 
      onUpdate: () => this.controls.update(), 
      onComplete: () => { 
        this.animation.active = false; 
        if (this.controls) this.controls.enabled = true; 
        if (this.animation.onCompleteCallback) this.animation.onCompleteCallback(); 
      } 
    });
    this.animation.timeline.to(this.controls.target, {
      x: targetFocusPoint.x,
      y: targetFocusPoint.y,
      z: targetFocusPoint.z,
      duration: duration / 1000,
      ease: this._gsapEase(easing),
    }, 0);
  }
  animateCameraSpiral(duration = 3000, revolutions = 1, heightChange = 2, radius = 5, easing = Easing.Cubic.InOut, onComplete = null) { 
    this.stopAnimation();
    const startY = this.camera.position.y; 
    const startAngle = Math.atan2(this.camera.position.z, this.camera.position.x); // Current angle in XZ plane 
    const initialLookAt = this.controls.target.clone(); // Store initial look-at
    this.animation.active = true;
    this.animation.type = 'spiral';
    this.animation.onCompleteCallback = onComplete;
    if (this.controls) {
      this.controls.enabled = false;
    }
    const spiralData = { progress: 0 }; 
    this.animation.timeline = gsap.timeline({ 
      onUpdate: () => { 
        const p = spiralData.progress; 
        const angle = startAngle + (revolutions * Math.PI * 2 * p); 
        const currentRadius = radius * (1 - p); // Spiral inwards 
        const currentHeight = startY + (heightChange * p);
        this.camera.position.set( 
          Math.cos(angle) * currentRadius, 
          currentHeight, 
          Math.sin(angle) * currentRadius 
        ); 
        this.controls.target.copy(initialLookAt); // Maintain lookAt during spiral for now 
        this.controls.update(); 
      }, 
      onComplete: () => { 
        this.animation.active = false; 
        if (this.controls) this.controls.enabled = true; 
        if (this.animation.onCompleteCallback) this.animation.onCompleteCallback(); 
      } 
    });
    this.animation.timeline.to(spiralData, {
      progress: 1,
      duration: duration / 1000,
      ease: this._gsapEase(easing),
    });
  }
  /** 
   * Translates custom easing functions to GSAP's string format or returns a function. 
   * @param {Function} easingFunction - The custom easing function. 
   * @returns {string|Function} GSAP easing string or the function itself. 
   */ 
  _gsapEase(easingFunction) { 
    if (easingFunction === Easing.Linear.None) return "none"; 
    if (easingFunction === Easing.Quadratic.In) return "power1.in"; 
    if (easingFunction === Easing.Quadratic.Out) return "power1.out"; 
    if (easingFunction === Easing.Quadratic.InOut) return "power1.inOut"; 
    if (easingFunction === Easing.Cubic.In) return "power2.in"; 
    if (easingFunction === Easing.Cubic.Out) return "power2.out"; 
    if (easingFunction === Easing.Cubic.InOut) return "power2.inOut"; 
    // For other custom easing functions, GSAP can accept them directly or you can map them. 
    return easingFunction; // Fallback to passing the function directly 
  }
  
  // New method to restore the camera to its initial position and target
  resetToInitialPosition() {
    this.stopAnimation(); // Stop any active animation
    this.camera.position.copy(this.initialCameraPosition);
    this.controls.target.copy(this.initialControlsTarget);
    this.controls.update();
  }

  // New method to save the current camera state
  saveCameraState() {
    this._savedCameraPosition = this.camera.position.clone();
    this._savedControlsTarget = this.controls.target.clone();
  }

  // New method to restore the saved camera state
  restoreCameraState(withAnimation = true) {
    if (this._savedCameraPosition && this._savedControlsTarget) {
      if (withAnimation) {
        this.animateCameraTo(this._savedCameraPosition, this._savedControlsTarget, 1000, Easing.Cubic.Out);
      } else {
        this.stopAnimation();
        this.camera.position.copy(this._savedCameraPosition);
        this.controls.target.copy(this._savedControlsTarget);
        this.controls.update();
      }
    } else {
      console.warn("No camera state saved to restore.");
      this.resetToInitialPosition(); // Fallback to initial position
    }
  }

  /** 
   * Update is no longer needed in the render loop if all animations are handled by GSAP timelines. 
   * GSAP automatically updates its tweens. The only thing to do is update controls. 
   */ 
  update() { 
    // If GSAP is managing camera position and target, its onUpdate takes care of controls.update() 
    // For effects like shake that might bypass GSAP, manual controls.update() is still needed 
    if (!this.animation.active && this.controls) { 
      this.controls.update(); // Only update controls if no animation is active (user interaction) 
    } 
  } 
}