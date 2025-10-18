// client/src/components/ParticlesBackground.jsx
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";

// Advanced Particles Background
// - Exposes window.createAdvancedImageCase(imageUrl, options)
// - Converts any image to a detailed particle cloud using
//   Sobel edge detection + luminance weighting + weighted sampling
// - Supports color preservation, depth mapping, adjustable density
// - Carefully disposes resources to avoid leaks

const RENDER_MODE = "points";
const SWAP_INTERVAL_MS = 7000;

export default function ParticlesBackground() {
  const mountRef = useRef(null);
  const rafRef = useRef(null);
  const swapIntervalRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const particlesRef = useRef(null);
  const currentGroupRef = useRef(null);
  const idxRef = useRef(0);
  const clockRef = useRef({ t: 0 });
  const starTextureRef = useRef(null);
  const dynamicImageCaseRef = useRef(null);

  // --- Utility: create a crisp particle sprite (star) ---
  useEffect(() => {
function createStarTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      const outerRadius = 30;
      const innerRadius = 5;
      const numPoints = 5;
      let rot = Math.PI / 2 * 3;
      let x = canvas.width / 2;
      let y = canvas.height / 2;
      let step = Math.PI / numPoints;
      ctx.beginPath();
      ctx.moveTo(x, y - outerRadius);
      for (let i = 0; i < numPoints; i++) {
        x = canvas.width / 2 + Math.cos(rot) * outerRadius;
        y = canvas.height / 2 + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;
        x = canvas.width / 2 + Math.cos(rot) * innerRadius;
        y = canvas.height / 2 + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.closePath();
      ctx.fill();
      return new THREE.CanvasTexture(canvas);
    }
    starTextureRef.current = createStarTexture();
    return () => {
      if (starTextureRef.current) starTextureRef.current.dispose();
    };
  }, []);

  // --- Materials ---
  function makeBackgroundPointsMaterial(color = 0x00ffff, size = 3.6) {
    return new THREE.PointsMaterial({
      size,
      color,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: starTextureRef.current,
      alphaMap: starTextureRef.current,
      sizeAttenuation: true,
      opacity: 0.9,
    });
  }

  function makeImagePointsMaterial({ size = 0.15, vertexColors = true, alphaTest = 0.01 } = {}) {
    return new THREE.PointsMaterial({
      size,
      // vertexColors,
      vertexColors:false,
      map: starTextureRef.current,
      alphaMap: starTextureRef.current,
      transparent: false,
      depthWrite: true,
      sizeAttenuation: false,
      alphaTest,
      // Using NormalBlending instead of AdditiveBlending can result in a less "washed out" look
      blending: THREE.NormalBlending, 
    });
  }

  function disposeObject(obj) {
    if (!obj) return;
    if (obj.geometry) try { obj.geometry.dispose(); } catch (e) {}
    if (obj.material) {
      try {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      } catch (e) {}
    }
    if (obj.texture) try { obj.texture.dispose(); } catch (e) {}
  }

  

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
          getPoint(t) { return lineCurve.getPoint(t); }
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
          getPoint(t) { return pts3[Math.floor(t * (pts3.length - 1))] || pts3[0]; }
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
          getPoint(t) { return pts2[Math.floor(t * (pts2.length - 1))] || pts2[0]; }
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
          getPoint(t) { return pts2[Math.floor(t * (pts2.length - 1))] || pts2[0]; }
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
          getPoint(t) { return pts2[Math.floor(t * (pts2.length - 1))] || pts2[0]; }
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

  function case_CustomTube(scene, mode) {
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

  function case_Reactive_Box(scene, mode) {
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

  const CASES = [
    case_LineCurve,
    // case_QuadraticBezier,
    // case_CubicBezier,
    // case_Ellipse,
    // case_Spline,
    // case_Arc,
    // case_Sphere,
    // case_Cylinder,
    // case_Cone,
    // case_Torus,
    // case_TorusKnot,
    // case_CustomTube,
    // case_Reactive_Box,
    // case_Reactive_Box2,
    // case_Reactive_Cylinder,
    // case_Reactive_CurveTube,
  ];


  // --- Advanced image -> particles conversion ---
  // Options:
  // {
  //   size: 256,            // working canvas size (higher = more detail, slower)
  //   maxPoints: 6000,      // target number of output particles
  //   edgeWeight: 2.0,      // how much edges are preferred
  //   lumWeight: 1.0,       // how much contrast/darkness is preferred
  //   colorize: true,       // assign original image color to each particle
  //   depthScale: 12,       // z range mapping for depth effect
  //   jitter: 0.4,          // small positional jitter to avoid grid look
  // }
  async function case_ImageAdvanced(scene, mode, imageUrl, opts = {}) {
    const options = Object.assign({
      size: 512,
      maxPoints: 15000,
      edgeWeight: 2.2,
      lumWeight: 1.0,
      colorize: true,
      depthScale: 10,
      jitter: 0.6,
      keepAlphaThreshold: 30, // alpha threshold for non-transparent
    }, opts);

    // Helper: load image and draw to canvas while preserving aspect ratio
    function loadImageToCanvas(url, size) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          // Fill transparent background (optional)
          ctx.clearRect(0, 0, size, size);
          // draw image centered with aspect preserved
          let iw = img.width, ih = img.height;
          const scale = Math.max(size / iw, size / ih);
          const w = iw * scale;
          const h = ih * scale;
          const x = (size - w) / 2;
          const y = (size - h) / 2;
          ctx.drawImage(img, x, y, w, h);
          resolve({ canvas, imgWidth: iw, imgHeight: ih });
        };
        img.onerror = (e) => reject(e);
        img.src = url;
      });
    }

    function computeSobel(imageData, w, h) {
      // Simple Sobel operator computing gradient magnitude
      const data = imageData;
      const gray = new Float32Array(w * h);
      for (let i = 0; i < w * h; i++) {
        const r = data[i * 4 + 0];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        // relative luminance
        gray[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      }
      const grad = new Float32Array(w * h);
      const kernelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
      const kernelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          let gx = 0, gy = 0;
          let k = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const v = gray[(y + ky) * w + (x + kx)];
              gx += kernelX[k] * v;
              gy += kernelY[k] * v;
              k++;
            }
          }
          const mag = Math.sqrt(gx * gx + gy * gy);
          grad[y * w + x] = mag;
        }
      }
      return grad;
    }

    // Weighted sampling: create array of candidate pixels with weights, then sample
    function weightedSampleIndices(weights, desiredCount) {
      // Build array of indices with weight > 0
      const indices = [];
      const cums = []; // cumulative sum
      let sum = 0;
      for (let i = 0; i < weights.length; i++) {
        const w = weights[i];
        if (w > 0) {
          sum += w;
          indices.push(i);
          cums.push(sum);
        }
      }
      if (sum === 0 || indices.length === 0) return [];
      const results = new Uint32Array(Math.min(desiredCount, indices.length));
      for (let i = 0; i < results.length; i++) {
        const r = Math.random() * sum;
        // binary search in cums
        let lo = 0, hi = cums.length - 1;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (r <= cums[mid]) hi = mid;
          else lo = mid + 1;
        }
        results[i] = indices[lo];
      }
      return results;
    }

    // Load image to canvas
    const { canvas, imgWidth, imgHeight } = await loadImageToCanvas(imageUrl, options.size);
    const ctx = canvas.getContext("2d");
    const size = options.size;
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;

    // compute luminance (0..255) and normalized (0..1)
    const lum = new Float32Array(size * size);
    for (let i = 0; i < size * size; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      lum[i] = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    }

    // sobel edges
    const sobel = computeSobel(data, size, size);
    // normalize sobel to 0..1
    let maxSob = 0;
    for (let i = 0; i < sobel.length; i++) if (sobel[i] > maxSob) maxSob = sobel[i];
    if (maxSob === 0) maxSob = 1;
    for (let i = 0; i < sobel.length; i++) sobel[i] = sobel[i] / maxSob;

    // build weight per pixel
    const weights = new Float32Array(size * size);
    let maxW = 0;
    for (let i = 0; i < size * size; i++) {
      const alpha = data[i * 4 + 3];
      if (alpha < options.keepAlphaThreshold) {
        weights[i] = 0;
        continue;
      }
      // prefer edges and/or darker pixels (inverted luminance)
      const edgeScore = sobel[i] || 0;
      const contrastScore = 1 - lum[i];
      const combined = options.edgeWeight * edgeScore + options.lumWeight * contrastScore;
      weights[i] = combined;
      if (combined > maxW) maxW = combined;
    }
    if (maxW === 0) maxW = 1;
    for (let i = 0; i < weights.length; i++) weights[i] /= maxW; // normalize to 0..1

    // Weighted sample pixels to reach maxPoints
    const samplesIdx = weightedSampleIndices(weights, options.maxPoints);

    // Prepare arrays
    const positions = new Float32Array(samplesIdx.length * 3);
    const colors = new Float32Array(samplesIdx.length * 3);

    // Map pixels -> scene coords
    const scale = 0.04 * (Math.min(imgWidth, imgHeight) / 128); // heuristic scale
    for (let i = 0; i < samplesIdx.length; i++) {
      const idx = samplesIdx[i];
      const px = idx % size;
      const py = Math.floor(idx / size);
      const r = data[idx * 4] / 255;
      const g = data[idx * 4 + 1] / 255;
      const b = data[idx * 4 + 2] / 255;
      const a = data[idx * 4 + 3] / 255;
      // center coordinates, flip y
      let x = (px - size / 2) * scale;
      let y = (size / 2 - py) * scale;
      // jitter slightly to remove grid artifacts
      x += (Math.random() - 0.5) * options.jitter * scale * 2;
      y += (Math.random() - 0.5) * options.jitter * scale * 2;
      // depth based on luminance and edge - push edges slightly forward/back
      const z = (lum[idx] - 0.5) * options.depthScale * -1; // invert so darker -> closer
      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z + (Math.random() - 0.5) * (options.depthScale * 0.08);
      if (options.colorize) {
        colors[i * 3 + 0] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
      } else {
        colors[i * 3 + 0] = 1.0;
        colors[i * 3 + 1] = 1.0;
        colors[i * 3 + 2] = 1.0;
      }
    }

    if (mode === "points") {
      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geom.computeBoundingSphere();
      const mat = makeImagePointsMaterial({ size: 1, vertexColors: options.colorize });
      const points = new THREE.Points(geom, mat);
      scene.add(points);
      // Nice show animation
      points.scale.setScalar(0.3);
      // gsap.to(points.scale, { x: 1, y: 1, z: 1, duration: 1.2, ease: "elastic.out(1,0.4)" });
      // gsap.to(points.scale, { x: .1, y: .1, z: .1, duration: 3.2, ease: "elastic.out(1,0.4)" });
      return points;
    } else {
      // Mesh fallback: build a small point cloud converted to buffer geometry (no shading)
      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const mat = new THREE.PointsMaterial({ size: 0.1, vertexColors: true });
      const p = new THREE.Points(geom, mat);
      scene.add(p);
      return p;
    }
  }

  // Expose global API to allow dynamic addition of image-based cases
    window.createAdvancedImageCase = async function (imageUrl, options) {
    dynamicImageCaseRef.current = async (scene, mode) => {
      return await case_ImageAdvanced(scene, mode, imageUrl, options);
    };
    // Add to CASES and force immediate show
    if (!CASES.includes(dynamicImageCaseRef.current)) {
      CASES.push(dynamicImageCaseRef.current);
    }
    if (sceneRef.current && currentGroupRef.current) {
      // Clear old objects
      currentGroupRef.current.children.forEach((child) => {
        currentGroupRef.current.remove(child);
        disposeObject(child);
      });
      // Add the new one right away
      const objPromise = dynamicImageCaseRef.current(sceneRef.current, RENDER_MODE);
      if (objPromise instanceof Promise) {
        objPromise.then((obj) => {
          if (obj) {
            // The following line has been removed to prevent unwanted scaling.
            // obj.scale.set(8, 8, 8); 
            currentGroupRef.current.add(obj);
            gsap.to(obj.rotation, { y: "+=" + Math.PI * 2, duration: 14, repeat: -1, ease: "none" });
          }
        }).catch((err) => console.error("Error creating advanced image case:", err));
      }
    }
  };

  // --- Scene init ---
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
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

    const ambient = new THREE.AmbientLight(0xffffff, 0.45);
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(10, 10, 10);
    scene.add(ambient, dir);

    // background starfield
    const pGeom = new THREE.BufferGeometry();
    const particleCount = 8000;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) positions[i] = (Math.random() - 0.5) * 1000;
    pGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const pMat = makeBackgroundPointsMaterial(0x00ffff, 4.2);
    gsap.to(pMat, { opacity: 0.2, duration: 3, yoyo: true, repeat: -1, ease: "sine.inOut" });
    const particles = new THREE.Points(pGeom, pMat);
    scene.add(particles);
    particlesRef.current = particles;

    const currentGroup = new THREE.Group();
    scene.add(currentGroup);
    currentGroupRef.current = currentGroup;

    function addCaseByIndex(i) {
      const caseFn = CASES[i % CASES.length];
      if (!caseFn) return null;
      const objOrPromise = caseFn(scene, RENDER_MODE);
      if (objOrPromise instanceof Promise) {
        objOrPromise.then((obj) => {
          if (obj) {
            obj.scale.set(8, 8, 8);
            currentGroup.add(obj);
            gsap.to(obj.rotation, { y: "+=" + Math.PI * 2, duration: 12, repeat: -1, ease: "none" });
          }
        }).catch((err) => console.error(err));
      } else {
        const obj = objOrPromise;
        if (obj) {
          obj.scale.set(8, 8, 8);
          currentGroup.add(obj);
          gsap.to(obj.rotation, { y: "+=" + Math.PI * 2, duration: 12, repeat: -1, ease: "none" });
        }
      }
    }

    addCaseByIndex(idxRef.current);

    function swapToNext() {
      if (currentGroup.children.length > 0) {
        currentGroup.children.forEach((child) => {
          currentGroup.remove(child);
          disposeObject(child);
        });
      }
      if (dynamicImageCaseRef.current && CASES[CASES.length - 1] === dynamicImageCaseRef.current) {
        CASES.pop();
        dynamicImageCaseRef.current = null;
      }
      idxRef.current = (idxRef.current + 1) % CASES.length;
      addCaseByIndex(idxRef.current);
    }

    swapIntervalRef.current = setInterval(() => swapToNext(), SWAP_INTERVAL_MS);

    function animate() {
      clockRef.current.t += 0.01;
      if (particlesRef.current) {
        particlesRef.current.rotation.x += 0.0006;
        particlesRef.current.rotation.y += 0.0009;
      }
      if (currentGroupRef.current && currentGroupRef.current.children.length > 0) {
        currentGroupRef.current.rotation.y += 0.002;
        currentGroupRef.current.rotation.x += 0.0015;
      }
      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    }
    animate();

    function onResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
    window.addEventListener("resize", onResize);

    return () => {
      clearInterval(swapIntervalRef.current);
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      if (currentGroupRef.current) {
        currentGroupRef.current.children.forEach((child) => {
          currentGroupRef.current.remove(child);
          disposeObject(child);
        });
        scene.remove(currentGroupRef.current);
      }
      if (particlesRef.current) {
        scene.remove(particlesRef.current);
        disposeObject(particlesRef.current);
      }
      try { scene.remove(ambient); scene.remove(dir); } catch (e) {}
      try {
        if (rendererRef.current && rendererRef.current.domElement && mount.contains(rendererRef.current.domElement)) {
          mount.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current.dispose();
      } catch (e) {}
    };
  }, []);

  // Example: automatically create an advanced image case after mount (can be removed)
  useEffect(() => {
    const timer = setTimeout(() => {
      const imageUrl = "./logo512.png"; // replace with your asset
      if (window.createAdvancedImageCase) {
        window.createAdvancedImageCase(imageUrl, { size: 512, maxPoints: 15000, colorize: true })
          .then(() => console.log("Advanced image case created"))
          .catch((err) => console.error(err));
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return <div ref={mountRef} className="fixed inset-0 z-0" style={{ pointerEvents: "none" }} />;
}
