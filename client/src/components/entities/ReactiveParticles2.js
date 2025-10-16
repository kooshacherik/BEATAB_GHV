import * as THREE from 'three'
import gsap from 'gsap'
// import vertex from './glsl/vertex.glsl'
// import fragment from './glsl/fragment.glsl'
import Renderer from '../Renderer'
import handleSend from "./WordGen";

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

export default class ReactiveParticles2 extends THREE.Object3D {
  constructor() {
    super()
    this.name = 'ReactiveParticles2'
    this.time = 0
    this.properties = {
      startColor: 0xff00ff,
      endColor: 0x00ffff,
      autoMix: true,
      autoRotate: true,
    }

  this.animeDict = {
  "A": "MF_Run.025",
  "B": "MF_Run.026",
  "C": "MF_Run.001",
  "D": "MF_Run.002",
  "E": "MF_Run.003",
  "F": "MF_Run.004",
  "G": "MF_Run.005",
  "H": "MF_Run.006",
  "I": "MF_Run.007",
  "J": "MF_Run.008",
  "K": "MF_Run.009",
  "L": "MF_Run.010",
  "M": "MF_Run.011",
  "N": "MF_Run.012",
  "O": "MF_Run.013",
  "P": "MF_Run.014",
  "Q": "MF_Run.015",
  "R": "MF_Run.016",
  "S": "MF_Run.017",
  "T": "MF_Run.018",
  "U": "MF_Run.019",
  "V": "MF_Run.020",
  "W": "MF_Run.021",
  "X": "MF_Run.022",
  "Y": "MF_Run.023",
  "Z": "MF_Run.024"
    };
  }

  loadGLTFModel(url) {
    const loader = new GLTFLoader();
    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (gltf) => resolve(gltf),
        undefined,
        (error) => reject(error)
      );
    });
  }

  init() {
    Renderer.holder.add(this)

    this.holderObjects = new THREE.Object3D()
    this.add(this.holderObjects)

    this.material_custom_box2  = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: false,
      uniforms: {
        time: { value: 0 },
        offsetSize: { value: 2 },
        size: { value: 6.1 },
        frequency: { value: 0 },
        amplitude: { value: 1 },
        offsetGain: { value: 0 },
        maxDistance: { value: 1.8 },
        startColor: { value: new THREE.Color(0x32a852) },
        endColor: { value: new THREE.Color(0x32a852) },
      },
    })
    // Example: change shader to a new color, e.g., green
    this.updateFragmentShader(`
      void main() {
        gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
      }
    `);

    this.model1 =  this.loadGLTFModel('/models/explosion_1.glb')
    this.meshMixers = []; // an array to keep track of mixers per mesh
    this.clock = new THREE.Clock()

    const start = 0;
    const end = -5;
    const numberOfElements = 200;

    this.list_of_a_s_= createEqualDistanceList(start, end, numberOfElements)
    this.index_par =0;

    this.beatcount =0;
    this.wordsLog=[];
    this.addGUI()
    // this.WordChange()
    this.resetMesh()
  }




createWordMesh(customGeometryGenerator) {

    // Default segments for geometry
    const widthSeg = 20;
    const heightSeg = 40;
    const depthSeg = 80;
    
    // Generate geometry using the provided custom generator or default to a box
    this.geometry = customGeometryGenerator 
        ? customGeometryGenerator(widthSeg, heightSeg, depthSeg)
        : new THREE.BoxBufferGeometry(1, 1, 1, widthSeg, heightSeg, depthSeg);

    // Update shader material uniform for offset size with a random value
    this.material_custom_box2.uniforms.offsetSize.value = Math.floor(THREE.MathUtils.randInt(30, 60));
    this.material_custom_box2.needsUpdate = true;

    // Create container for points mesh and apply rotation
    this.pointsMesh = new THREE.Object3D();
    this.pointsMesh.rotateY(Math.PI ); // Rotate for better orientation
    this.holderObjects.add(this.pointsMesh);

    // Create a points mesh with the generated geometry
    const pointsMesh = new THREE.Points(this.geometry, this.material_custom_box2);
    this.pointsMesh.add(pointsMesh);

    // Animate rotation of mesh container
    // gsap.to(this.pointsMesh.rotation, {
    //     duration: 3,
    //     x: Math.random() * Math.PI,
    //     z: Math.random() * Math.PI * 2,
    //     ease: 'none',
    // });

    // Animate position of the object
    gsap.to(this.position, {
        duration: 0.6,
        z: 8,
        ease: 'elastic.out(0.8)',
    });
}
createBoxMesh2() {
    
    // Default segments for geometry
    const widthSeg = 20;
    const heightSeg = 40;
    const depthSeg = 80;
    if (this.geometry) {
      this.geometry={};
      }

    
    const darkLineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    
    // Update shader material uniform for offset size with a random value
    this.material_custom_box2.uniforms.offsetSize.value = Math.floor(THREE.MathUtils.randInt(30, 60));
    this.material_custom_box2.needsUpdate = true;
    if (this.pointsMesh) {
      this.holderObjects.remove(this.pointsMesh);
      this.pointsMesh = null;
    }
    // Create container for points mesh and apply rotation
    this.pointsMesh = new THREE.Object3D();
    // this.pointsMesh.rotateY(Math.PI ); // Rotate for better orientation
    // this.holderObjects.add(this.pointsMesh);


    this.model1.then(gltf => {
      // this.currWord.then(CURRWORD => {
        // console.log(CURRWORD);
        // const upperCaseString =  CURRWORD.toUpperCase();
        // this.wordsLog.push(upperCaseString)

        // const loopRange = upperCaseString.length;//CURRWORD.length;
        // Define spacing between letters
        const letterSpacing = 1.0; // Adjust this value as needed for your models' scale
        // const totalWidth = (loopRange - 1) * letterSpacing;
        // const startX = -totalWidth / 2; // Calculate start position to center the word
        // for (let i = 0; i < loopRange; i++) {
          // const c_letter = upperCaseString[i];
          const templateObjects = findObjectsByNamePattern(gltf.scene, "Animated_Super_Explosion");
          console.log(gltf.scene);
          // console.log(templateObjects);
          if (!templateObjects || templateObjects.length === 0) {
            // console.error(`No objects with pattern 'par_' found in the GLTF scene.`);
            // continue; // Use continue to skip this iteration and not break the whole loop
          }
          const template = templateObjects[0];
          // console.log(template);
          const clonedModel = cloneAnimatedModel({ scene: template, animations: gltf.animations });
          const modelInstance = clonedModel.scene;
          console.log(modelInstance);
          console.log('___________________________________________________');
          // // *** FIX: SET A UNIQUE POSITION FOR EACH CLONED LETTER ***
          // // This will arrange the letters in a line.
          // // modelInstance.position.set(-1*(startX + (i * letterSpacing)), 0, 0);
          // const currClipName = this.animeDict[c_letter];
            modelInstance.scale.set(3, 3, 3);

          clonedModel.animations.forEach(clip=>{
            if (clip) {
            const meshMixer = new THREE.AnimationMixer(modelInstance);
            meshMixer.clipAction(clip).play();
            this.meshMixers.push(meshMixer);
          }
        });
          // const clip = clonedModel.animations[1];
          // if (clip) {
          //   const meshMixer = new THREE.AnimationMixer(modelInstance);
          //   meshMixer.clipAction(clip).play();
          //   this.meshMixers.push(meshMixer);
          // }
          this.holderObjects.add(modelInstance);
        // }
      // });
    });
    // gsap.to(this.position, {
    //     duration: 0.6,
    //     z: 7,
    //     ease: 'elastic.out(0.8)',
    // });

// this.holderObjects.rotation.set(Math.PI,Math.PI,Math.PI);

// this.holderObjects.position.set(0,0,-60);

    // Animate rotation of mesh container
    // gsap.to(this.holderObjects.rotation, {
    //     duration: 3,
    //     x: Math.random() * Math.PI,
    //     z: Math.random() * Math.PI * 2,
    //     ease: 'none',
    // });

    // Animate position of the object
}

  onBPMBeat() {
    // Calculate a reduced duration based on the BPM (beats per minute) duration
    const duration = Renderer.bpmManager.getBPMDuration() / 1000
    this.beatcount++
    // if (this.beatcount%4 ===0){this.WordChange()}
    
    if (Renderer.audioManager.isPlaying) {
      // Randomly determine whether to rotate the holder object
      if (Math.random() < 0.3 && this.properties.autoRotate) {
        gsap.to(this.holderObjects.rotation, {
          // duration: Math.random() < 0.8 ? 15 : duration, // Either a longer or BPM-synced duration
          // y: Math.random() * Math.PI * 2,
          duration:duration, // Either a longer or BPM-synced duration
          y: Math.random() * Math.PI * 2,
          z: Math.random() * Math.PI,
          ease: 'elastic.out(0.2)',
        })
      }

      // Randomly decide whether to reset the mesh  (mesh changing)
      // if (Math.random() < 0.1) {
      // this.resetMesh()
      // }
    }
  }

  resetMesh() {


    // if (this.properties.autoMix) {
      this.destroyMesh()

      
      if (this.index_par>this.list_of_a_s_.length-1){
        this.index_par=0;
      }

      this.createBoxMesh2()
      this.index_par++;

      // Animate the frequency uniform in the material, syncing with BPM if available
      gsap.to(this.material_custom_box2.uniforms.frequency, {
        duration: Renderer.bpmManager ? (Renderer.bpmManager.getBPMDuration() / 1000) * 2 : 2,
        value: THREE.MathUtils.randFloat(0.5, 3), // Random frequency value for dynamic visual changes
        ease: 'expo.easeInOut', // Smooth exponential transition for visual effect
      })
    // }
  }
destroyMesh() {
    // Dispose of all objects held in holderObjects
    while (this.holderObjects.children.length > 0) {
        const object = this.holderObjects.children[0];
        this.holderObjects.remove(object);
        // Clean up geometry, materials, etc., to prevent memory leaks
        object.traverse(node => {
            if (node.isMesh) {
                node.geometry?.dispose();
                node.material?.dispose();
            }
        });
    }
    
    // Stop all animation mixers
    this.meshMixers.forEach(mixer => mixer.stopAllAction());
    this.meshMixers = []; // Now clear the array
    if (this.pointsMesh) {
        this.holderObjects.remove(this.pointsMesh);
        this.pointsMesh.geometry?.dispose();
        this.pointsMesh.material?.dispose();
        this.pointsMesh = null;
    }
}

  // destroyMesh() {
  //   if (this.pointsMesh) {
  //     this.holderObjects.remove(this.pointsMesh)
  //     this.pointsMesh.geometry?.dispose()
  //     this.pointsMesh.material?.dispose()
  //     this.pointsMesh = null
  //   }

  // }
// Insert this method into ReactiveParticles2 class
updateFragmentShader(newFragmentShaderCode) {
  this.material_custom_box2.fragmentShader = newFragmentShaderCode;
  this.material_custom_box2.needsUpdate = true;
}
async randomWord() {
  let list_of_words = [];
  for (let i = 0; i < 1; i++) { // limit to 1 for demo
    
    const result = await handleSend();
    const { word, sims, rhymes } = result;

    const simsStrings = sims.map((item) => item[0]);
    const rhymesStrings = rhymes.length > 0 ? rhymes.map((item) => item[0]) : [];
    const allStrings = [word, ...simsStrings, ...rhymesStrings];

    const randomString = allStrings[Math.floor(Math.random() * allStrings.length)];
    return randomString;
    }
  }
WordChange(){
  this.currWord =  this.randomWord();
}
update() {
    if (Renderer.audioManager?.isPlaying) {
      // Dynamically update amplitude based on the high frequency data from the audio manager
      this.material_custom_box2.uniforms.amplitude.value = 0.8 + THREE.MathUtils.mapLinear(Renderer.audioManager.frequencyData.high, 0, 0.6, -0.1, 0.2)

      // Update offset gain based on the low frequency data for subtle effect changes
      this.material_custom_box2.uniforms.offsetGain.value = Renderer.audioManager.frequencyData.mid * 0.6
      // Map low frequency data to a range and use it to increment the time uniform
      const t = THREE.MathUtils.mapLinear(Renderer.audioManager.frequencyData.low, 0.6, 1, 0.2, 0.5)
      this.time += THREE.MathUtils.clamp(t, 0.2, 0.5) // Clamp the value to ensure it stays within a desired range
      // this.resetMesh()
    } else {
      // Set default values for the uniforms when audio is not playing
    this.material_custom_box2.uniforms.frequency.value = 0.8
      this.material_custom_box2.uniforms.amplitude.value = 1

      this.time += 0.2
    }
    this.material_custom_box2.uniforms.time.value = this.time

    const deltaTime = this.clock.getDelta();


      // in update loop
      for (const m of this.meshMixers) {
        m.update(deltaTime);
      }
      // this.meshMixers = [];
  }
  addGUI() {
    //Add GUI controls
    const gui = Renderer.gui

    const particlesFolder = gui.addFolder('PARTICLES')
    particlesFolder
      .addColor(this.properties, 'startColor')
      .listen()
      .name('Start Color')
      .onChange((e) => {
        this.material_custom_box2.uniforms.startColor.value = new THREE.Color(e)
        
        
      })
    particlesFolder
      .addColor(this.properties, 'endColor')
      .listen()
      .name('End Color')
      .onChange((e) => {
        this.material_custom_box2.uniforms.endColor.value = new THREE.Color(e)
      })

  // ___________________________________________________________________________________________

    const visualizerFolder = gui.addFolder('FIKI')
    visualizerFolder.add(this.properties, 'autoMix').listen().name('Auto Mix')
    visualizerFolder.add(this.properties, 'autoRotate').listen().name('Auto Rotate')

    const buttonShowBox2 = {
      show2Box2: () => {
        this.destroyMesh()
        this.createBoxMesh2()
        this.properties.autoMix = false
      },
    }
    visualizerFolder.add(buttonShowBox2, 'show2Box2').name('Show 2 Box 2')
  // ___________________________________________________________________________________________
    // const wordSFolder = gui.addFolder('Word Setting')
    // wordSFolder.add()

  }

}


function findObjectsByNamePattern(scene, pattern) {
  const matchingObjects = [];

  scene.traverse((object) => {
    // if (object.type === pattern ) {
        if (object ) {
      // object.position.set(0,0,0);
      // object.scale.set(10,10,10);
      matchingObjects.push(object);
    }
  });

  return matchingObjects;
}
function createEqualDistanceList(a, b, n) {
  if (n <= 1) {
    // If only one element, just return the start point
    return [a];
  }

  const step = (b - a) / (n - 1);
  const list = [];

  for (let i = 0; i < n; i++) {
    list.push(a + i * step);
  }

  return list;
}
/**
 * Clones a GLTF model scene while ensuring animations can be controlled independently.
 * @param {object} gltf - The result from a GLTFLoader.load() call.
 * @returns {object} An object containing the cloned scene and its animations.
 */
function cloneAnimatedModel(gltf) {
  const clone = {
    scene: gltf.scene.clone(true),
    animations: gltf.animations,
  };

  // The SkeletonUtils.clone function is the industry standard for this.
  // We will create a simplified version of it here to avoid external dependencies.
  const skinnedMeshes = {};

  gltf.scene.traverse(node => {
    if (node.isSkinnedMesh) {
      skinnedMeshes[node.name] = node;
    }
  });

  const cloneBones = {};
  const cloneSkinnedMeshes = {};

  clone.scene.traverse(node => {
    if (node.isBone) {
      cloneBones[node.name] = node;
    }
    if (node.isSkinnedMesh) {
      cloneSkinnedMeshes[node.name] = node;
    }
  });

  for (let name in skinnedMeshes) {
    const skinnedMesh = skinnedMeshes[name];
    const skeleton = skinnedMesh.skeleton;
    const cloneSkinnedMesh = cloneSkinnedMeshes[name];

    const orderedCloneBones = [];
    for (let i = 0; i < skeleton.bones.length; i++) {
      const cloneBone = cloneBones[skeleton.bones[i].name];
      orderedCloneBones.push(cloneBone);
    }

    cloneSkinnedMesh.bind(
      new THREE.Skeleton(orderedCloneBones, skeleton.boneInverses),
      cloneSkinnedMesh.matrixWorld
    );
  }

  return clone;
}