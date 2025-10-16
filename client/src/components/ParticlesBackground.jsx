// client/src/components/ParticlesBackground.jsx
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";

/**
 * ParticlesBackground.jsx
 *
 * - Sequentially cycles through a list of geometry "cases" every 5 seconds.
 * - Each case supports two rendering modes: "points" (particle cloud) and "mesh" (lit solid).
 * - Switch-style structure for easy toggling / extension.
 *
 * Toggle global mode here:
 */
const RENDER_MODE = "points"; // "points" or "mesh"
const SWAP_INTERVAL_MS = 5000; // 5 seconds sequentially

export default function ParticlesBackground() {
  const mountRef = useRef(null);
  const rafRef = useRef(null);
  const swapIntervalRef = useRef(null);

  // references to main three objects so we can cleanly dispose
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const particlesRef = useRef(null);
  const currentGroupRef = useRef(null);
  const idxRef = useRef(0);
  const clockRef = useRef({ t: 0 });

  // ---------- helper: make material for Points or Mesh ----------
  function makePointsMaterial(color = 0x00ffff, size = 0.12) {
    return new THREE.PointsMaterial({
      size,
      color,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }

  function makeMeshMaterial(color = 0xffffff) {
    return new THREE.MeshStandardMaterial({
      color,
      emissive: new THREE.Color(color).multiplyScalar(0.06),
      metalness: 0.3,
      roughness: 0.4,
      side: THREE.DoubleSide,
    });
  }

  // ---------- helper: clean disposable object ----------
  function disposeObject(obj) {
    if (!obj) return;
    if (obj.geometry) {
      try {
        obj.geometry.dispose();
      } catch (e) {}
    }
    if (obj.material) {
      try {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      } catch (e) {}
    }
  }

  // ---------- Create the 12+ geometries ----------

  // 1) Line curve (render as Points/Line or Mesh -> tube)
  function case_LineCurve(scene, mode) {
    const lineCurve = new THREE.LineCurve3(
      new THREE.Vector3(-10, 0, 0),
      new THREE.Vector3(10, 0, 0)
    );
    const pts = lineCurve.getPoints(500);
    if (mode === "points") {
      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = makePointsMaterial(0xff7700, 0.08);
      const p = new THREE.Points(geom, mat);
      scene.add(p);
      gsap.from(p.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 1.2, ease: "elastic.out(1,0.4)" });
      return p;
    } else {
      const tube = new THREE.TubeGeometry(
        new (class extends THREE.Curve {
          getPoint(t) {
            return lineCurve.getPoint(t);
          }
        })(),
        500,
        0.4,
        8,
        false
      );
      const mat = makeMeshMaterial(0xff7700);
      const mesh = new THREE.Mesh(tube, mat);
      scene.add(mesh);
      gsap.from(mesh.position, { z: -10, duration: 1, ease: "expo.out" });
      return mesh;
    }
  }

  // 2) Quadratic Bezier (2D path turned into tube / points)
  function case_QuadraticBezier(scene, mode) {
    const curve = new THREE.QuadraticBezierCurve(
      new THREE.Vector2(-5, 0),
      new THREE.Vector2(0, 6),
      new THREE.Vector2(5, 0)
    );
    const pts2 = curve.getPoints(600);
    const pts3 = pts2.map((p) => new THREE.Vector3(p.x, p.y, 0));
    if (mode === "points") {
      const geom = new THREE.BufferGeometry().setFromPoints(pts3);
      const mat = makePointsMaterial(0xff00ff, 0.08);
      const p = new THREE.Points(geom, mat);
      scene.add(p);
      gsap.from(p.rotation, { z: Math.PI, duration: 1.2, ease: "expo.out" });
      return p;
    } else {
      const tube = new THREE.TubeGeometry(
        new (class extends THREE.Curve {
          getPoint(t) {
            return pts3[Math.floor(t * (pts3.length - 1))] || pts3[0];
          }
        })(),
        600,
        0.25,
        8,
        false
      );
      const mat = makeMeshMaterial(0xff00ff);
      const m = new THREE.Mesh(tube, mat);
      scene.add(m);
      return m;
    }
  }

  // 3) Cubic Bezier
  function case_CubicBezier(scene, mode) {
    const curve = new THREE.CubicBezierCurve(
      new THREE.Vector2(-6, 0),
      new THREE.Vector2(-2, 6),
      new THREE.Vector2(2, -6),
      new THREE.Vector2(6, 0)
    );
    const pts2 = curve.getPoints(700).map((p) => new THREE.Vector3(p.x, p.y, 0));
    if (mode === "points") {
      const geom = new THREE.BufferGeometry().setFromPoints(pts2);
      const p = new THREE.Points(geom, makePointsMaterial(0x66ffdd, 0.06));
      scene.add(p);
      return p;
    } else {
      const tube = new THREE.TubeGeometry(
        new (class extends THREE.Curve {
          getPoint(t) {
            return pts2[Math.floor(t * (pts2.length - 1))] || pts2[0];
          }
        })(),
        700,
        0.3,
        8,
        false
      );
      const m = new THREE.Mesh(tube, makeMeshMaterial(0x66ffdd));
      scene.add(m);
      return m;
    }
  }

  // 4) EllipseCurve
  function case_Ellipse(scene, mode) {
    const e = new THREE.EllipseCurve(0, 0, 8, 4, 0, Math.PI * 2, false, 0);
    const pts2 = e.getPoints(400).map((p) => new THREE.Vector3(p.x, p.y, 0));
    if (mode === "points") {
      const geom = new THREE.BufferGeometry().setFromPoints(pts2);
      const p = new THREE.Points(geom, makePointsMaterial(0xffcc00, 0.06));
      scene.add(p);
      return p;
    } else {
      const geom = new THREE.LatheGeometry(pts2, 128);
      const m = new THREE.Mesh(geom, makeMeshMaterial(0xffcc00));
      scene.add(m);
      return m;
    }
  }

  // 5) SplineCurve
  function case_Spline(scene, mode) {
    const splinePoints = [
      new THREE.Vector2(-6, 0),
      new THREE.Vector2(-3, 4),
      new THREE.Vector2(0, 2),
      new THREE.Vector2(3, -4),
      new THREE.Vector2(6, 0),
    ];
    const spline = new THREE.SplineCurve(splinePoints);
    const pts2 = spline.getPoints(600).map((p) => new THREE.Vector3(p.x, p.y, 0));
    if (mode === "points") {
      const geom = new THREE.BufferGeometry().setFromPoints(pts2);
      const p = new THREE.Points(geom, makePointsMaterial(0x88ccff, 0.05));
      scene.add(p);
      return p;
    } else {
      const tube = new THREE.TubeGeometry(
        new (class extends THREE.Curve {
          getPoint(t) {
            return pts2[Math.floor(t * (pts2.length - 1))] || pts2[0];
          }
        })(),
        600,
        0.28,
        8,
        false
      );
      const m = new THREE.Mesh(tube, makeMeshMaterial(0x88ccff));
      scene.add(m);
      return m;
    }
  }

  // 6) ArcCurve (quarter circle or arbitrary arc)
  function case_Arc(scene, mode) {
    const arc = new THREE.ArcCurve(0, 0, 6, 0, Math.PI, false);
    const pts2 = arc.getPoints(300).map((p) => new THREE.Vector3(p.x, p.y, 0));
    if (mode === "points") {
      const geom = new THREE.BufferGeometry().setFromPoints(pts2);
      const p = new THREE.Points(geom, makePointsMaterial(0xaa66ff, 0.06));
      scene.add(p);
      return p;
    } else {
      const tube = new THREE.TubeGeometry(
        new (class extends THREE.Curve {
          getPoint(t) {
            return pts2[Math.floor(t * (pts2.length - 1))] || pts2[0];
          }
        })(),
        300,
        0.3,
        8,
        false
      );
      const m = new THREE.Mesh(tube, makeMeshMaterial(0xaa66ff));
      scene.add(m);
      return m;
    }
  }

  // 7) Sphere
  function case_Sphere(scene, mode) {
    const geom = new THREE.SphereGeometry(5, 64, 32);
    if (mode === "points") {
      const p = new THREE.Points(geom, makePointsMaterial(0x33ff99, 0.08));
      scene.add(p);
      return p;
    } else {
      const m = new THREE.Mesh(geom, makeMeshMaterial(0x33ff99));
      scene.add(m);
      return m;
    }
  }

  // 8) Cylinder
  function case_Cylinder(scene, mode) {
    const geom = new THREE.CylinderGeometry(3, 3, 8, 64, 1, true);
    if (mode === "points") {
      const p = new THREE.Points(geom, makePointsMaterial(0xffff66, 0.07));
      scene.add(p);
      return p;
    } else {
      const m = new THREE.Mesh(geom, makeMeshMaterial(0xffff66));
      scene.add(m);
      return m;
    }
  }

  // 9) Cone
  function case_Cone(scene, mode) {
    const geom = new THREE.ConeGeometry(4, 8, 64);
    if (mode === "points") {
      const p = new THREE.Points(geom, makePointsMaterial(0xff6666, 0.07));
      scene.add(p);
      return p;
    } else {
      const m = new THREE.Mesh(geom, makeMeshMaterial(0xff6666));
      scene.add(m);
      return m;
    }
  }

  // 10) Torus
  function case_Torus(scene, mode) {
    const geom = new THREE.TorusGeometry(5, 1.4, 64, 128);
    if (mode === "points") {
      const p = new THREE.Points(geom, makePointsMaterial(0x66ccff, 0.06));
      scene.add(p);
      return p;
    } else {
      const m = new THREE.Mesh(geom, makeMeshMaterial(0x66ccff));
      scene.add(m);
      return m;
    }
  }

  // 11) TorusKnot
  function case_TorusKnot(scene, mode) {
    const geom = new THREE.TorusKnotGeometry(3.6, 0.9, 400, 24);
    if (mode === "points") {
      const p = new THREE.Points(geom, makePointsMaterial(0xff99ff, 0.05));
      scene.add(p);
      return p;
    } else {
      const m = new THREE.Mesh(geom, makeMeshMaterial(0xff99ff));
      scene.add(m);
      return m;
    }
  }

  // 12) Tube along a custom parametric curve (more complex)
  function case_CustomTube(scene, mode) {
    // custom curve similar to your createCurveGeometry
    function r(a, angle_) {
      const tan2_5 = Math.tan(2.5 * angle_);
      const cot5_625 = 1 / Math.tan(5.625 * angle_);
      const value = a * tan2_5 * cot5_625;
      const res = Math.acos(value);
      return isNaN(res) ? 0 : res;
    }
    class CustomCurve extends THREE.Curve {
      getPoint(t) {
        const a = t * 13 - 5;
        const angle = t * Math.PI * 2;
        const radius = r(a, angle) || 0;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        return new THREE.Vector3(x, y, 0);
      }
    }
    const tube = new THREE.TubeGeometry(new CustomCurve(), 1000, 0.8, 12, false);
    if (mode === "points") {
      const p = new THREE.Points(tube, makePointsMaterial(0x32a852, 0.06));
      scene.add(p);
      return p;
    } else {
      const m = new THREE.Mesh(tube, makeMeshMaterial(0x32a852));
      scene.add(m);
      return m;
    }
  }

  // ------- Extra ReactiveParticles2-like shapes (kept & named differently) -------
  function case_Reactive_Box(scene, mode) {
    // similar to ReactiveParticles.createBoxMesh: subdivided box points
    const geom = new THREE.BoxGeometry(6, 6, 6, 16, 30, 60);
    if (mode === "points") {
      const p = new THREE.Points(geom, makePointsMaterial(0x32a852, 0.06));
      scene.add(p);
      gsap.to(p.rotation, { duration: 3, x: Math.random() * Math.PI, z: Math.random() * Math.PI * 2 });
      return p;
    } else {
      const m = new THREE.Mesh(geom, makeMeshMaterial(0x32a852));
      scene.add(m);
      return m;
    }
  }

  function case_Reactive_Box2(scene, mode) {
    // similar to ReactiveParticles.createBoxMesh2 with different orientation / uniform
    const geom = new THREE.BoxGeometry(8, 8, 8, 20, 40, 80);
    if (mode === "points") {
      const p = new THREE.Points(geom, makePointsMaterial(0x00ffff, 0.06));
      scene.add(p);
      gsap.from(p.scale, { duration: 1, x: 0.01, y: 0.01, z: 0.01, ease: "elastic.out(1,0.4)" });
      return p;
    } else {
      const m = new THREE.Mesh(geom, makeMeshMaterial(0x00ffff));
      scene.add(m);
      return m;
    }
  }

  function case_Reactive_Cylinder(scene, mode) {
    const geom = new THREE.CylinderGeometry(2.8, 2.8, 7.5, 48, 16, true);
    if (mode === "points") {
      const p = new THREE.Points(geom, makePointsMaterial(0xff0066, 0.06));
      scene.add(p);
      gsap.to(p.rotation, { duration: 2.6, x: Math.random() * Math.PI, z: Math.random() * Math.PI });
      return p;
    } else {
      const m = new THREE.Mesh(geom, makeMeshMaterial(0xff0066));
      scene.add(m);
      return m;
    }
  }

  function case_Reactive_CurveTube(scene, mode) {
    // re-use the custom tube but smaller/thicker
    function r(a, angle_) {
      const tan2_5 = Math.tan(2.5 * angle_);
      const cot5_625 = 1 / Math.tan(5.625 * angle_);
      const value = a * tan2_5 * cot5_625;
      const res = Math.acos(value);
      return isNaN(res) ? 0 : res;
    }
    class CustomCurve2 extends THREE.Curve {
      getPoint(t) {
        const a = t * 10 - 4;
        const angle = t * Math.PI * 2;
        const radius = r(a, angle) || 0;
        return new THREE.Vector3(radius * Math.cos(angle), radius * Math.sin(angle), Math.sin(t * Math.PI * 4));
      }
    }
    const tube = new THREE.TubeGeometry(new CustomCurve2(), 600, 1.2, 12, false);
    if (mode === "points") {
      const p = new THREE.Points(tube, makePointsMaterial(0xffffff, 0.06));
      scene.add(p);
      return p;
    } else {
      const m = new THREE.Mesh(tube, makeMeshMaterial(0xffffff));
      scene.add(m);
      return m;
    }
  }

  // ---------- Sequence list (order is sequential and repeats) ----------
  const CASES = [
    case_LineCurve,
    case_QuadraticBezier,
    case_CubicBezier,
    case_Ellipse,
    case_Spline,
    case_Arc,
    case_Sphere,
    case_Cylinder,
    case_Cone,
    case_Torus,
    case_TorusKnot,
    case_CustomTube,
    // Reactive-like extras (kept after the 12)
    case_Reactive_Box,
    case_Reactive_Box2,
    case_Reactive_Cylinder,
    case_Reactive_CurveTube,
  ];

  // ---------- main effect: init three scene and animate ----------
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // --- Scene, camera, renderer ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 0, 40);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // lights for mesh mode
    const ambient = new THREE.AmbientLight(0xffffff, 0.45);
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(10, 10, 10);
    scene.add(ambient, dir);

    // background particle field (keeps original behavior)
    const pGeom = new THREE.BufferGeometry();
    const particleCount = 8000;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) positions[i] = (Math.random() - 0.5) * 1000;
    pGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.12,
      color: 0x00ffff,
      transparent: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false,
    });
    const particles = new THREE.Points(pGeom, pMat);
    scene.add(particles);
    particlesRef.current = particles;

    // group to hold the active geometry (so we can easily swap)
    const currentGroup = new THREE.Group();
    scene.add(currentGroup);
    currentGroupRef.current = currentGroup;

    // helper to create and add next case to scene
    function addCaseByIndex(i) {
      const caseFn = CASES[i % CASES.length];
      if (!caseFn) return null;
      // create and return the object
      const obj = caseFn(scene, RENDER_MODE);
      obj.scale.y *= 8;
      obj.scale.x *= 8;
      obj.scale.z *= 8;
      // we want to parent it under the currentGroup for easy cleanup and shared rotations
      if (obj) {
        currentGroup.add(obj);
        // small entrance animation is handled inside case functions; apply mild rotation tween as a default
        gsap.to(obj.rotation, { y: "+=" + (Math.PI * 2), duration: 12, repeat: -1, ease: "none" });
      }
      return obj;
    }

    // create initial object
    let activeObj = addCaseByIndex(idxRef.current);

    // swap function: remove current and add next sequential
    function swapToNext() {
      // remove previous
      if (currentGroup.children.length > 0) {
        currentGroup.children.forEach((child) => {
          currentGroup.remove(child);
          disposeObject(child);
        });
      }
      idxRef.current = (idxRef.current + 1) % CASES.length;
      activeObj = addCaseByIndex(idxRef.current);
    }

    // set interval to cycle sequentially
    swapIntervalRef.current = setInterval(() => {
      swapToNext();
    }, SWAP_INTERVAL_MS);

    // animation loop
    function animate() {
      clockRef.current.t += 0.01;
      // rotate particles slowly
      particles.rotation.x += 0.0006;
      particles.rotation.y += 0.0009;

      // optional subtle group motion
      if (currentGroup.children.length > 0) {
        currentGroup.rotation.y += 0.002;
        currentGroup.rotation.x += 0.0015;


      }

      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    }
    animate();

    // resize handler
    function onResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
    window.addEventListener("resize", onResize);

    // cleanup function
    return () => {
      // stop interval & RAF
      clearInterval(swapIntervalRef.current);
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);

      // remove and dispose current group children
      if (currentGroup) {
        currentGroup.children.forEach((child) => {
          currentGroup.remove(child);
          disposeObject(child);
        });
        scene.remove(currentGroup);
      }

      // dispose particles
      if (particles) {
        scene.remove(particles);
        disposeObject(particles);
      }

      // dispose lights
      try {
        scene.remove(ambient);
        scene.remove(dir);
      } catch (e) {}

      // remove renderer dom
      try {
        if (renderer && renderer.domElement && mount.contains(renderer.domElement)) {
          mount.removeChild(renderer.domElement);
        }
        renderer.dispose();
      } catch (e) {}
    };
  }, []);

  return <div ref={mountRef} className="fixed inset-0 z-0" style={{ pointerEvents: "none" }} />;
}
