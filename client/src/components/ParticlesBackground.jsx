// client/src/components/ParticlesBackground.jsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ParticlesBackground = () => {
  const mountRef = useRef(null);
  const animationFrameId = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const particlesRef = useRef(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    currentMount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Particles
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 5000;
    const posArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 1000;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.1,
      color: 0x00ffff, // Cyan color for particles
      transparent: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    // Animation loop
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);

      particles.rotation.x += 0.0005;
      particles.rotation.y += 0.0007;

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      // Dispose Three.js resources
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="fixed inset-0 z-0" style={{ pointerEvents: 'none' }} />;
};

export default ParticlesBackground;