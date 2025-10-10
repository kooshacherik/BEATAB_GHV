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
    // This function sets up the new mesh, then passes it to the animation function.
    // The animation function will then handle the transition from old to new.
    const newMainMesh = this.createTextMeshFromString(newText);
    if (!newMainMesh) {
      this.refreshText(); // Fallback to instant display if mesh can't be created
      return;
    }

    let newMirroredMesh = null;
    if (this.mirror) {
      newMirroredMesh = this.createTextMeshFromString(newMainMesh.name.replace('textMesh', ''));
      if (newMirroredMesh) {
        newMirroredMesh.position.copy(newMainMesh.position);
        newMirroredMesh.position.y = -this.hover; // Mirror position needs to be negative hover
        newMirroredMesh.rotation.set(Math.PI, 0, 0);
      }
    }
    // Add new meshes to the group, but potentially invisible/scaled down
    this.group.add(newMainMesh);
    if (newMirroredMesh) this.group.add(newMirroredMesh);

    // Call the specific animation handler
    this._animateTextTransition(effectName, this.textMesh1, newMainMesh, this.textMesh2, newMirroredMesh);
  }

  /**
   * Internal method to manage the transition logic between the old and new text meshes
   * based on the chosen effect.
   * @param {string} effectName - The name of the animation effect.
   * @param {THREE.Mesh} oldMesh - The previously active main mesh.
   * @param {THREE.Mesh} newMainMesh - The newly created mesh for the current word.
   * @param {THREE.Mesh|null} oldMirroredMesh - The previously active mirrored mesh, if applicable.
   * @param {THREE.Mesh|null} newMirroredMesh - The newly created mirrored mesh, if applicable.
   */
  _animateTextTransition(effectName, oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh) {
    this._cleanUpCurrentTextAnimation(); // Clean up any previous animations

    const onCompleteCallback = () => {
      // This callback now explicitly receives the new meshes that should become active
      this._performSwap(newMainMesh, newMirroredMesh);
    };

    // All animation functions should be refactored to take oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh
    // and handle their transition using GSAP or custom update functions,
    // finally calling onCompleteCallback at the end of the transition.
    switch (effectName) {
      case 'fade': this.animateFade(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onCompleteCallback); break;
      case 'scale': this.animateScale(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onCompleteCallback); break;
      case 'slide': this.animateSlide(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onCompleteCallback); break;
      case 'flip': this.animateFlip(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onCompleteCallback); break;
      case 'cardFlip': this.animateCardFlip(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onCompleteCallback); break;
      case 'color': this.animateColor(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onCompleteCallback); break;
      case 'bounce': this.animateBounce(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onCompleteCallback); break;
      case 'slideFade': this.animateSlideFade(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onCompleteCallback); break;
      case 'liquidify': this.animateLiquidify(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onCompleteCallback); break;
      case 'shatter': this.animateShatter(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onCompleteCallback); break;
      case 'ripInHalfBlood': this.animateRipInHalfBlood(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onCompleteCallback); break;
      case 'punched': this.animatePunched(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onCompleteCallback); break;
      case 'supernova': this.animateSupernova(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onCompleteCallback); break;
      case 'clothRip': this.animateClothRip(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onCompleteCallback); break;
      case 'chewed': this.animateChewed(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onCompleteCallback); break;
      case 'bigCrunch': this.animateBigCrunch(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onCompleteCallback); break;
      case 'none':
      default:
        // No animation, just swap directly
        // Ensure old meshes are removed and new are visible
        if (oldMesh) this.group.remove(oldMesh);
        if (oldMirroredMesh) this.group.remove(oldMirroredMesh);
        this.textMesh1 = newMainMesh;
        this.textMesh2 = newMirroredMesh;
        this._setMaterialsAlpha(this.textMesh1, 1);
        if (this.textMesh2) this._setMaterialsAlpha(this.textMesh2, 1);
        this._currentTextAnimationTimeline = null; // Clear timeline reference
        this._currentAnimationUpdateFn = null; // Clear non-GSAP update function
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
    // Also explicitly kill tweens on existing meshes if they might have lingering animations
    // and set their opacity to 0 just in case they were left partially visible.
    if (this.textMesh1) {
      gsap.killTweensOf(this.textMesh1.position);
      gsap.killTweensOf(this.textMesh1.rotation);
      gsap.killTweensOf(this.textMesh1.scale);
      this._getMaterials(this.textMesh1).forEach(m => {
        gsap.killTweensOf(m);
        gsap.killTweensOf(m.color);
        m.opacity = 0; // Force hide
      });
    }
    if (this.textMesh2) {
      gsap.killTweensOf(this.textMesh2.position);
      gsap.killTweensOf(this.textMesh2.rotation);
      gsap.killTweensOf(this.textMesh2.scale);
      this._getMaterials(this.textMesh2).forEach(m => {
        gsap.killTweensOf(m);
        gsap.killTweensOf(m.color);
        m.opacity = 0; // Force hide
      });
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

  /**
   * Helper function to manage the "swapping" of current and new meshes
   * after an animation is complete.
   * This is called by animation functions internally.
   * @param {THREE.Mesh} newMainMesh - The mesh that becomes the new this.textMesh1.
   * @param {THREE.Mesh|null} newMirroredMesh - The mesh that becomes the new this.textMesh2.
   */
  _performSwap(newMainMesh, newMirroredMesh) {
    // This function encapsulates the final state update and disposal
    // after an animation has completed.

    // Remove old meshes from the group
    if (this.textMesh1 && this.textMesh1.parent) {
      this.textMesh1.parent.remove(this.textMesh1);
      this._disposeMesh(this.textMesh1);
    }
    if (this.textMesh2 && this.textMesh2.parent) {
      this.textMesh2.parent.remove(this.textMesh2);
      this._disposeMesh(this.textMesh2);
    }

    // Set new meshes as active
    this.textMesh1 = newMainMesh;
    this.textMesh2 = newMirroredMesh;

    // Ensure new meshes are fully visible and not hidden
    this._setMaterialsAlpha(this.textMesh1, 1);
    if (this.textMesh2) {
      this._setMaterialsAlpha(this.textMesh2, 1);
    }

    // Clear internal animation state
    this._currentTextAnimationTimeline = null;
    this._currentAnimationUpdateFn = null;
  }

  // ---------------Animations ----------------
  // All animation functions now accept `oldMesh`, `newMainMesh`, `oldMirroredMesh`, `newMirroredMesh`, and `onComplete`
  // They are responsible for animating oldMesh out and newMainMesh in,
  // then calling onComplete at the logical end of the transition.
  animateFade(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onComplete) {
    // Set initial state for new mesh
    this._setMaterialsAlpha(newMainMesh, 0);
    if (newMirroredMesh) this._setMaterialsAlpha(newMirroredMesh, 0);

    const fadeOutDuration = 0.45;
    const fadeInDuration = 0.5;
    const fadeInDelay = fadeOutDuration * 0.5; // New text starts fading in before old is completely gone

    let timelineOnComplete = onComplete;
    if (oldMesh) {
      this._currentTextAnimationTimeline = gsap.timeline({ onComplete: timelineOnComplete });
      this._currentTextAnimationTimeline.to(this._getMaterials(oldMesh), {
        opacity: 0,
        duration: fadeOutDuration,
        ease: "power2.in",
      });
      if (oldMirroredMesh) {
        this._currentTextAnimationTimeline.to(this._getMaterials(oldMirroredMesh), {
          opacity: 0,
          duration: fadeOutDuration,
          ease: "power2.in",
        }, 0); // Play simultaneously
      }
    } else {
      // If no old mesh, just fade in new mesh
      this._currentTextAnimationTimeline = gsap.timeline({ onComplete: timelineOnComplete });
    }

    // Animate new text in
    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), {
      opacity: 1,
      duration: fadeInDuration,
      ease: "power2.out",
    }, oldMesh ? fadeInDelay : 0); // Delay if old mesh is fading out
    if (newMirroredMesh) {
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), {
        opacity: 1,
        duration: fadeInDuration,
        ease: "power2.out",
      }, oldMesh ? fadeInDelay : 0);
    }
  }

  animateScale(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onComplete) {
    // Set initial state for new mesh
    newMainMesh.scale.set(0.001, 0.001, 0.001);
    this._setMaterialsAlpha(newMainMesh, 0);
    if (newMirroredMesh) {
      newMirroredMesh.scale.set(0.001, 0.001, 0.001);
      this._setMaterialsAlpha(newMirroredMesh, 0);
    }

    const scaleOutDuration = 0.26;
    const scaleInDuration = 0.45;
    const fadeInDelay = scaleOutDuration * 0.5;

    let timelineOnComplete = onComplete;
    this._currentTextAnimationTimeline = gsap.timeline({ onComplete: timelineOnComplete });

    if (oldMesh) {
      this._currentTextAnimationTimeline.to(oldMesh.scale, {
        x: 0.02, y: 0.02, z: 0.02,
        duration: scaleOutDuration,
        ease: "power2.in",
      });
      this._currentTextAnimationTimeline.to(this._getMaterials(oldMesh), { opacity: 0, duration: scaleOutDuration * 0.5 }, 0);
      if (oldMirroredMesh) {
        this._currentTextAnimationTimeline.to(oldMirroredMesh.scale, {
          x: 0.02, y: 0.02, z: 0.02,
          duration: scaleOutDuration,
          ease: "power2.in",
        }, 0);
        this._currentTextAnimationTimeline.to(this._getMaterials(oldMirroredMesh), { opacity: 0, duration: scaleOutDuration * 0.5 }, 0);
      }
    }

    this._currentTextAnimationTimeline.to(newMainMesh.scale, {
      x: 1, y: 1, z: 1,
      duration: scaleInDuration,
      ease: "elastic.out(1, 0.6)",
    }, oldMesh ? fadeInDelay : 0);
    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), { opacity: 1, duration: scaleInDuration * 0.5 }, oldMesh ? fadeInDelay : 0);

    if (newMirroredMesh) {
      this._currentTextAnimationTimeline.to(newMirroredMesh.scale, {
        x: 1, y: 1, z: 1,
        duration: scaleInDuration,
        ease: "elastic.out(1, 0.6)",
      }, oldMesh ? fadeInDelay : 0);
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), { opacity: 1, duration: scaleInDuration * 0.5 }, oldMesh ? fadeInDelay : 0);
    }
  }

  animateSlide(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onComplete) {
    const newMeshBBox = newMainMesh.geometry.boundingBox;
    const newMeshCenterOffset = (newMeshBBox.max.x - newMeshBBox.min.x) * -0.5;

    // Set initial state for new mesh
    newMainMesh.position.x = 5; // Start from right
    this._setMaterialsAlpha(newMainMesh, 0); // Start transparent for a fade-in effect if desired later
    if (newMirroredMesh) {
      newMirroredMesh.position.x = 5;
      this._setMaterialsAlpha(newMirroredMesh, 0);
    }

    const slideOutDuration = 0.36;
    const slideInDuration = 0.42;

    let timelineOnComplete = onComplete;
    this._currentTextAnimationTimeline = gsap.timeline({ onComplete: timelineOnComplete });

    if (oldMesh) {
      this._currentTextAnimationTimeline.to(oldMesh.position, {
        x: -5,
        duration: slideOutDuration,
        ease: "power2.in",
      });
      this._currentTextAnimationTimeline.to(this._getMaterials(oldMesh), { opacity: 0, duration: slideOutDuration * 0.5 }, 0);
      if (oldMirroredMesh) {
        this._currentTextAnimationTimeline.to(oldMirroredMesh.position, {
          x: -5,
          duration: slideOutDuration,
          ease: "power2.in",
        }, 0);
        this._currentTextAnimationTimeline.to(this._getMaterials(oldMirroredMesh), { opacity: 0, duration: slideOutDuration * 0.5 }, 0);
      }
    }

    this._currentTextAnimationTimeline.to(newMainMesh.position, {
      x: newMeshCenterOffset, // Slide to center
      duration: slideInDuration,
      ease: "expo.out",
    }, oldMesh ? slideOutDuration * 0.7 : 0); // Start new one before old is fully out
    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), { opacity: 1, duration: slideInDuration * 0.5 }, oldMesh ? slideOutDuration * 0.7 : 0);

    if (newMirroredMesh) {
      this._currentTextAnimationTimeline.to(newMirroredMesh.position, {
        x: newMeshCenterOffset,
        duration: slideInDuration,
        ease: "expo.out",
      }, oldMesh ? slideOutDuration * 0.7 : 0);
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), { opacity: 1, duration: slideInDuration * 0.5 }, oldMesh ? slideOutDuration * 0.7 : 0);
    }
  }

  animateFlip(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onComplete) {
    // Set initial state for new mesh
    newMainMesh.rotation.y = -Math.PI / 2; // Start from the other side
    this._setMaterialsAlpha(newMainMesh, 0); // Start transparent
    if (newMirroredMesh) {
      newMirroredMesh.rotation.y = -Math.PI / 2;
      this._setMaterialsAlpha(newMirroredMesh, 0);
    }

    const flipDuration = 0.36;

    let timelineOnComplete = onComplete;
    this._currentTextAnimationTimeline = gsap.timeline({ onComplete: timelineOnComplete });

    if (oldMesh) {
      this._currentTextAnimationTimeline.to(oldMesh.rotation, {
        y: Math.PI / 2,
        duration: flipDuration,
        ease: "power1.in",
      });
      this._currentTextAnimationTimeline.to(this._getMaterials(oldMesh), { opacity: 0, duration: flipDuration * 0.5 }, 0);
      if (oldMirroredMesh) {
        this._currentTextAnimationTimeline.to(oldMirroredMesh.rotation, {
          y: Math.PI / 2,
          duration: flipDuration,
          ease: "power1.in",
        }, 0);
        this._currentTextAnimationTimeline.to(this._getMaterials(oldMirroredMesh), { opacity: 0, duration: flipDuration * 0.5 }, 0);
      }
    }

    this._currentTextAnimationTimeline.to(newMainMesh.rotation, {
      y: 0,
      duration: flipDuration,
      ease: "power1.out",
    }, oldMesh ? flipDuration * 0.5 : 0); // Start new one halfway through old one
    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), { opacity: 1, duration: flipDuration * 0.5 }, oldMesh ? flipDuration * 0.5 : 0);

    if (newMirroredMesh) {
      this._currentTextAnimationTimeline.to(newMirroredMesh.rotation, {
        y: 0,
        duration: flipDuration,
        ease: "power1.out",
      }, oldMesh ? flipDuration * 0.5 : 0);
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), { opacity: 1, duration: flipDuration * 0.5 }, oldMesh ? flipDuration * 0.5 : 0);
    }
  }

  animateCardFlip(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onComplete) {
    // Set initial state for new mesh
    newMainMesh.rotation.y = Math.PI; // Position new mesh to come in from other side
    this._setMaterialsAlpha(newMainMesh, 0);
    if (newMirroredMesh) {
      newMirroredMesh.rotation.y = Math.PI;
      this._setMaterialsAlpha(newMirroredMesh, 0);
    }

    const cardFlipDuration = 0.58;

    let timelineOnComplete = onComplete;
    this._currentTextAnimationTimeline = gsap.timeline({ onComplete: timelineOnComplete });

    if (oldMesh) {
      this._currentTextAnimationTimeline.to(oldMesh.rotation, {
        y: Math.PI,
        duration: cardFlipDuration,
        ease: "power2.inOut",
      });
      this._currentTextAnimationTimeline.to(this._getMaterials(oldMesh), { opacity: 0, duration: cardFlipDuration * 0.5 }, 0);
      if (oldMirroredMesh) {
        this._currentTextAnimationTimeline.to(oldMirroredMesh.rotation, {
          y: Math.PI,
          duration: cardFlipDuration,
          ease: "power2.inOut",
        }, 0);
        this._currentTextAnimationTimeline.to(this._getMaterials(oldMirroredMesh), { opacity: 0, duration: cardFlipDuration * 0.5 }, 0);
      }
    }

    this._currentTextAnimationTimeline.to(newMainMesh.rotation, {
      y: 0,
      duration: cardFlipDuration,
      ease: "power2.inOut",
    }, oldMesh ? cardFlipDuration * 0.5 : 0);
    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), { opacity: 1, duration: cardFlipDuration * 0.5 }, oldMesh ? cardFlipDuration * 0.5 : 0);

    if (newMirroredMesh) {
      this._currentTextAnimationTimeline.to(newMirroredMesh.rotation, {
        y: 0,
        duration: cardFlipDuration,
        ease: "power2.inOut",
      }, oldMesh ? cardFlipDuration * 0.5 : 0);
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), { opacity: 1, duration: cardFlipDuration * 0.5 }, oldMesh ? cardFlipDuration * 0.5 : 0);
    }
  }

  animateColor(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onComplete) {
    this._setMaterialsAlpha(newMainMesh, 0); // New mesh starts transparent
    if (newMirroredMesh) this._setMaterialsAlpha(newMirroredMesh, 0);

    const colorDuration = 0.22;
    const fadeDelay = colorDuration * 0.5;

    let timelineOnComplete = onComplete;
    this._currentTextAnimationTimeline = gsap.timeline({ onComplete: timelineOnComplete });

    if (oldMesh) {
      this._currentTextAnimationTimeline.to(this._getMaterials(oldMesh).map(m => m.color), {
        r: new THREE.Color(0xFF8C00).r,
        g: new THREE.Color(0xFF8C00).g,
        b: new THREE.Color(0xFF8C00).b,
        duration: colorDuration,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut"
      });
      this._currentTextAnimationTimeline.to(this._getMaterials(oldMesh), {
        emissiveIntensity: 2.2,
        duration: 0.18,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut",
        onComplete: () => {
          this._setMaterialsAlpha(oldMesh, 0); // Ensure old mesh is transparent
        }
      }, 0);
      if (oldMirroredMesh) {
        this._currentTextAnimationTimeline.to(this._getMaterials(oldMirroredMesh).map(m => m.color), {
          r: new THREE.Color(0xFF8C00).r,
          g: new THREE.Color(0xFF8C00).g,
          b: new THREE.Color(0xFF8C00).b,
          duration: colorDuration,
          yoyo: true,
          repeat: 1,
          ease: "sine.inOut"
        }, 0);
        this._currentTextAnimationTimeline.to(this._getMaterials(oldMirroredMesh), {
          emissiveIntensity: 2.2,
          duration: 0.18,
          yoyo: true,
          repeat: 1,
          ease: "sine.inOut",
          onComplete: () => {
            this._setMaterialsAlpha(oldMirroredMesh, 0);
          }
        }, 0);
      }
    }

    // Fade in new text after old text effect
    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), {
      opacity: 1,
      duration: colorDuration,
      ease: "power2.out",
    }, oldMesh ? fadeDelay : 0);
    if (newMirroredMesh) {
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), {
        opacity: 1,
        duration: colorDuration,
        ease: "power2.out",
      }, oldMesh ? fadeDelay : 0);
    }
  }

  animateBounce(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onComplete) {
    // Set initial state for new mesh
    newMainMesh.scale.set(0.2, 0.2, 0.2);
    this._setMaterialsAlpha(newMainMesh, 0);
    if (newMirroredMesh) {
      newMirroredMesh.scale.set(0.2, 0.2, 0.2);
      this._setMaterialsAlpha(newMirroredMesh, 0);
    }

    const scaleOutDuration = 0.22;
    const scaleInDuration = 0.46;
    const fadeInDelay = scaleOutDuration * 0.5;

    let timelineOnComplete = onComplete;
    this._currentTextAnimationTimeline = gsap.timeline({ onComplete: timelineOnComplete });

    if (oldMesh) {
      this._currentTextAnimationTimeline.to(oldMesh.scale, {
        x: 0.01, y: 0.01, z: 0.01,
        duration: scaleOutDuration,
        ease: "power1.in",
      });
      this._currentTextAnimationTimeline.to(this._getMaterials(oldMesh), { opacity: 0, duration: scaleOutDuration * 0.5 }, 0);
      if (oldMirroredMesh) {
        this._currentTextAnimationTimeline.to(oldMirroredMesh.scale, {
          x: 0.01, y: 0.01, z: 0.01,
          duration: scaleOutDuration,
          ease: "power1.in",
        }, 0);
        this._currentTextAnimationTimeline.to(this._getMaterials(oldMirroredMesh), { opacity: 0, duration: scaleOutDuration * 0.5 }, 0);
      }
    }

    this._currentTextAnimationTimeline.to(newMainMesh.scale, {
      x: 1, y: 1, z: 1,
      duration: scaleInDuration,
      ease: "bounce.out",
    }, oldMesh ? fadeInDelay : 0);
    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), { opacity: 1, duration: scaleInDuration * 0.5 }, oldMesh ? fadeInDelay : 0);

    if (newMirroredMesh) {
      this._currentTextAnimationTimeline.to(newMirroredMesh.scale, {
        x: 1, y: 1, z: 1,
        duration: scaleInDuration,
        ease: "bounce.out",
      }, oldMesh ? fadeInDelay : 0);
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), { opacity: 1, duration: scaleInDuration * 0.5 }, oldMesh ? fadeInDelay : 0);
    }
  }

  animateSlideFade(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onComplete) {
    // Set initial state for new mesh
    newMainMesh.position.x = -2; // Start from left, slightly off-center
    this._setMaterialsAlpha(newMainMesh, 0); // Start transparent
    if (newMirroredMesh) {
      newMirroredMesh.position.x = -2;
      this._setMaterialsAlpha(newMirroredMesh, 0);
    }

    const slideDuration = 0.36;
    const fadeDuration = 0.34;
    const delayBeforeNew = 0.05;

    let timelineOnComplete = onComplete;
    this._currentTextAnimationTimeline = gsap.timeline({ onComplete: timelineOnComplete });

    if (oldMesh) {
      this._currentTextAnimationTimeline.to(oldMesh.position, {
        x: 2, // Slide old mesh right
        duration: slideDuration,
        ease: "power1.in",
      });
      this._currentTextAnimationTimeline.to(this._getMaterials(oldMesh), { opacity: 0, duration: fadeDuration, ease: "power2.in" }, 0);
      if (oldMirroredMesh) {
        this._currentTextAnimationTimeline.to(oldMirroredMesh.position, {
          x: 2,
          duration: slideDuration,
          ease: "power1.in",
        }, 0);
        this._currentTextAnimationTimeline.to(this._getMaterials(oldMirroredMesh), { opacity: 0, duration: fadeDuration, ease: "power2.in" }, 0);
      }
    }

    this._currentTextAnimationTimeline.to(newMainMesh.position, {
      x: newMainMesh.geometry.boundingBox.min.x * -0.5, // Slide to center
      duration: slideDuration,
      ease: "power3.out",
    }, oldMesh ? slideDuration - delayBeforeNew : 0); // Start new one shortly before old one finishes
    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), { opacity: 1, duration: fadeDuration, ease: "power2.out" }, oldMesh ? slideDuration - delayBeforeNew : 0);

    if (newMirroredMesh) {
      this._currentTextAnimationTimeline.to(newMirroredMesh.position, {
        x: newMirroredMesh.geometry.boundingBox.min.x * -0.5,
        duration: slideDuration,
        ease: "power3.out",
      }, oldMesh ? slideDuration - delayBeforeNew : 0);
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), { opacity: 1, duration: fadeDuration, ease: "power2.out" }, oldMesh ? slideDuration - delayBeforeNew : 0);
    }
  }

  animateLiquidify(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onComplete) {
    // Set initial state for new mesh
    this._setMaterialsAlpha(newMainMesh, 0); // New mesh starts transparent
    if (newMirroredMesh) this._setMaterialsAlpha(newMirroredMesh, 0);

    const totalDuration = 1.2;

    let timelineOnComplete = () => {
      // After particle animation completes, then perform the swap
      if (this._currentAnimationUpdateFn) {
        gsap.ticker.remove(this._currentAnimationUpdateFn);
        this._currentAnimationUpdateFn = null;
      }
      onComplete(); // Call the passed onComplete
    };

    this._currentTextAnimationTimeline = gsap.timeline({
      onComplete: timelineOnComplete
    });

    if (oldMesh) {
      // Ensure the old mesh is non-indexed for vertex manipulation
      const nonIndexedOldMesh = oldMesh.geometry.index ? oldMesh.geometry.toNonIndexed() : oldMesh.geometry.clone();
      oldMesh.geometry = nonIndexedOldMesh;
      const geo = oldMesh.geometry;
      const posAttr = geo.attributes.position;
      posAttr.setUsage(THREE.DynamicDrawUsage);
      const base = posAttr.array.slice(); // Store base positions
      geo.computeBoundingBox();
      const bbox = geo.boundingBox;
      const minY = bbox.min.y;
      const maxY = bbox.max.y;
      const count = posAttr.count;
      const seeds = new Float32Array(count);
      for (let i = 0; i < count; i++) seeds[i] = Math.random();
      const floorY = this.hover; // Assuming hover is the ground level

      const tStart = performance.now();
      const liquidifyEase = (p) => p * p * p; // Cubic ease for melting effect

      this._currentAnimationUpdateFn = () => {
        const elapsed = (performance.now() - tStart) / 1000;
        const pGlobal = THREE.MathUtils.clamp(elapsed / totalDuration, 0, 1);
        const arr = posAttr.array;

        for (let i = 0; i < count; i++) {
          const i3 = i * 3;
          const bx = base[i3], by = base[i3 + 1], bz = base[i3 + 2];

          const heightT = (by - minY) / Math.max(1e-6, (maxY - minY));
          const delay = heightT * 0.25;
          const p = THREE.MathUtils.clamp((elapsed - delay) / (totalDuration - delay), 0, 1);
          const melt = liquidifyEase(p);
          const s = seeds[i];

          const wobbleAmp = (1 - melt) * 0.06;
          const wobbleX = wobbleAmp * Math.sin(s * 12.7 + elapsed * 8.0);
          const wobbleZ = wobbleAmp * Math.cos(s * 15.9 + elapsed * 6.8);
          const wobbleY = (1 - melt) * 0.04 * Math.sin(s * 9.1 + elapsed * 11.0);

          arr[i3 + 0] = bx + wobbleX;
          arr[i3 + 1] = THREE.MathUtils.lerp(by, floorY, melt) + wobbleY;
          arr[i3 + 2] = bz + wobbleZ;
        }

        posAttr.needsUpdate = true;
        geo.computeVertexNormals();

        if (pGlobal >= 1) {
          gsap.ticker.remove(this._currentAnimationUpdateFn);
          this._currentAnimationUpdateFn = null;
        }
      };
      gsap.ticker.add(this._currentAnimationUpdateFn);

      this._currentTextAnimationTimeline.to(this._getMaterials(oldMesh), {
        opacity: 0,
        duration: totalDuration * 0.88,
        ease: "power2.in"
      });
      if (oldMirroredMesh) {
        this._currentTextAnimationTimeline.to(this._getMaterials(oldMirroredMesh), {
          opacity: 0,
          duration: totalDuration * 0.88,
          ease: "power2.in"
        }, 0);
      }
    }

    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), {
      opacity: 1,
      duration: 0.45,
      ease: "power2.out",
    }, oldMesh ? totalDuration * 0.7 : 0);
    if (newMirroredMesh) {
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), {
        opacity: 1,
        duration: 0.45,
        ease: "power2.out",
      }, oldMesh ? totalDuration * 0.7 : 0);
    }
  }

  animateShatter(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onComplete) {
    // Set initial state for new mesh
    this._setMaterialsAlpha(newMainMesh, 0); // New mesh starts transparent
    if (newMirroredMesh) this._setMaterialsAlpha(newMirroredMesh, 0);

    const duration = 0.9;
    const strength = 1.2;

    let timelineOnComplete = () => {
      if (this._currentAnimationUpdateFn) {
        gsap.ticker.remove(this._currentAnimationUpdateFn);
        this._currentAnimationUpdateFn = null;
      }
      onComplete(); // Call the passed onComplete
    };

    this._currentTextAnimationTimeline = gsap.timeline({
      onComplete: timelineOnComplete
    });

    if (oldMesh) {
      const nonIndexedOldMesh = oldMesh.geometry.index ? oldMesh.geometry.toNonIndexed() : oldMesh.geometry.clone();
      oldMesh.geometry = nonIndexedOldMesh;
      const geo = oldMesh.geometry;
      const posAttr = geo.attributes.position;
      posAttr.setUsage(THREE.DynamicDrawUsage);
      const base = posAttr.array.slice();
      const count = posAttr.count;
      const center = new THREE.Vector3();
      geo.computeBoundingBox();
      geo.boundingBox.getCenter(center);

      const tStart = performance.now();
      const shatterEase = (p) => 1 - Math.pow(1 - p, 3); // Cubic ease out

      this._currentAnimationUpdateFn = () => {
        const elapsed = (performance.now() - tStart) / 1000;
        const p = THREE.MathUtils.clamp(elapsed / duration, 0, 1);
        const e = shatterEase(p);
        const arr = posAttr.array;

        for (let i = 0; i < count; i++) {
          const i3 = i * 3;
          const bx = base[i3], by = base[i3 + 1], bz = base[i3 + 2];
          const dirX = bx - center.x;
          const dirY = by - center.y;
          const dirZ = bz - center.z;
          const dist = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
          const normFactor = dist > 0 ? 1 / dist : 0;

          arr[i3 + 0] = bx + (dirX * normFactor * (e * strength));
          arr[i3 + 1] = by + (dirY * normFactor * (e * strength));
          arr[i3 + 2] = bz + (dirZ * normFactor * (e * strength));
        }

        posAttr.needsUpdate = true;
        geo.computeVertexNormals();

        if (p >= 1) {
          gsap.ticker.remove(this._currentAnimationUpdateFn);
          this._currentAnimationUpdateFn = null;
        }
      };
      gsap.ticker.add(this._currentAnimationUpdateFn);

      this._currentTextAnimationTimeline.to(this._getMaterials(oldMesh), { opacity: 0, duration: duration, ease: "power2.in" });
      this._currentTextAnimationTimeline.to(oldMesh.rotation, { x: "+=0.22", y: "+=0.32", z: "+=0.12", duration: duration, ease: "power2.inOut" }, 0);
      if (oldMirroredMesh) {
        this._currentTextAnimationTimeline.to(this._getMaterials(oldMirroredMesh), { opacity: 0, duration: duration, ease: "power2.in" }, 0);
        this._currentTextAnimationTimeline.to(oldMirroredMesh.rotation, { x: "+=0.22", y: "+=0.32", z: "+=0.12", duration: duration, ease: "power2.inOut" }, 0);
      }
    }

    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), {
      opacity: 1,
      duration: 0.5,
      ease: "power2.out",
    }, oldMesh ? duration * 0.7 : 0);
    if (newMirroredMesh) {
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), {
        opacity: 1,
        duration: 0.5,
        ease: "power2.out",
      }, oldMesh ? duration * 0.7 : 0);
    }
  }

  animateRipInHalfBlood(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onComplete) {
    // Set initial state for new mesh
    this._setMaterialsAlpha(newMainMesh, 0); // New mesh starts transparent
    if (newMirroredMesh) this._setMaterialsAlpha(newMirroredMesh, 0);

    const fountainParams = {
      fountainHeight: 3.0,
      fountainSpread: 0.9,
      particleCount: 800,
      particleSize: 0.08,
      particleLifeMin: 1.2,
      particleLifeMax: 2.2,
      gravity: 9.8,
      initialSpeedBase: 3.0,
      initialSpeedVar: 2.4,
      airDrag: 0.9,
      bloodColor: 0x7a0000,
      groundY: this.hover - 0.02,
      splashChance: 0.25,
      splashScale: 0.12
    };

    const tStartAnim = performance.now();
    let lastTime = tStartAnim;

    let timelineOnComplete = () => {
      // Ensure all particle systems are cleaned up first before swapping
      this.group.children = this.group.children.filter(child => {
        if (child.isPoints && child.name === 'bloodParticles') {
          this._disposeMesh(child);
          return false;
        }
        if (child.name === 'ripLeftHalf' || child.name === 'ripRightHalf') {
          this._disposeMesh(child);
          return false;
        }
        return true;
      });
      if (this._currentAnimationUpdateFn) {
        gsap.ticker.remove(this._currentAnimationUpdateFn);
        this._currentAnimationUpdateFn = null;
      }
      onComplete(); // Call the passed onComplete
    };

    this._currentTextAnimationTimeline = gsap.timeline({
      onComplete: timelineOnComplete
    });

    if (oldMesh) {
      const originalOldMesh = oldMesh; // Keep reference to original for disposal
      const originalOldMirroredMesh = oldMirroredMesh;

      // Ensure the old mesh is non-indexed for vertex manipulation
      const source = originalOldMesh.geometry.index ? originalOldMesh.geometry.toNonIndexed() : originalOldMesh.geometry.clone();
      const srcPos = source.getAttribute('position');
      source.computeBoundingBox();
      const bbox = source.boundingBox;
      const midX = (bbox.min.x + bbox.max.x) * 0.5;
      const baseY = bbox.min.y;

      const leftArr = [], rightArr = [];
      const triCount = srcPos.count / 3;

      for (let t = 0; t < triCount; t++) {
        const i0 = t * 3, i1 = t * 3 + 1, i2 = t * 3 + 2;
        const ax = srcPos.array[i0 * 3 + 0], ay = srcPos.array[i0 * 3 + 1], az = srcPos.array[i0 * 3 + 2];
        const bx = srcPos.array[i1 * 3 + 0], by = srcPos.array[i1 * 3 + 1], bz = srcPos.array[i1 * 3 + 2];
        const cx = srcPos.array[i2 * 3 + 0], cy = srcPos.array[i2 * 3 + 1], cz = srcPos.array[i2 * 3 + 2];

        const cX = (ax + bx + cx) / 3; // Centroid X of the triangle
        const target = (cX < midX) ? leftArr : rightArr;
        target.push(ax, ay, az, bx, by, bz, cx, cy, cz);
      }

      const buildGeo = (arr) => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(arr), 3));
        g.computeVertexNormals();
        return g;
      };

      const leftGeo = buildGeo(leftArr.length ? leftArr : []);
      const rightGeo = buildGeo(rightArr.length ? rightArr : []);

      const leftMats = this._getMaterials(originalOldMesh).map(m => m.clone());
      const rightMats = this._getMaterials(originalOldMesh).map(m => m.clone());

      const leftMesh = new THREE.Mesh(leftGeo, leftMats);
      const rightMesh = new THREE.Mesh(rightGeo, rightMats);
      leftMesh.name = 'ripLeftHalf';
      rightMesh.name = 'ripRightHalf';

      leftMesh.position.copy(originalOldMesh.position);
      leftMesh.rotation.copy(originalOldMesh.rotation);
      leftMesh.scale.copy(originalOldMesh.scale);
      rightMesh.position.copy(originalOldMesh.position);
      rightMesh.rotation.copy(originalOldMesh.rotation);
      rightMesh.scale.copy(originalOldMesh.scale);

      this.group.add(leftMesh);
      this.group.add(rightMesh);

      originalOldMesh.visible = false; // Hide the original mesh
      if (originalOldMirroredMesh) originalOldMirroredMesh.visible = false;

      // Particle system for blood spill
      const midZLocal = (bbox.min.z + bbox.max.z) * 0.5; // Z-coordinate of the center of the bounding box

      const particleCount = fountainParams.particleCount;
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(particleCount * 3);
      const pVel = new Float32Array(particleCount * 3);
      const pSize = new Float32Array(particleCount);
      const pLife = new Float32Array(particleCount); // Time To Live
      const pTTL = new Float32Array(particleCount); // Initial Total Life
      const bloodTexture = this._getOrCreateCircleSpriteTexture();
      const seeds = new Float32Array(particleCount);

      for (let i = 0; i < particleCount; i++) {
        seeds[i] = Math.random();
        const i3 = i * 3;
        pPos[i3 + 0] = midX + (Math.random() - 0.5) * (bbox.max.x - bbox.min.x) * 0.06;
        pPos[i3 + 1] = baseY + (Math.random() * 0.03);
        pPos[i3 + 2] = midZLocal + (Math.random() - 0.5) * (bbox.max.z - bbox.min.z) * 0.12;

        const upwardBias = 0.6 + Math.random() * 0.4;
        const speed = fountainParams.initialSpeedBase + Math.random() * fountainParams.initialSpeedVar;
        const theta = (Math.random() * Math.PI * 2);
        const spread = fountainParams.fountainSpread * (0.3 + Math.random() * 0.8);

        pVel[i3 + 0] = Math.cos(theta) * spread * speed * (0.3 + Math.random() * 0.8);
        pVel[i3 + 1] = speed * upwardBias;
        pVel[i3 + 2] = Math.sin(theta) * spread * speed * (0.3 + Math.random() * 0.8);

        const life = THREE.MathUtils.lerp(fountainParams.particleLifeMin, fountainParams.particleLifeMax, Math.random());
        pLife[i] = life;
        pTTL[i] = life;
        pSize[i] = THREE.MathUtils.lerp(fountainParams.particleSize * 0.4, fountainParams.particleSize * 1.6, Math.random());
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      pGeo.setAttribute('velocity', new THREE.BufferAttribute(pVel, 3));
      pGeo.setAttribute('size', new THREE.BufferAttribute(pSize, 1));
      pGeo.setAttribute('life', new THREE.BufferAttribute(pLife, 1));

      const pMat = new THREE.PointsMaterial({
        map: bloodTexture,
        color: fountainParams.bloodColor,
        size: fountainParams.particleSize,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.98,
        depthWrite: false,
        alphaTest: 0.01,
      });
      const particles = new THREE.Points(pGeo, pMat);
      particles.name = 'bloodParticles'; // Assign a name for easier cleanup
      particles.position.copy(originalOldMesh.position);
      particles.rotation.copy(originalOldMesh.rotation);
      particles.scale.copy(originalOldMesh.scale);
      this.group.add(particles);


      // Animate the two text halves splitting apart
      const splitDist = Math.max(0.9, (bbox.max.x - bbox.min.x) * 0.35);
      this._currentTextAnimationTimeline.to(leftMesh.position, { x: leftMesh.position.x - splitDist, y: leftMesh.position.y - 0.12, duration: 0.66, ease: "power2.out" });
      this._currentTextAnimationTimeline.to(rightMesh.position, { x: rightMesh.position.x + splitDist, y: rightMesh.position.y - 0.12, duration: 0.66, ease: "power2.out", delay: 0.06 });
      this._currentTextAnimationTimeline.to(leftMesh.rotation, { z: "-=0.34", y: "-=0.12", duration: 0.66, ease: "power2.out" }, 0);
      this._currentTextAnimationTimeline.to(rightMesh.rotation, { z: "+=0.34", y: "+=0.14", duration: 0.66, ease: "power2.out" }, 0);

      // Fade out old materials
      this._currentTextAnimationTimeline.to(leftMats, { opacity: 0, duration: 0.9, delay: 0.12, ease: "power2.in" }, 0);
      this._currentTextAnimationTimeline.to(rightMats, { opacity: 0, duration: 0.9, delay: 0.12, ease: "power2.in" }, 0);

      const createSplash = (worldX, worldY, worldZ, scale) => {
        const cvsTex = bloodTexture;
        const splashMat = new THREE.SpriteMaterial({ map: cvsTex, color: fountainParams.bloodColor, sizeAttenuation: true, transparent: true, opacity: 0.85, depthWrite: false });
        const sprite = new THREE.Sprite(splashMat);
        sprite.scale.set(scale, scale, 1);
        sprite.position.set(worldX, worldY + 0.001, worldZ);
        this.group.add(sprite);

        gsap.to(splashMat, {
          opacity: 0, duration: 1.0, delay: 0.05, ease: "power2.out", onComplete: () => {
            try { this.group.remove(sprite); } catch (e) { /* ignore */ }
            try { splashMat.map && splashMat.map.dispose(); } catch (e) { /* ignore */ }
            try { splashMat.dispose(); } catch (e) { /* ignore */ }
          }
        });
      };

      this._currentAnimationUpdateFn = () => {
        const currentTime = performance.now();
        const delta = Math.min(0.05, (currentTime - lastTime) / 1000);
        lastTime = currentTime;

        const posAttr = pGeo.attributes.position;
        const velAttr = pGeo.attributes.velocity;
        const sizeAttr = pGeo.attributes.size;
        const lifeAttr = pGeo.attributes.life;

        const posArr = posAttr.array;
        const velArr = velAttr.array;
        const sizeArr = sizeAttr.array;
        const lifeArr = lifeAttr.array;

        let anyAlive = false;

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          let life = lifeArr[i];
          const lifeNorm = pTTL[i] > 0 ? life / pTTL[i] : 0;

          if (life > 0) {
            anyAlive = true;

            velArr[i3 + 0] *= Math.pow(fountainParams.airDrag, delta);
            velArr[i3 + 2] *= Math.pow(fountainParams.airDrag, delta);
            velArr[i3 + 1] -= fountainParams.gravity * delta; // Apply gravity

            const s = seeds[i];
            velArr[i3 + 0] += (Math.sin((tStartAnim + i) * 0.0001 + s * 12.3) * 0.002) * (1 - lifeNorm);
            velArr[i3 + 2] += (Math.cos((tStartAnim + i) * 0.00013 + s * 9.7) * 0.002) * (1 - lifeNorm);

            posArr[i3 + 0] += velArr[i3 + 0] * delta;
            posArr[i3 + 1] += velArr[i3 + 1] * delta;
            posArr[i3 + 2] += velArr[i3 + 2] * delta;

            life -= delta;
            lifeArr[i] = life;
            sizeArr[i] = pSize[i] * (0.5 + lifeNorm * 0.5);

            const worldY = posArr[i3 + 1];
            if (worldY <= fountainParams.groundY && life > -0.5) {
              lifeArr[i] = -1.0;
              if (Math.random() < fountainParams.splashChance) {
                createSplash(
                  posArr[i3 + 0] + particles.position.x,
                  fountainParams.groundY + particles.position.y,
                  posArr[i3 + 2] + particles.position.z,
                  fountainParams.splashScale * (0.7 + Math.random() * 0.6)
                );
              }
              posArr[i3 + 0] = posArr[i3 + 1] = posArr[i3 + 2] = -1000; // Hide dead particles
            }
          }
        }

        posAttr.needsUpdate = true;
        velAttr.needsUpdate = true;
        sizeAttr.needsUpdate = true;
        lifeAttr.needsUpdate = true;

        let sumLife = 0, aliveCount = 0;
        for (let i = 0; i < particleCount; i++) {
          if (lifeArr[i] > 0) {
            sumLife += lifeArr[i];
            aliveCount++;
          }
        }
        const avgLifeRatio = aliveCount ? (sumLife / aliveCount / (pTTL[0] || 1)) : 0;
        particles.material.opacity = THREE.MathUtils.clamp(avgLifeRatio * 1.2, 0, 0.98);

        if (!anyAlive && particles.material.opacity <= 0.01) {
          gsap.ticker.remove(this._currentAnimationUpdateFn);
          this._currentAnimationUpdateFn = null;
        }
      };
      gsap.ticker.add(this._currentAnimationUpdateFn);
    }

    // Fade in new mesh
    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), {
      opacity: 1,
      duration: 0.55,
      ease: "power2.out",
    }, oldMesh ? 0.5 : 0); // Delay for new mesh to appear
    if (newMirroredMesh) {
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), {
        opacity: 1,
        duration: 0.55,
        ease: "power2.out",
      }, oldMesh ? 0.5 : 0);
    }
  }

  animatePunched(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onComplete) {
    // Set initial state for new mesh
    newMainMesh.scale.set(1.6, 0.2, 1.6); // Start new mesh for elastic effect
    this._setMaterialsAlpha(newMainMesh, 0);
    if (newMirroredMesh) {
      newMirroredMesh.scale.set(1.6, 0.2, 1.6);
      this._setMaterialsAlpha(newMirroredMesh, 0);
    }

    const punchOutDuration = 0.2;
    const punchInDuration = 1.6;

    let timelineOnComplete = onComplete;
    this._currentTextAnimationTimeline = gsap.timeline({ onComplete: timelineOnComplete });

    if (oldMesh) {
      this._currentTextAnimationTimeline.to(oldMesh.scale, {
        x: 1.4, y: 0.1, z: 1.4,
        duration: punchOutDuration,
        ease: "power2.in",
      });
      this._currentTextAnimationTimeline.to(this._getMaterials(oldMesh), { opacity: 0, duration: punchOutDuration, ease: "power1.in" }, 0);
      if (oldMirroredMesh) {
        this._currentTextAnimationTimeline.to(oldMirroredMesh.scale, {
          x: 1.4, y: 0.1, z: 1.4,
          duration: punchOutDuration,
          ease: "power2.in",
        }, 0);
        this._currentTextAnimationTimeline.to(this._getMaterials(oldMirroredMesh), { opacity: 0, duration: punchOutDuration, ease: "power1.in" }, 0);
      }
    }

    this._currentTextAnimationTimeline.fromTo(newMainMesh.scale, { x: 1.6, y: 0.2, z: 1.6 }, { x: 1, y: 1, z: 1, duration: punchInDuration, ease: "elastic.out(1,0.4)" }, oldMesh ? punchOutDuration * 0.5 : 0); // Start new one before old one finishes
    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), { opacity: 1, duration: punchInDuration * 0.2 }, oldMesh ? punchOutDuration * 0.5 : 0);

    if (newMirroredMesh) {
      this._currentTextAnimationTimeline.fromTo(newMirroredMesh.scale, { x: 1.6, y: 0.2, z: 1.6 }, { x: 1, y: 1, z: 1, duration: punchInDuration, ease: "elastic.out(1,0.4)" }, oldMesh ? punchOutDuration * 0.5 : 0);
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), { opacity: 1, duration: punchInDuration * 0.2 }, oldMesh ? punchOutDuration * 0.5 : 0);
    }
  }

  animateSupernova(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onComplete) {
    // Set initial state for new mesh
    this._setMaterialsAlpha(newMainMesh, 0); // New mesh starts very small
    if (newMirroredMesh) this._setMaterialsAlpha(newMirroredMesh, 0);

    const explodeDuration = 0.5;
    const implodeDuration = 0.8;
    const delayBeforeNew = explodeDuration * 0.5;

    let timelineOnComplete = onComplete;
    this._currentTextAnimationTimeline = gsap.timeline({ onComplete: timelineOnComplete });

    if (oldMesh) {
      this._currentTextAnimationTimeline.to(oldMesh.scale, {
        x: 4, y: 4, z: 4,
        duration: explodeDuration,
        ease: "power3.out",
      });
      this._currentTextAnimationTimeline.to(this._getMaterials(oldMesh), { opacity: 0, duration: explodeDuration, ease: "power2.in" }, 0);
      if (oldMirroredMesh) {
        this._currentTextAnimationTimeline.to(oldMirroredMesh.scale, {
          x: 4, y: 4, z: 4,
          duration: explodeDuration,
          ease: "power3.out",
        }, 0);
        this._currentTextAnimationTimeline.to(this._getMaterials(oldMirroredMesh), { opacity: 0, duration: explodeDuration, ease: "power2.in" }, 0);
      }
    }

    this._currentTextAnimationTimeline.fromTo(newMainMesh.scale, { x: 0.2, y: 0.2, z: 0.2 }, { x: 1, y: 1, z: 1, duration: implodeDuration, ease: "elastic.out(1,0.5)" }, oldMesh ? delayBeforeNew : 0);
    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), { opacity: 1, duration: implodeDuration * 0.5 }, oldMesh ? delayBeforeNew : 0);

    if (newMirroredMesh) {
      this._currentTextAnimationTimeline.fromTo(newMirroredMesh.scale, { x: 0.2, y: 0.2, z: 0.2 }, { x: 1, y: 1, z: 1, duration: implodeDuration, ease: "elastic.out(1,0.5)" }, oldMesh ? delayBeforeNew : 0);
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), { opacity: 1, duration: implodeDuration * 0.5 }, oldMesh ? delayBeforeNew : 0);
    }
  }

  animateClothRip(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onComplete) {
    // Set initial state for new mesh
    this._setMaterialsAlpha(newMainMesh, 0); // New mesh starts transparent
    if (newMirroredMesh) this._setMaterialsAlpha(newMirroredMesh, 0);

    const total = 1.4; // Total animation duration

    let timelineOnComplete = () => {
      if (this._currentAnimationUpdateFn) {
        gsap.ticker.remove(this._currentAnimationUpdateFn);
        this._currentAnimationUpdateFn = null;
      }
      onComplete(); // Call the passed onComplete
    };

    this._currentTextAnimationTimeline = gsap.timeline({
      onComplete: timelineOnComplete
    });

    if (oldMesh) {
      // Ensure the old mesh is non-indexed for vertex manipulation
      const nonIndexedOldMesh = oldMesh.geometry.index ? oldMesh.geometry.toNonIndexed() : oldMesh.geometry.clone();
      oldMesh.geometry = nonIndexedOldMesh;
      const posAttr = oldMesh.geometry.attributes.position;
      posAttr.setUsage(THREE.DynamicDrawUsage);
      const base = posAttr.array.slice(); // Store base positions
      const count = posAttr.count;

      const tStart = performance.now();
      let ticks = 0;

      this._currentAnimationUpdateFn = () => {
        const elapsed = (performance.now() - tStart) / 1000;
        const p = THREE.MathUtils.clamp(elapsed / total, 0, 1);
        const arr = posAttr.array;

        for (let i = 0; i < count; i++) {
          const i3 = i * 3;
          const x = base[i3], y = base[i3 + 1], z = base[i3 + 2];
          const side = x < 0 ? -1 : 1;
          const wave = Math.sin(y * 10 + elapsed * 12) * 0.05 * (1 - p);

          arr[i3] = x + side * p * 0.5 + wave;
          arr[i3 + 1] = y - p * 0.3;
          arr[i3 + 2] = z;
        }

        posAttr.needsUpdate = true;
        if ((ticks++ & 2) === 0) oldMesh.geometry.computeVertexNormals();

        if (p >= 1) {
          gsap.ticker.remove(this._currentAnimationUpdateFn);
          this._currentAnimationUpdateFn = null;
        }
      };
      gsap.ticker.add(this._currentAnimationUpdateFn);

      this._currentTextAnimationTimeline.to(this._getMaterials(oldMesh), { opacity: 0, duration: total * 0.9, ease: "power2.in" });
      if (oldMirroredMesh) {
        this._currentTextAnimationTimeline.to(this._getMaterials(oldMirroredMesh), { opacity: 0, duration: total * 0.9, ease: "power2.in" }, 0);
      }
    }

    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), { opacity: 1, duration: 0.6, ease: "power2.out" }, oldMesh ? total * 0.6 : 0);
    if (newMirroredMesh) {
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), { opacity: 1, duration: 0.6, ease: "power2.out" }, oldMesh ? total * 0.6 : 0);
    }
  }

  animateChewed(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onComplete) {
    // Set initial state for new mesh
    this._setMaterialsAlpha(newMainMesh, 0); // New mesh starts transparent
    if (newMirroredMesh) this._setMaterialsAlpha(newMirroredMesh, 0);

    const total = 1.2;

    let timelineOnComplete = () => {
      if (this._currentAnimationUpdateFn) {
        gsap.ticker.remove(this._currentAnimationUpdateFn);
        this._currentAnimationUpdateFn = null;
      }
      onComplete(); // Call the passed onComplete
    };

    this._currentTextAnimationTimeline = gsap.timeline({
      onComplete: timelineOnComplete
    });

    if (oldMesh) {
      const geo = oldMesh.geometry.index ? oldMesh.geometry.toNonIndexed() : oldMesh.geometry.clone();
      oldMesh.geometry = geo;
      const posAttr = geo.attributes.position;
      posAttr.setUsage(THREE.DynamicDrawUsage);
      const base = posAttr.array.slice();
      const count = posAttr.count;
      const seeds = new Float32Array(count);
      for (let i = 0; i < count; i++) seeds[i] = Math.random();

      const tStart = performance.now();
      let ticks = 0;

      this._currentAnimationUpdateFn = () => {
        const elapsed = (performance.now() - tStart) / 1000;
        const p = THREE.MathUtils.clamp(elapsed / total, 0, 1);
        const arr = posAttr.array;

        for (let i = 0; i < count; i++) {
          const i3 = i * 3;
          const bx = base[i3], by = base[i3 + 1], bz = base[i3 + 2];
          const s = seeds[i];

          arr[i3] = bx + (Math.sin(elapsed * 10 + s * 6) * 0.05 * (1 - p));
          arr[i3 + 1] = by + (Math.cos(elapsed * 12 + s * 8) * 0.05 * (1 - p));
          arr[i3 + 2] = bz + (Math.sin(elapsed * 14 + s * 10) * 0.05 * (1 - p));
        }

        posAttr.needsUpdate = true;
        if ((ticks++ & 1) === 0) geo.computeVertexNormals();

        if (p >= 1) {
          gsap.ticker.remove(this._currentAnimationUpdateFn);
          this._currentAnimationUpdateFn = null;
        }
      };
      gsap.ticker.add(this._currentAnimationUpdateFn);

      this._currentTextAnimationTimeline.to(this._getMaterials(oldMesh), { opacity: 0, duration: total, ease: "power2.in" });
      if (oldMirroredMesh) {
        this._currentTextAnimationTimeline.to(this._getMaterials(oldMirroredMesh), { opacity: 0, duration: total, ease: "power2.in" }, 0);
      }
    }

    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), { opacity: 1, duration: 0.5, ease: "power2.out" }, oldMesh ? total * 0.6 : 0);
    if (newMirroredMesh) {
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), { opacity: 1, duration: 0.5, ease: "power2.out" }, oldMesh ? total * 0.6 : 0);
    }
  }

  animateBigCrunch(oldMesh, newMainMesh, oldMirroredMesh, newMirroredMesh, onComplete) {
    // Set initial state for new mesh
    this._setMaterialsAlpha(newMainMesh, 0); // New mesh starts transparent
    if (newMirroredMesh) this._setMaterialsAlpha(newMirroredMesh, 0);

    const total = 1.0;

    let timelineOnComplete = onComplete;
    this._currentTextAnimationTimeline = gsap.timeline({ onComplete: timelineOnComplete });

    if (oldMesh) {
      const geo = oldMesh.geometry.index ? oldMesh.geometry.toNonIndexed() : oldMesh.geometry.clone();
      oldMesh.geometry = geo;
      const posAttr = geo.attributes.position;
      posAttr.setUsage(THREE.DynamicDrawUsage);
      const base = posAttr.array.slice();
      const count = posAttr.count;
      const center = new THREE.Vector3();
      geo.computeBoundingBox();
      geo.boundingBox.getCenter(center);

      const tStart = performance.now();
      const crunchEase = (p) => p * p; // Ease in for crunch effect
      let ticks = 0;

      this._currentAnimationUpdateFn = () => {
        const elapsed = (performance.now() - tStart) / 1000;
        const p = THREE.MathUtils.clamp(elapsed / total, 0, 1);
        const e = crunchEase(p);
        const arr = posAttr.array;

        for (let i = 0; i < count; i++) {
          const i3 = i * 3;
          const bx = base[i3], by = base[i3 + 1], bz = base[i3 + 2];
          arr[i3] = THREE.MathUtils.lerp(bx, center.x, e);
          arr[i3 + 1] = THREE.MathUtils.lerp(by, center.y, e);
          arr[i3 + 2] = THREE.MathUtils.lerp(bz, center.z, e);
        }

        posAttr.needsUpdate = true;
        if ((ticks++ & 1) === 0) geo.computeVertexNormals();

        if (p >= 1) {
          gsap.ticker.remove(this._currentAnimationUpdateFn);
          this._currentAnimationUpdateFn = null;
        }
      };
      gsap.ticker.add(this._currentAnimationUpdateFn);

      this._currentTextAnimationTimeline.to(this._getMaterials(oldMesh), { opacity: 0, duration: total, ease: "power2.in" });
      if (oldMirroredMesh) {
        this._currentTextAnimationTimeline.to(this._getMaterials(oldMirroredMesh), { opacity: 0, duration: total, ease: "power2.in" }, 0);
      }
    }

    this._currentTextAnimationTimeline.to(this._getMaterials(newMainMesh), { opacity: 1, duration: 0.5, ease: "power2.out" }, oldMesh ? total * 0.5 : 0);
    if (newMirroredMesh) {
      this._currentTextAnimationTimeline.to(this._getMaterials(newMirroredMesh), { opacity: 1, duration: 0.5, ease: "power2.out" }, oldMesh ? total * 0.5 : 0);
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