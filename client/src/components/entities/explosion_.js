import * as THREE from 'three'
import gsap from 'gsap'
// import vertex from './glsl/vertex.glsl'
// import fragment from './glsl/fragment.glsl'
import Renderer from '../Renderer'
import handleSend from "./WordGen";

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

export default class Explosion extends THREE.Object3D {
  constructor() {
    super()
    this.name = 'Explosion'
    this.time = 0
    this.properties = {
      startColor: 0xff00ff,
      endColor: 0x00ffff,
      autoMix: true,
      autoRotate: true,
    }


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

    this.modelInstance=null
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
    // this.WordChange()
    this.resetMesh()
  }

  createBoxMesh2() {
    this.model1.then(gltf => {
        const letterSpacing = 1.0; // Adjust this value as needed for your models' scale
          const templateObjects = findObjectsByNamePattern(gltf.scene, "Animated_Super_Explosion");
          if (!templateObjects || templateObjects.length === 0) {
          }
          const template = templateObjects[0];
          // console.log(template);
          const clonedModel = cloneAnimatedModel({ scene: template, animations: gltf.animations });
          this.modelInstance = clonedModel.scene;
          this.modelInstance.scale.set(3, 3, 3);
          clonedModel.animations.forEach(clip=>{
            if (clip) {
            const meshMixer = new THREE.AnimationMixer(this.modelInstance);
            meshMixer.clipAction(clip).play();
            this.meshMixers.push(meshMixer);
          }
        });
          this.holderObjects.add(this.modelInstance);
    });
        this.clock1 = new THREE.Clock()
}

  onBPMBeat() {
    // Calculate a reduced duration based on the BPM (beats per minute) duration
    const duration = Renderer.bpmManager.getBPMDuration() / 1000
    this.beatcount++
    // if (this.beatcount%4 ===0){this.WordChange()}
    
    if (App.audioManager.isPlaying) {
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

      
      // if (this.index_par>this.list_of_a_s_.length-1){
      //   this.index_par=0;
      // }

      this.createBoxMesh2()
      // this.index_par++;


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

      const someshit = this.modelInstance.getObjectByName( 'Fire_Ball' );
      console.log(someshit.morphTargetDictionary);
      console.log(someshit.morphTargetInfluences);
      console.log(someshit.morphTargetDictionary['Displace'])
      console.log("________________________________________")
      const deltaTime = this.clock.getDelta();
      // Animate the 'Displace' morph influence on 'someshit'
      const influenceIndex = someshit.morphTargetDictionary['Displace'];
      if (influenceIndex !== undefined) {
          // Example: oscillate influence between 0 and 1 with sine wave
          const time = this.clock1.elapsedTime;
          someshit.morphTargetInfluences[influenceIndex] = -.5 + .175 * Math.sin(time);
      }

        // in update loop
        for (const m of this.meshMixers) {
          m.update(deltaTime);
        }
        // this.meshMixers = [];
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