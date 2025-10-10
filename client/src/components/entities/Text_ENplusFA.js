// client/src/components/entities/Text_ENplusFA.js
import * as THREE from 'three'; 
import { FontLoader } from 'three/addons/loaders/FontLoader.js'; 
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'; 
import Renderer from '../Renderer'; // Import Renderer to access global state/instance 
import { fetchRandomWord } from '../../utils/WordGenerator'; // Renamed and moved WordGen logic 
import gsap from 'gsap'; // Assuming GSAP is used for animations

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// -------- Persian shaping utility (kept / slightly tightened) ---------- 
const PersianTools = { 
  isPersian: (str) => /[؀-ۿ]/.test(str), 
  nonConnectingChars: ['ا', 'آ', 'د', 'ذ', 'ر', 'ز', 'ژ', 'و'], 
  charMap: { 
    'ا': { isolated: 'ﺍ', final: 'ﺎ' }, 
    'آ': { isolated: 'ﺁ', final: 'ﺂ' }, 
    'ب': { isolated: 'ﺏ', final: 'ﺐ', medial: 'ﺒ', initial: 'ﺑ' }, 
    'پ': { isolated: 'ﭖ', final: 'ﭗ', medial: 'ﭙ', initial: 'ﭘ' }, 
    'ت': { isolated: 'ﺕ', final: 'ﺖ', medial: 'ﺘ', initial: 'ﺗ' }, 
    'ث': { isolated: 'ﺙ', final: 'ﺚ', medial: 'ﺜ', initial: 'ﺛ' }, 
    'ج': { isolated: 'ﺝ', final: 'ﺞ', medial: 'ﺠ', initial: 'ﺟ' }, 
    'چ': { isolated: 'ﭺ', final: 'ﭻ', medial: 'ﭽ', initial: 'ﭼ' }, 
    'ح': { isolated: 'ﺡ', final: 'ﺢ', medial: 'ﺤ', initial: 'ﺣ' }, 
    'خ': { isolated: 'ﺥ', final: 'ﺦ', medial: 'ﺨ', initial: 'ﺧ' }, 
    'د': { isolated: 'ﺩ', final: 'ﺪ' }, 
    'ذ': { isolated: 'ﺫ', final: 'ﺬ' }, 
    'ر': { isolated: 'ﺭ', final: 'ﺮ' }, 
    'ز': { isolated: 'ﺯ', final: 'ﺰ' }, 
    'ژ': { isolated: 'ﮊ', final: 'ﮋ' }, 
    'س': { isolated: 'ﺱ', final: 'ﺲ', medial: 'ﺴ', initial: 'ﺳ' }, 
    'ش': { isolated: 'ﺵ', final: 'ﺶ', medial: 'ﺸ', initial: 'ﺷ' }, 
    'ص': { isolated: 'ﺹ', final: 'ﺺ', medial: 'ﺼ', initial: 'ﺻ' }, 
    'ض': { isolated: 'ﺽ', final: 'ﺾ', medial: 'ﻀ', initial: 'ﺿ' }, 
    'ط': { isolated: 'ﻁ', final: 'ﻂ', medial: 'ﻄ', initial: 'ﻃ' }, 
    'ظ': { isolated: 'ﻅ', final: 'ﻆ', medial: 'ﻈ', initial: 'ﻇ' }, 
    'ع': { isolated: 'ﻉ', final: 'ﻊ', medial: 'ﻌ', initial: 'ﻋ' }, 
    'غ': { isolated: 'ﻍ', final: 'ﻎ', medial: 'ﻐ', initial: 'ﻏ' }, 
    'ف': { isolated: 'ﻑ', final: 'ﻒ', medial: 'ﻔ', initial: 'ﻓ' }, 
    'ق': { isolated: 'ﻕ', final: 'ﻖ', medial: 'ﻘ', initial: 'ﻗ' }, 
    'ک': { isolated: 'ﻙ', final: 'ﻚ', medial: 'ﻜ', initial: 'ﻛ' }, 
    'گ': { isolated: 'ﮒ', final: 'ﮓ', medial: 'ﮕ', initial: 'ﮔ' }, 
    'ل': { isolated: 'ﻝ', final: 'ﻞ', medial: 'ﻠ', initial: 'ﻟ' }, 
    'م': { isolated: 'ﻡ', final: 'ﻢ', medial: 'ﻤ', initial: 'ﻣ' }, 
    'ن': { isolated: 'ﻥ', final: 'ﻦ', medial: 'ﻨ', initial: 'ﻧ' }, 
    'ه': { isolated: 'ﻩ', final: 'ﻪ', medial: 'ﻬ', initial: 'ﻫ' }, 
    'و': { isolated: 'ﻭ', final: 'ﻮ' }, 
    'ی': { isolated: 'ﻱ', final: 'ﻲ', medial: 'ﻴ', initial: 'ﻳ' }, 
    ' ': { isolated: ' ' } 
  }, 
  shape(text) { 
    if (!text) return ''; 
    const cm = this.charMap; 
    const nonConn = this.nonConnectingChars; 
    const shaped = []; 
    for (let i = 0; i < text.length; i++) { 
      const ch = text[i]; 
      const map = cm[ch]; 
      if (!map) { 
        shaped.push(ch); 
        continue; 
      } 
      const prev = i > 0 ? text[i - 1] : null; 
      const next = i < text.length - 1 ? text[i + 1] : null;

      const connFromPrev = prev && cm[prev] && !nonConn.includes(prev); 
      const connToNext = next && cm[next] && !!map.initial && !nonConn.includes(ch);

      if (ch === 'ل' && next && (next === 'ا' || next === 'آ')) { 
        const lamAlef = (next === 'ا') ? (connFromPrev ? 'ﻼ' : 'ﻻ') : (connFromPrev ? 'ﻸ' : 'ﻷ'); 
        shaped.push(lamAlef); 
        i++; 
        continue; 
      } 
      const form = (connFromPrev && connToNext) ? 'medial' : (!connFromPrev && connToNext) ? 'initial' : (connFromPrev && !connToNext) ? 'final' : 'isolated'; 
      shaped.push(map[form] || map['isolated'] || ch); 
    } 
    return shaped.join(''); 
  }, 
  processText(text) { 
    if (!this.isPersian(text)) return text; // Reverse only if it's Persian, and reverse the shaped text. 
    // TextGeometry will then render it left-to-right from the reversed sequence. 
    return this.shape(text).split('').reverse().join(''); 
  } 
};
// ---------- Main class ---------- 
/** 
 * A comprehensive JavaScript class for creating, animating, and managing 3D text objects 
 * with special effects using Three.js and GSAP. 
 */ 
export default class Text3DSpin extends THREE.Object3D { 
  static word_change_counter = 0; // Static counter for word changes 
  group = null; // THREE.Group to hold text meshes 
  textMesh1 = null; // Main 3D text mesh 
  textMesh2 = null; // Mirrored 3D text mesh 
  materials = null; // Array of base MeshStandardMaterial for text 
  holderObjects = null; // Local holder for objects managed by this class 
  Lang = 'EN'; // Current language ('EN' or 'FA') 
  text = 'Koosha'; // Current displayed text 
  bevelEnabled = false; 
  font = undefined; // Loaded Three.js font 
  fontName = 'Noto Sans Arabic'; // Name of the font to load 
  size = 0.42; // Font size 
  depth = 0.2; // Text depth 
  hover = 0.5; // Y-offset for text position (y is the height to the floor) 
  curveSegments = 4; 
  bevelThickness = 0.03; 
  bevelSize = 0.02; 
  mirror = false; // Whether to create a mirrored text mesh 
  targetRotation = 0; // Target rotation for the text group 
  windowHalfX = window.innerWidth / 2; // Half window width for mouse interaction (currently unused) 
  fontIndex = 1; // Font index (currently unused) 
  firstLetter = true; // Flag for first letter input handling 
  beatcount = 0; // Counter for beats 
  beatlimit = 4; // Number of beats before word change in automatic mode 
  currentTextEffect = 'punched'; // Current active text animation effect
  // Temporary Vector3 instances to avoid repeated allocations in calculations 
  _tmpV1 = new THREE.Vector3(); 
  _tmpV2 = new THREE.Vector3(); 
  _tmpV3 = new THREE.Vector3(); 
  _circleTex = null; // Cached circle sprite texture for blood effects
  // GSAP timelines for each specific animation to allow independent control 
  _currentTextAnimationTimeline = null; // A reference to the current animation's update function (for cleanup of non-GSAP animations) 
  _currentAnimationUpdateFn = null;

  // Track current effect indices for cycling
  _automaticEffectIndex = 0;
  _manualSpaceEffectIndex = 0;

  constructor(options = {}) {
    super(options);
    Text3DSpin.word_change_counter = 0;
    // Bind event handlers
    this.onDocumentKeyPress = this.onDocumentKeyPress.bind(this);
    this.onDocumentKeyDown = this.onDocumentKeyDown.bind(this);
  }

  /**
   * Initializes the Text3DSpin instance, adding it to the Renderer's global holder,
   * setting up materials, creating a group, loading the font, and adding event listeners.
   */
  init() {
    if (Renderer.holder) {
      Renderer.holder.add(this); // Add to the global holder
    } else {
      console.warn("Renderer.holder is not initialized. Text3DSpin will not be added to the scene.");
    }
    this.holderObjects = new THREE.Object3D();
    this.add(this.holderObjects); // Add a local holder for easier management

    // Define base materials. These will be cloned for each text mesh.
    this.materials = [
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.15, transparent: true, opacity: 1, emissive: 0x000000, side: THREE.DoubleSide }),
      new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.5, metalness: 0.05, transparent: true, opacity: 1, side: THREE.DoubleSide })
    ];

    this.group = new THREE.Group();
    this.group.position.set(0, 0, 0);
    this.group.scale.set(1, 1, .0025); // Initial scale, assuming no entrance animation here
    this.holderObjects.add(this.group);

    this.loadFont();

    document.addEventListener('keypress', this.onDocumentKeyPress);
    document.addEventListener('keydown', this.onDocumentKeyDown);
  }

  /**
   * Disposes of all Three.js geometries, materials, and removes event listeners.
   * Cleans up GSAP animations.
   */
  dispose() {
    this._cleanUpCurrentTextAnimation(); // Ensure all animations are stopped
    this._disposeMesh(this.textMesh1);
    this._disposeMesh(this.textMesh2);
    this.textMesh1 = null;
    this.textMesh2 = null;

    document.removeEventListener('keypress', this.onDocumentKeyPress);
    document.removeEventListener('keydown', this.onDocumentKeyDown);

    if (this.group) {
      this.holderObjects.remove(this.group);
      this.group = null;
    }
    if (this._circleTex) {
      this._circleTex.dispose();
      this._circleTex = null;
    }
    // No need to kill tweens on materials explicitly if they are disposed with meshes.
  }

  /**
   * Helper function to safely dispose of a mesh and its resources.
   * @param {THREE.Mesh} mesh - The mesh to dispose.
   */
  _disposeMesh(mesh) {
    if (mesh) {
      if (mesh.parent) {
        mesh.parent.remove(mesh);
      }
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        const materialsArray = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materialsArray.forEach(m => {
          for (const key in m) {
            if (m[key] instanceof THREE.Texture) {
              m[key].dispose();
            }
          }
          m.dispose();
        });
      }
    }
  }

  /**
   * Loads the specified font using FontLoader.
   * On successful load, it calls `refreshText` to render the initial text.
   */
  loadFont() {
    const loader = new FontLoader();
    loader.load(
      'fonts/Noto Sans Arabic_Regular.json', // Ensure this path is correct relative to public/
      (response) => {
        this.font = response;
        this.refreshText();
      },
      undefined,
      (err) => {
        console.error('Font load error:', err);
      }
    );
  }

  /**
   * Sets the text content for the 3D text.
   * @param {string} newText - The new text string.
   */
  setText(newText) {
    if (typeof newText !== 'string' || newText === this.text) return;
    this.firstLetter = true;
    this.text = newText;
  }

  /**
   * Creates a new THREE.Mesh for the given text string.
   * Applies Persian shaping if the language is 'FA'.
   *
   * @param {string} text - The text string to render.
   * @returns {THREE.Mesh|null} The created 3D text mesh, or null if font is not loaded.
   */
  createTextMeshFromString(text) {
    if (!this.font) return null;
    const shaped = this.Lang === 'FA' ? PersianTools.processText(text) : text;
    if (!shaped) return null;

    const geo = new TextGeometry(shaped, {
      font: this.font,
      size: this.size,
      height: this.depth,
      curveSegments: this.curveSegments,
      bevelEnabled: this.bevelEnabled,
      bevelThickness: this.bevelThickness,
      bevelSize: this.bevelSize
    });
    geo.computeBoundingBox();
    const bbox = geo.boundingBox;
    const centerOffset = -0.5 * (bbox.max.x - bbox.min.x);

    const clonedMaterials = this.materials.map(m => m.clone());
    const mesh = new THREE.Mesh(geo, clonedMaterials);
    mesh.position.set(centerOffset, this.hover, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = `textMesh-${text}`;
    return mesh;
  }

  /**
   * Creates the 3D text meshes (main and mirrored) and adds them to the group.
   * This method ensures old meshes are disposed before creating new ones.
   */
  createAndAddTextMeshes() {
    if (!this.font || !this.text) {
      return;
    }
    this._disposeMesh(this.textMesh1);
    this._disposeMesh(this.textMesh2);

    this.textMesh1 = this.createTextMeshFromString(this.text);
    if (!this.textMesh1) return;
    this.group.add(this.textMesh1);

    if (this.mirror) {
      const geo2 = this.textMesh1.geometry.clone();
      const mats2 = this._getMaterials(this.textMesh1).map(m => m.clone());
      this.textMesh2 = new THREE.Mesh(geo2, mats2);
      this.textMesh2.position.copy(this.textMesh1.position);
      this.textMesh2.position.y = -this.hover;
      this.textMesh2.rotation.set(Math.PI, 0, 0);
      this.textMesh2.castShadow = false;
      this.textMesh2.receiveShadow = true;
      this.textMesh2.name = `textMesh2-mirror-${this.text}`;
      this.group.add(this.textMesh2);
    }
  }

  /**
   * Refreshes the 3D text by disposing existing meshes and creating new ones.
   */
  refreshText() {
    this.createAndAddTextMeshes();
  }

  /**
   * Handles keyboard key down events for text input (backspace).
   * @param {KeyboardEvent} event - The keyboard event.
   */
  onDocumentKeyDown(event) {
    if (this.firstLetter) {
      this.firstLetter = false;
      this.text = '';
    }
    if (event.keyCode === 8) { // Backspace key
      event.preventDefault();
      this.text = this.text.substring(0, this.text.length - 1);
      this.refreshText();
      return false;
    }
  }

  /**
   * Handles keyboard key press events for text input.
   * Appends typed characters to `this.text` and refreshes the display.
   * @param {KeyboardEvent} event - The keyboard event.
   */
  onDocumentKeyPress(event) {
    const keyCode = event.which || event.keyCode;
    if (keyCode === 8) {
      event.preventDefault();
      return;
    }
    const ch = String.fromCharCode(keyCode);
    this.text += ch;
    this.refreshText();
  }

  /**
   * Handler for BPM beat events.
   * In automatic word change mode, triggers `WordChange` after a certain number of beats.
   */
  onBPMBeat() {
    if (Renderer.instance && Renderer.instance.props.wordSettings.wordChangeMode === "automatic") {
      this.beatcount++;
      if (this.beatcount % Math.max(1, this.beatlimit) === 0) {
        // The word itself is still changed here.
        this.WordChange();
      }
    }
  }

  /**
   * Fetches a random word based on the selected language.
   * Uses `fetchRandomWord` from `WordGenerator.js`.
   * @returns {Promise<string>} A promise that resolves to a random word.
   */
  async randomWord() {
    const result = await fetchRandomWord(this.Lang);
    const fetchedWord = result?.word || 'word';

    if (this.Lang === "EN") {
      const { sims = [], rhymes = [] } = result || {};
      const simsStrings = (sims || []).map(i => i[0]);
      const rhymesStrings = (rhymes || []).map(i => i[0]);
      const allStrings = [fetchedWord, ...simsStrings, ...rhymesStrings].filter(Boolean);
      return allStrings.length ? allStrings[Math.floor(Math.random() * allStrings.length)] : fetchedWord;
    }
    return fetchedWord;
  }

  /**
   * Changes the displayed word to a random word and triggers a text animation.
   */
  async WordChange() {
    const w = await this.randomWord();
    if (w) {
      Text3DSpin.word_change_counter++;
      this.setText(w); // This will cause a componentDidUpdate in Renderer which will trigger the specific animation
    }
  }

  /**
   * Triggers a specific text animation effect.
   * @param {string} effectName - The name of the animation effect to trigger.
   * @param {string} newText - The new text string to be animated in.
   */
  triggerTextAnimation(effectName, newText) {
    // Immediately dispose of the old meshes before creating new ones.
    this._disposeMesh(this.textMesh1);
    this._disposeMesh(this.textMesh2);

    this.textMesh1 = this.createTextMeshFromString(newText);
    if (!this.textMesh1) {
      // If new mesh can't be created, at least ensure old is gone and exit.
      this.textMesh1 = null;
      this.textMesh2 = null;
      return;
    }

    // Add the new main mesh to the group
    this.group.add(this.textMesh1);
    this._setMaterialsAlpha(this.textMesh1, 0); // Start new mesh transparent

    if (this.mirror) {
      this.textMesh2 = this.createTextMeshFromString(newText); // Recreate mirrored mesh for the new text
      if (this.textMesh2) {
        this.textMesh2.position.copy(this.textMesh1.position);
        this.textMesh2.position.y = -this.hover;
        this.textMesh2.rotation.set(Math.PI, 0, 0);
        this.group.add(this.textMesh2);
        this._setMaterialsAlpha(this.textMesh2, 0); // Start new mirrored mesh transparent
      }
    } else {
      this.textMesh2 = null;
    }

    // Call the specific animation handler. Pass null for old meshes since they are already disposed.
    this._animateTextTransition(effectName, null, this.textMesh1, null, this.textMesh2);
  }

  /**
   * Internal method to manage the transition logic between the old and new text meshes
   * based on the chosen effect.
   * @param {string} effectName - The name of the animation effect.
   * @param {THREE.Mesh|null} oldMesh - The previously active main mesh (will be null after immediate disposal).
   * @param {THREE.Mesh} newMainMesh - The newly created mesh for the current word.
   * @param {THREE.Mesh|null} oldMirroredMesh - The previously active mirrored mesh (will be null after immediate disposal).
   * @param {THREE.Mesh|null} newMirroredMesh - The newly created mirrored mesh, if applicable.
   */
  _animateTextTransition(effectName, oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh) {
    this._cleanUpCurrentTextAnimation(); // Clean up any previous animations

    // The onComplete callback now just ensures visibility and cleans up any remaining specific effect components
    const onCompleteCallback = () => {
      this._setMaterialsAlpha(newMainMesh, 1);
      if (newMirroredMesh) this._setMaterialsAlpha(newMirroredMesh, 1);
      this._currentTextAnimationTimeline = null; // Clear timeline reference
      this._currentAnimationUpdateFn = null; // Clear non-GSAP update function
    };

    // All animation functions now animate the new mesh from its initial (often hidden/scaled) state
    // to its final visible state, and then call onCompleteCallback.
    switch (effectName) {
      case 'fade': this.animateFade(newMainMesh, newMirroredMesh, onCompleteCallback); break;
      case 'scale': this.animateScale(newMainMesh, newMirroredMesh, onCompleteCallback); break;
      case 'slide': this.animateSlide(newMainMesh, newMirroredMesh, onCompleteCallback); break;
      case 'flip': this.animateFlip(newMainMesh, newMirroredMesh, onCompleteCallback); break;
      case 'cardFlip': this.animateCardFlip(newMainMesh, newMirroredMesh, onCompleteCallback); break;
      case 'color': this.animateColor(newMainMesh, newMirroredMesh, onCompleteCallback); break;
      case 'bounce': this.animateBounce(newMainMesh, newMirroredMesh, onCompleteCallback); break;
      case 'slideFade': this.animateSlideFade(newMainMesh, newMirroredMesh, onCompleteCallback); break;
      case 'liquidify': this.animateLiquidify(newMainMesh, newMirroredMesh, onCompleteCallback); break;
      case 'shatter': this.animateShatter(newMainMesh, newMirroredMesh, onCompleteCallback); break;
      case 'ripInHalfBlood': this.animateRipInHalfBlood(newMainMesh, newMirroredMesh, onCompleteCallback); break;
      case 'punched': this.animatePunched(newMainMesh, newMirroredMesh, onCompleteCallback); break;
      case 'supernova': this.animateSupernova(newMainMesh, newMirroredMesh, onCompleteCallback); break;
      case 'clothRip': this.animateClothRip(newMainMesh, newMirroredMesh, onCompleteCallback); break;
      case 'chewed': this.animateChewed(newMainMesh, newMirroredMesh, onCompleteCallback); break;
      case 'bigCrunch': this.animateBigCrunch(newMainMesh, newMirroredMesh, onCompleteCallback); break;
      case 'none':
      default:
        // No animation, just make new meshes visible
        onCompleteCallback();
        break;
    }
  }

  /**
   * Cleans up any ongoing animations and prepares for a new text animation.
   * This includes killing GSAP tweens and removing any active custom update functions.
   */
  _cleanUpCurrentTextAnimation() {
    if (this._currentTextAnimationTimeline) {
      this._currentTextAnimationTimeline.kill();
      this._currentTextAnimationTimeline = null;
    }
    if (this._currentAnimationUpdateFn) {
      gsap.ticker.remove(this._currentAnimationUpdateFn);
      this._currentAnimationUpdateFn = null;
    }

    // Ensure any particle systems are also cleaned up if ripInHalfBlood was active
    this.group.children = this.group.children.filter(child => {
      if (child.isPoints && child.name === 'bloodParticles') {
        this._disposeMesh(child);
        return false;
      }
      // Also specifically remove any split meshes from ripInHalfBlood
      if (child.name === 'ripLeftHalf' || child.name === 'ripRightHalf') {
        this._disposeMesh(child);
        return false;
      }
      return true;
    });
  }

  /**
   * Updates the rotation of the text group.
   * This should be called in the main render loop.
   */
  update() {
    if (!this.group) return;
    // The text now looks at the camera in the Renderer.jsx update loop,
    // so this rotation update is no longer needed for camera-facing.
    // If it's for other purposes, keep it, otherwise, it can be removed.
    this.group.rotation.y += (this.targetRotation - this.group.rotation.y) * 0.06;
  }

  // --------------Helpers ---------------
  /**
   * Sets the opacity (alpha) for the materials of a given mesh.
   * Ensures materials are transparent for opacity changes.
   * @param {THREE.Mesh} mesh - The mesh to update.
   * @param {number} alpha - The opacity value (0-1).
   */
  _setMaterialsAlpha(mesh, alpha) {
    if (!mesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach(m => {
      m.transparent = true; // Essential for opacity to work
      m.opacity = alpha;
      // Also adjust material.needsUpdate to ensure Three.js re-renders
      m.needsUpdate = true;
    });
  }

  /**
   * Retrieves the materials of a given mesh.
   * @param {THREE.Mesh} mesh - The mesh to get materials from.
   * @returns {Array<THREE.Material>} An array of materials.
   */
  _getMaterials(mesh) {
    if (!mesh) return [];
    return Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  }

  // NOTE: _performSwap is no longer needed as old meshes are disposed immediately upon new word trigger.

  // ---------------Animations ----------------
  // All animation functions now animate the new mesh from its initial state to its final visible state,
  // then call onComplete at the end of the transition.
  animateFade(newMainMesh, newMirroredMesh, onComplete) {
    // newMainMesh and newMirroredMesh (if exists) are already in the group and set to opacity 0.
    this._currentTextAnimationTimeline = gsap.timeline({ onComplete: onComplete });

    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), {
      opacity: 1,
      duration: 0.5,
      ease: "power2.out",
    });
    if (newMirroredMesh) {
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), {
        opacity: 1,
        duration: 0.5,
        ease: "power2.out",
      }, 0); // Play simultaneously
    }
  }

  animateScale(newMainMesh, newMirroredMesh, onComplete) {
    // newMainMesh and newMirroredMesh (if exists) are already in the group and set to opacity 0, scale 0.001.
    this._currentTextAnimationTimeline = gsap.timeline({ onComplete: onComplete });

    this._currentTextAnimationTimeline.to(newMainMesh.scale, {
      x: 1, y: 1, z: 1,
      duration: 0.45,
      ease: "elastic.out(1, 0.6)",
    });
    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), { opacity: 1, duration: 0.45 * 0.5 }, 0);

    if (newMirroredMesh) {
      this._currentTextAnimationTimeline.to(newMirroredMesh.scale, {
        x: 1, y: 1, z: 1,
        duration: 0.45,
        ease: "elastic.out(1, 0.6)",
      }, 0);
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), { opacity: 1, duration: 0.45 * 0.5 }, 0);
    }
  }

  animateSlide(newMainMesh, newMirroredMesh, onComplete) {
    const newMeshBBox = newMainMesh.geometry.boundingBox;
    const newMeshCenterOffset = (newMeshBBox.max.x - newMeshBBox.min.x) * -0.5;

    // newMainMesh starts at x=5, opacity 0.
    this._currentTextAnimationTimeline = gsap.timeline({ onComplete: onComplete });

    this._currentTextAnimationTimeline.to(newMainMesh.position, {
      x: newMeshCenterOffset, // Slide to center
      duration: 0.42,
      ease: "expo.out",
    });
    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), { opacity: 1, duration: 0.42 * 0.5 }, 0);

    if (newMirroredMesh) {
      newMirroredMesh.position.x = 5; // Start from right
      this._currentTextAnimationTimeline.to(newMirroredMesh.position, {
        x: newMeshCenterOffset,
        duration: 0.42,
        ease: "expo.out",
      }, 0);
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), { opacity: 1, duration: 0.42 * 0.5 }, 0);
    }
  }

  animateFlip(newMainMesh, newMirroredMesh, onComplete) {
    // newMainMesh starts at rotation.y = -Math.PI / 2, opacity 0.
    this._currentTextAnimationTimeline = gsap.timeline({ onComplete: onComplete });

    this._currentTextAnimationTimeline.to(newMainMesh.rotation, {
      y: 0,
      duration: 0.36,
      ease: "power1.out",
    });
    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), { opacity: 1, duration: 0.36 * 0.5 }, 0);

    if (newMirroredMesh) {
      newMirroredMesh.rotation.y = -Math.PI / 2;
      this._currentTextAnimationTimeline.to(newMirroredMesh.rotation, {
        y: 0,
        duration: 0.36,
        ease: "power1.out",
      }, 0);
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), { opacity: 1, duration: 0.36 * 0.5 }, 0);
    }
  }

  animateCardFlip(newMainMesh, newMirroredMesh, onComplete) {
    // newMainMesh starts at rotation.y = Math.PI, opacity 0.
    this._currentTextAnimationTimeline = gsap.timeline({ onComplete: onComplete });

    this._currentTextAnimationTimeline.to(newMainMesh.rotation, {
      y: 0,
      duration: 0.58,
      ease: "power2.inOut",
    });
    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), { opacity: 1, duration: 0.58 * 0.5 }, 0);

    if (newMirroredMesh) {
      newMirroredMesh.rotation.y = Math.PI;
      this._currentTextAnimationTimeline.to(newMirroredMesh.rotation, {
        y: 0,
        duration: 0.58,
        ease: "power2.inOut",
      }, 0);
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), { opacity: 1, duration: 0.58 * 0.5 }, 0);
    }
  }

  animateColor(newMainMesh, newMirroredMesh, onComplete) {
    // newMainMesh starts transparent.
    this._currentTextAnimationTimeline = gsap.timeline({ onComplete: onComplete });

    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), {
      opacity: 1,
      duration: 0.22,
      ease: "power2.out",
    });
    this._currentTextAnimationTimeline.fromTo(this._getMaterials(newMainMesh).map(m => m.color),
      {
        r: new THREE.Color(0xFF8C00).r,
        g: new THREE.Color(0xFF8C00).g,
        b: new THREE.Color(0xFF8C00).b,
      },
      {
        r: newMainMesh.material[0].color.r,
        g: newMainMesh.material[0].color.g,
        b: newMainMesh.material[0].color.b,
        duration: 0.44,
        ease: "sine.inOut"
      }, 0); // From orange to white
    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), {
      emissiveIntensity: 0, // Reset emissive intensity
      duration: 0.18,
      ease: "sine.inOut",
    }, 0);


    if (newMirroredMesh) {
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), {
        opacity: 1,
        duration: 0.22,
        ease: "power2.out",
      }, 0);
      this._currentTextAnimationTimeline.fromTo(this._getMaterials(newMirroredMesh).map(m => m.color),
        {
          r: new THREE.Color(0xFF8C00).r,
          g: new THREE.Color(0xFF8C00).g,
          b: new THREE.Color(0xFF8C00).b,
        },
        {
          r: newMirroredMesh.material[0].color.r,
          g: newMirroredMesh.material[0].color.g,
          b: newMirroredMesh.material[0].color.b,
          duration: 0.44,
          ease: "sine.inOut"
        }, 0);
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), {
        emissiveIntensity: 0,
        duration: 0.18,
        ease: "sine.inOut",
      }, 0);
    }
  }

  animateBounce(newMainMesh, newMirroredMesh, onComplete) {
    // newMainMesh starts at scale 0.2, opacity 0.
    this._currentTextAnimationTimeline = gsap.timeline({ onComplete: onComplete });

    this._currentTextAnimationTimeline.to(newMainMesh.scale, {
      x: 1, y: 1, z: 1,
      duration: 0.46,
      ease: "bounce.out",
    });
    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), { opacity: 1, duration: 0.46 * 0.5 }, 0);

    if (newMirroredMesh) {
      newMirroredMesh.scale.set(0.2, 0.2, 0.2);
      this._currentTextAnimationTimeline.to(newMirroredMesh.scale, {
        x: 1, y: 1, z: 1,
        duration: 0.46,
        ease: "bounce.out",
      }, 0);
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), { opacity: 1, duration: 0.46 * 0.5 }, 0);
    }
  }

  animateSlideFade(newMainMesh, newMirroredMesh, onComplete) {
    const newMeshBBox = newMainMesh.geometry.boundingBox;
    const newMeshCenterOffset = (newMeshBBox.max.x - newMeshBBox.min.x) * -0.5;

    // newMainMesh starts at x=-2, opacity 0.
    this._currentTextAnimationTimeline = gsap.timeline({ onComplete: onComplete });

    this._currentTextAnimationTimeline.to(newMainMesh.position, {
      x: newMeshCenterOffset, // Slide to center
      duration: 0.36,
      ease: "power3.out",
    });
    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), { opacity: 1, duration: 0.34, ease: "power2.out" }, 0);

    if (newMirroredMesh) {
      newMirroredMesh.position.x = -2;
      this._currentTextAnimationTimeline.to(newMirroredMesh.position, {
        x: newMeshCenterOffset,
        duration: 0.36,
        ease: "power3.out",
      }, 0);
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), { opacity: 1, duration: 0.34, ease: "power2.out" }, 0);
    }
  }

  animateLiquidify(newMainMesh, newMirroredMesh, onComplete) {
    // newMainMesh starts transparent.
    this._setMaterialsAlpha(newMainMesh, 0);
    if (newMirroredMesh) this._setMaterialsAlpha(newMirroredMesh, 0);

    const totalDuration = 0.8; // Only for new mesh fade in

    let timelineOnComplete = () => {
      // No custom update functions for fade-in of new mesh
      onComplete(); // Call the passed onComplete
    };

    this._currentTextAnimationTimeline = gsap.timeline({
      onComplete: timelineOnComplete
    });

    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), {
      opacity: 1,
      duration: totalDuration,
      ease: "power2.out",
    });
    if (newMirroredMesh) {
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), {
        opacity: 1,
        duration: totalDuration,
        ease: "power2.out",
      }, 0);
    }
  }

  animateShatter(newMainMesh, newMirroredMesh, onComplete) {
    // newMainMesh starts transparent.
    this._setMaterialsAlpha(newMainMesh, 0);
    if (newMirroredMesh) this._setMaterialsAlpha(newMirroredMesh, 0);

    const duration = 0.5;

    let timelineOnComplete = () => {
      // No custom update functions for fade-in of new mesh
      onComplete(); // Call the passed onComplete
    };

    this._currentTextAnimationTimeline = gsap.timeline({
      onComplete: timelineOnComplete
    });

    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), {
      opacity: 1,
      duration: duration,
      ease: "power2.out",
    });
    if (newMirroredMesh) {
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), {
        opacity: 1,
        duration: duration,
        ease: "power2.out",
      }, 0);
    }
  }

  animateRipInHalfBlood(newMainMesh, newMirroredMesh, onComplete) {
    // newMainMesh starts transparent. Particles are created and animated separately.
    this._setMaterialsAlpha(newMainMesh, 0);
    if (newMirroredMesh) this._setMaterialsAlpha(newMirroredMesh, 0);

    let timelineOnComplete = () => {
      onComplete(); // Call the passed onComplete
    };

    // New main mesh fades in after a short delay
    this._currentTextAnimationTimeline = gsap.timeline({ onComplete: timelineOnComplete });

    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), {
      opacity: 1,
      duration: 0.55,
      ease: "power2.out",
    }, 0.5); // Delay fade-in slightly
    if (newMirroredMesh) {
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), {
        opacity: 1,
        duration: 0.55,
        ease: "power2.out",
      }, 0.5);
    }
  }


  animatePunched(newMainMesh, newMirroredMesh, onComplete) {
    // newMainMesh starts at scale 1.6, 0.2, 1.6 and opacity 0.
    this._currentTextAnimationTimeline = gsap.timeline({ onComplete: onComplete });

    this._currentTextAnimationTimeline.fromTo(newMainMesh.scale, { x: 1.6, y: 0.2, z: 1.6 }, { x: 1, y: 1, z: 1, duration: 1.6, ease: "elastic.out(1,0.4)" });
    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), { opacity: 1, duration: 1.6 * 0.2 }, 0);

    if (newMirroredMesh) {
      newMirroredMesh.scale.set(1.6, 0.2, 1.6);
      this._currentTextAnimationTimeline.fromTo(newMirroredMesh.scale, { x: 1.6, y: 0.2, z: 1.6 }, { x: 1, y: 1, z: 1, duration: 1.6, ease: "elastic.out(1,0.4)" }, 0);
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), { opacity: 1, duration: 1.6 * 0.2 }, 0);
    }
  }

  animateSupernova(newMainMesh, newMirroredMesh, onComplete) {
    // newMainMesh starts at scale 0.2, opacity 0.
    this._currentTextAnimationTimeline = gsap.timeline({ onComplete: onComplete });

    this._currentTextAnimationTimeline.fromTo(newMainMesh.scale, { x: 0.2, y: 0.2, z: 0.2 }, { x: 1, y: 1, z: 1, duration: 0.8, ease: "elastic.out(1,0.5)" });
    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), { opacity: 1, duration: 0.8 * 0.5 }, 0);

    if (newMirroredMesh) {
      newMirroredMesh.scale.set(0.2, 0.2, 0.2);
      this._currentTextAnimationTimeline.fromTo(newMirroredMesh.scale, { x: 0.2, y: 0.2, z: 0.2 }, { x: 1, y: 1, z: 1, duration: 0.8, ease: "elastic.out(1,0.5)" }, 0);
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), { opacity: 1, duration: 0.8 * 0.5 }, 0);
    }
  }

  animateClothRip(newMainMesh, newMirroredMesh, onComplete) {
    // newMainMesh starts transparent.
    this._setMaterialsAlpha(newMainMesh, 0);
    if (newMirroredMesh) this._setMaterialsAlpha(newMirroredMesh, 0);

    const duration = 0.6;

    let timelineOnComplete = () => {
      onComplete();
    };

    this._currentTextAnimationTimeline = gsap.timeline({ onComplete: timelineOnComplete });

    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), { opacity: 1, duration: duration, ease: "power2.out" });
    if (newMirroredMesh) {
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), { opacity: 1, duration: duration, ease: "power2.out" }, 0);
    }
  }

  animateChewed(newMainMesh, newMirroredMesh, onComplete) {
    // newMainMesh starts transparent.
    this._setMaterialsAlpha(newMainMesh, 0);
    if (newMirroredMesh) this._setMaterialsAlpha(newMirroredMesh, 0);

    const duration = 0.5;

    let timelineOnComplete = () => {
      onComplete();
    };

    this._currentTextAnimationTimeline = gsap.timeline({ onComplete: timelineOnComplete });

    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), { opacity: 1, duration: duration, ease: "power2.out" });
    if (newMirroredMesh) {
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), { opacity: 1, duration: duration, ease: "power2.out" }, 0);
    }
  }

  animateBigCrunch(newMainMesh, newMirroredMesh, onComplete) {
    // newMainMesh starts transparent.
    this._setMaterialsAlpha(newMainMesh, 0);
    if (newMirroredMesh) this._setMaterialsAlpha(newMirroredMesh, 0);

    const duration = 0.5;

    let timelineOnComplete = () => {
      onComplete();
    };

    this._currentTextAnimationTimeline = gsap.timeline({ onComplete: timelineOnComplete });

    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), { opacity: 1, duration: duration, ease: "power2.out" });
    if (newMirroredMesh) {
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), { opacity: 1, duration: duration, ease: "power2.out" }, 0);
    }
  }


  // ---------- Utility: circle sprite ----------
  /**
   * Creates a radial gradient circle sprite texture.
   * @returns {THREE.CanvasTexture} The created texture.
   */
  _makeCircleSpriteTexture() {
    const size = 128;
    const cvs = document.createElement('canvas');
    cvs.width = cvs.height = size;
    const ctx = cvs.getContext('2d');
    const grd = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grd.addColorStop(0.0, 'rgba(160,10,10,1)');
    grd.addColorStop(0.35, 'rgba(120,10,10,0.95)');
    grd.addColorStop(1.0, 'rgba(100,10,10,0.0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(cvs);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = Renderer.renderer?.capabilities?.getMaxAnisotropy?.() || 1;
    return tex;
  }

  /**
   * Gets or creates the cached circle sprite texture.
   * @returns {THREE.CanvasTexture} The circle sprite texture.
   */
  _getOrCreateCircleSpriteTexture() {
    if (!this._circleTex) this._circleTex = this._makeCircleSpriteTexture();
    return this._circleTex;
  }
}