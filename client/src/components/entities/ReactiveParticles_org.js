import * as THREE from 'three'
import gsap from 'gsap'
import vertex from './glsl/vertex.glsl'
import fragment from './glsl/fragment.glsl'
import App from '../App'
import { useGLTF, useTexture } from "@react-three/drei";


function createCurveGeometry(wSeg, hSeg) {
 // const model = useGLTF('/models/m.glb');
  // const { nodes, materials } = useGLTF("/models/m.glb");
  // console.log(nodes);
 
  // const texture = useTexture("/assets/images/tag_texture.png");
// 1. LineCurve3 (a straight line in 3D)
// const lineCurve = new THREE.LineCurve3(
//   new THREE.Vector3(-1, 0, 0), // start point
//   new THREE.Vector3(1, 0, 0)   // end point
// );
// const linePoints = lineCurve.getPoints(2250);
// const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);

// // 2. QuadraticBezierCurve (quadratic Bezier curve)
// const quadCurve = new THREE.QuadraticBezierCurve(
//   new THREE.Vector2(-1, 0),  // start point
//   new THREE.Vector2(0, 1),   // control point
//   new THREE.Vector2(1, 0)    // end point
// );
// const quadPoints = quadCurve.getPoints(500);
// const quadGeometry = new THREE.BufferGeometry().setFromPoints(quadPoints);

// // 3. CubicBezierCurve (cubic Bezier curve, shown above)
// const cubicCurve = new THREE.CubicBezierCurve(
//   new THREE.Vector2(-1, 0),  // start point
//   new THREE.Vector2(-0.5, 1),// first control point
//   new THREE.Vector2(0.5, -1),// second control point
//   new THREE.Vector2(1, 0)    // end point
// );
// const cubicPoints = cubicCurve.getPoints(50);
// const cubicGeometry = new THREE.BufferGeometry().setFromPoints(cubicPoints);

// // 4. EllipseCurve (ellipse or circle)
// const ellipseCurve = new THREE.EllipseCurve(
//   0, 0,           // ax, ay: Center of the ellipse
//   5, 3,         // xRadius, yRadius
//   0, Math.PI * 2, // Start angle, end angle (full circle)
//   false,        // Clockwise
//   0             // Rotation
// );
// const ellipsePoints = ellipseCurve.getPoints(50);
// const ellipseGeometry = new THREE.BufferGeometry().setFromPoints(ellipsePoints);

// // 5. SplineCurve (smooth interpolated curve passing through points)
// const splinePoints = [
//   new THREE.Vector2(-1, 0),
//   new THREE.Vector2(-0.5, 1),
//   new THREE.Vector2(0, 0.5),
//   new THREE.Vector2(0.5, -1),
//   new THREE.Vector2(1, 0)
// ];
// const splineCurve = new THREE.SplineCurve(splinePoints);
// const splinePointsArray = splineCurve.getPoints(500);
// const splineGeometry = new THREE.BufferGeometry().setFromPoints(splinePointsArray);

// // 6. ArcCurve (part of a circle)
// const arcCurve = new THREE.ArcCurve(
//   0, 0,             // ax, ay: center
//   5,                // radius
//   0, Math.PI / 2,   // start angle, end angle (quarter circle)
//   false             // clockwise
// );
// const arcPoints = arcCurve.getPoints(50);
// const arcGeometry = new THREE.BufferGeometry().setFromPoints(arcPoints);

// // Volumes/3D geometries

// // 7. TubeGeometry (along a path)
// const path = new THREE.Curve();
// path.getPoint = (t) => new THREE.Vector3(
//   Math.sin(t * Math.PI * 2),
//   Math.cos(t * Math.PI * 2),
//   t * 2 - 1
// ); // Custom circular path
// const tubeGeometry = new THREE.TubeGeometry(path, 1664, 0.2, 8, false);

// // 8. SphereGeometry (sphere)
// const sphereGeometry = new THREE.SphereGeometry(1, 32, 16); 
// // radius, widthSegments, heightSegments

// // 9. CylinderGeometry (cylinder)
// const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 2, 32); 
// // radiusTop, radiusBottom, height, radialSegments

// // 10. ConeGeometry (cone)
// const coneGeometry = new THREE.ConeGeometry(1, 2, 32); 
// // radius, height, radialSegments

// // 11. TorusGeometry (donut shape)
// const torusGeometry = new THREE.TorusGeometry(1, 0.4, 16, 100); 
// // radius, tube, radialSegments, tubularSegments

// // 12. TorusKnotGeometry (knot shape)
// const knotGeometry = new THREE.TorusKnotGeometry(1, 0.3, 500, 16); 
// // radius, tube, tubularSegments, radialSegments


  // const curve = new THREE.CubicBezierCurve3(
  //       new THREE.Vector3(-1, 0, 0),
  //       new THREE.Vector3(-0.5, 1, 0),
  //       new THREE.Vector3(0.5, -1, 0),
  //       new THREE.Vector3(1, 0, 0)
  //   );

  // Define the function for r(a)
  function r(a,angle_) {
    const tan2_5 = Math.tan(2.5 * angle_);
    const cot5_625 = 1 / Math.tan(5.625* angle_);
    const value = a * tan2_5 * cot5_625;
    const res = Math.acos(value);
    if (res){     
      console.log('t');

      return res;
    }
    console.log('fuck');
    return  0;
  }

  // Create a custom curve class
  class CustomCurve extends THREE.Curve {
    constructor() {
      super();
    }

    getPoint(t) {
      // t varies from 0 to 1
      const a = t*13 -5;
      const angle = t * Math.PI * 2; // full circle over [0,1]

      const radius = r(a,angle);
      //REMOVE FROM HERE ie radius

      // Convert polar to Cartesian (x, y), assuming angle varies with a or fixed?
      // Here, for simplicity, let's assume the angle is proportional to 'a'
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      const z = 0; // keep in XY plane
      return new THREE.Vector3(x, y, z);
    }
  }

  // Generate points along the custom path
  const path2 = new CustomCurve();

const tubeGeometry2 = new THREE.TubeGeometry(path2, 1000, 1, 8, false); // segments, radius, radialSegments




    // const points = curve.getPoints(50);
    // const geometry = new THREE.BufferGeometry().setFromPoints(points);
    




  return tubeGeometry2;
    // Additional volumetric geometry processing can be added here
    // return nodes.Cylinder.geometry;
}


export default class ReactiveParticles extends THREE.Object3D {
  constructor() {
    super()
    this.name = 'ReactiveParticles'
    this.time = 0
    this.properties = {
      startColor: 0xff00ff,
      endColor: 0x00ffff,
      autoMix: true,
      autoRotate: true,
    }
  }

  init() {
    App.holder.add(this)

    this.holderObjects = new THREE.Object3D()
    this.add(this.holderObjects)

    this.material_custom_box2  = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      uniforms: {
        time: { value: 0 },
        offsetSize: { value: 2 },
        size: { value: 1.1 },
        frequency: { value: 2 },
        amplitude: { value: 1 },
        offsetGain: { value: 0 },
        maxDistance: { value: 1.8 },
        startColor: { value: new THREE.Color(0x32a852) },
        endColor: { value: new THREE.Color(0x32a852) },
      },
    })
    this.material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      uniforms: {
        time: { value: 0 },
        offsetSize: { value: 2 },
        size: { value: 1.1 },
        frequency: { value: 2 },
        amplitude: { value: 1 },
        offsetGain: { value: 0 },
        maxDistance: { value: 1.8 },
        startColor: { value: new THREE.Color(this.properties.startColor) },
        endColor: { value: new THREE.Color(this.properties.endColor) },
      },
    })

    this.addGUI()
    this.resetMesh()
  }

  createBoxMesh() {
    // Randomly generate segment counts for width, height, and depth to create varied box geometries
    let widthSeg = Math.floor(THREE.MathUtils.randInt(5, 20))
    let heightSeg = Math.floor(THREE.MathUtils.randInt(1, 40))
    let depthSeg = Math.floor(THREE.MathUtils.randInt(5, 80))
    this.geometry = new THREE.BoxGeometry(1, 1, 1, widthSeg, heightSeg, depthSeg)

    // Update shader material uniform for offset size with a random value
    this.material.uniforms.offsetSize.value = Math.floor(THREE.MathUtils.randInt(30, 60))
    this.material.needsUpdate = true

    // Create a container for the points mesh and set its orientation
    this.pointsMesh = new THREE.Object3D()
    this.pointsMesh.rotateX(Math.PI / 2) // Rotate the mesh for better visual orientation
    this.holderObjects.add(this.pointsMesh)

    // Create a points mesh using the box geometry and the shader material
    const pointsMesh = new THREE.Points(this.geometry, this.material)
    this.pointsMesh.add(pointsMesh)

    // Animate the rotation of the of the container
    gsap.to(this.pointsMesh.rotation, {
      duration: 3,
      x: Math.random() * Math.PI,
      z: Math.random() * Math.PI * 2,
      ease: 'none', // No easing for a linear animation
    })

    gsap.to(this.position, {
      duration: 0.6,
      z: THREE.MathUtils.randInt(9, 11), // Random depth positioning within a range
      ease: 'elastic.out(0.8)', // Elastic ease-out for a bouncy effect
    })
  }



createBoxMesh2(customGeometryGenerator) {

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
  createCylinderMesh() {
    // Randomize radial and height segments for the cylinder geometry
    let radialSeg = Math.floor(THREE.MathUtils.randInt(1, 3))
    let heightSeg = Math.floor(THREE.MathUtils.randInt(1, 5))
    this.geometry = new THREE.CylinderGeometry(1, 1, 4, 64 * radialSeg, 64 * heightSeg, true)

    // Update shader material uniforms for offset and size with random and fixed values
    this.material.uniforms.offsetSize.value = Math.floor(THREE.MathUtils.randInt(30, 60))
    this.material.uniforms.size.value = 2 // Fixed size for uniform appearance
    this.material.needsUpdate = true
    this.material.uniforms.needsUpdate = true

    // Create a points mesh using the cylinder geometry and shader material
    this.pointsMesh = new THREE.Points(this.geometry, this.material)
    this.pointsMesh.rotation.set(Math.PI / 2, 0, 0) // Rotate the mesh for better orientation
    this.holderObjects.add(this.pointsMesh)

    let rotY = 0
    // let posZ = THREE.MathUtils.randInt(9, 11)
let posZ = 11
    // if (Math.random() < 0.2) {
    //   rotY = Math.PI / 2
    //   posZ = THREE.MathUtils.randInt(10, 11.5)
    // }

    gsap.to(this.holderObjects.rotation, {
      duration: 0.2,
      y: rotY,
      ease: 'elastic.out(0.2)',
    })

    gsap.to(this.position, {
      duration: 0.6,
      z: posZ,
      ease: 'elastic.out(0.8)',
    })
  }

  onBPMBeat() {
    // Calculate a reduced duration based on the BPM (beats per minute) duration
    const duration = App.bpmManager.getBPMDuration() / 1000

    if (App.audioManager.isPlaying) {
      // Randomly determine whether to rotate the holder object
      if (Math.random() < 0.3 && this.properties.autoRotate) {
        gsap.to(this.holderObjects.rotation, {
          duration: Math.random() < 0.8 ? 15 : duration, // Either a longer or BPM-synced duration
          // y: Math.random() * Math.PI * 2,
          z: Math.random() * Math.PI,
          ease: 'elastic.out(0.2)',
        })
      }

      // Randomly decide whether to reset the mesh  (mesh changing)
      // if (Math.random() < 0.1) {
        this.resetMesh()
      // }
    }
  }

  resetMesh() {
    if (this.properties.autoMix) {
      this.destroyMesh()

      // if (Math.random() < 0.5) {
      //   this.createCylinderMesh()
      // } else {
      this.createBoxMesh2(createCurveGeometry)
      // }

      // Animate the position of the mesh for an elastic movement effect

      // Animate the frequency uniform in the material, syncing with BPM if available
      gsap.to(this.material.uniforms.frequency, {
        duration: App.bpmManager ? (App.bpmManager.getBPMDuration() / 1000) * 2 : 2,
        value: THREE.MathUtils.randFloat(0.5, 3), // Random frequency value for dynamic visual changes
        ease: 'expo.easeInOut', // Smooth exponential transition for visual effect
      })
    }
  }

  destroyMesh() {
    if (this.pointsMesh) {
      this.holderObjects.remove(this.pointsMesh)
      this.pointsMesh.geometry?.dispose()
      this.pointsMesh.material?.dispose()
      this.pointsMesh = null
    }
  }

  update() {
    if (App.audioManager?.isPlaying) {
      // Dynamically update amplitude based on the high frequency data from the audio manager
      this.material_custom_box2.uniforms.amplitude.value = 0.8 + THREE.MathUtils.mapLinear(App.audioManager.frequencyData.high, 0, 0.6, -0.1, 0.2)

      this.material.uniforms.amplitude.value = 0.8 + THREE.MathUtils.mapLinear(App.audioManager.frequencyData.high, 0, 0.6, -0.1, 0.2)

      // Update offset gain based on the low frequency data for subtle effect changes
      this.material_custom_box2.uniforms.offsetGain.value = App.audioManager.frequencyData.mid * 0.6
      this.material.uniforms.offsetGain.value = App.audioManager.frequencyData.mid * 0.6
      

      // Map low frequency data to a range and use it to increment the time uniform
      const t = THREE.MathUtils.mapLinear(App.audioManager.frequencyData.low, 0.6, 1, 0.2, 0.5)
      this.time += THREE.MathUtils.clamp(t, 0.2, 0.5) // Clamp the value to ensure it stays within a desired range
    } else {
      // Set default values for the uniforms when audio is not playing
    this.material_custom_box2.uniforms.frequency.value = 0.8
      this.material_custom_box2.uniforms.amplitude.value = 1

      this.material.uniforms.frequency.value = 0.8
      this.material.uniforms.amplitude.value = 1
      this.time += 0.2
    }
    this.material_custom_box2.uniforms.time.value = this.time

    this.material.uniforms.time.value = this.time
  }

  addGUI() {
    //Add GUI controls
    const gui = App.gui
    const particlesFolder = gui.addFolder('PARTICLES')
    particlesFolder
      .addColor(this.properties, 'startColor')
      .listen()
      .name('Start Color')
      .onChange((e) => {
        this.material.uniforms.startColor.value = new THREE.Color(e)
      })

    particlesFolder
      .addColor(this.properties, 'endColor')
      .listen()
      .name('End Color')
      .onChange((e) => {
        this.material.uniforms.endColor.value = new THREE.Color(e)
      })

    const visualizerFolder = gui.addFolder('FIKI')
    visualizerFolder.add(this.properties, 'autoMix').listen().name('Auto Mix')
    visualizerFolder.add(this.properties, 'autoRotate').listen().name('Auto Rotate')

    const buttonShowBox = {
      showBox: () => {
        this.destroyMesh()
        this.createBoxMesh()
        this.properties.autoMix = false
      },
    }
    visualizerFolder.add(buttonShowBox, 'showBox').name('Show Box')
     const buttonShowBox2 = {
      show2Box2: () => {
        this.destroyMesh()
        this.createBoxMesh2(createCurveGeometry)
        this.properties.autoMix = false
      },
    }

    visualizerFolder.add(buttonShowBox2, 'show2Box2').name('Show 2 Box 2')

    const buttonShowCylinder = {
      showCylinder: () => {
        this.destroyMesh()
        this.createCylinderMesh()
        this.properties.autoMix = false
      },
    }
    visualizerFolder.add(buttonShowCylinder, 'showCylinder').name('Show Cylinder')
  }
}
