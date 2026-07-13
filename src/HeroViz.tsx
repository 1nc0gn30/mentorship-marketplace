import { useEffect, useRef } from 'react';

/**
 * HeroViz — a unique Three.js + SVG + pixel-art hero visualization.
 *
 * Concept: A grid of pixel cubes that ripple and morph like a terrain
 * of "ideas" — some lit up (unstuck), some dim (stuck). A scanner
 * ring sweeps across, "unblocking" pixels as it passes. Overlaid
 * with an SVG grid that adds a CRT/terminal feel.
 *
 * No external deps beyond three. Everything procedural.
 */

const GRID = 24; // 24x24 pixel grid
const CELL = 1;
const SPACING = 0.15;

export function HeroViz({ theme }: { theme: 'dark' | 'light' }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let raf = 0;
    let renderer: any = null;

    (async () => {
      const THREE = await import('three');

      const w = mount.clientWidth;
      const h = mount.clientHeight || 200;

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
      camera.position.set(0, 14, 18);
      camera.lookAt(0, 0, 0);

      // Theme-aware colors
      const isLight = theme === 'light';
      const colCyan = isLight ? new THREE.Color(0x0891b2) : new THREE.Color(0x22d3ee);
      const colViolet = isLight ? new THREE.Color(0x4f46e5) : new THREE.Color(0x818cf8);
      const colPink = isLight ? new THREE.Color(0xdb2777) : new THREE.Color(0xf472b6);
      const partColor = isLight ? new THREE.Color(0x6366f1) : new THREE.Color(0x818cf8);
      const ringColor = isLight ? new THREE.Color(0xdb2777) : new THREE.Color(0xf472b6);

      // Pixel grid — instanced mesh of small boxes
      const total = GRID * GRID;
      const geo = new THREE.BoxGeometry(CELL * 0.7, 1, CELL * 0.7);
      const mat = new THREE.MeshBasicMaterial({ vertexColors: false });
      const mesh = new THREE.InstancedMesh(geo, mat, total);

      const dummy = new THREE.Object3D();
      const offsets: { x: number; z: number; phase: number; baseY: number }[] = [];

      let i = 0;
      for (let gx = 0; gx < GRID; gx++) {
        for (let gz = 0; gz < GRID; gz++) {
          const x = (gx - GRID / 2) * (CELL + SPACING);
          const z = (gz - GRID / 2) * (CELL + SPACING);
          const phase = Math.random() * Math.PI * 2;
          const baseY = 0;
          offsets.push({ x, z, phase, baseY });
          dummy.position.set(x, baseY, z);
          dummy.scale.set(1, 0.1, 1);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          mesh.setColorAt(i, colCyan.clone());
          i++;
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      scene.add(mesh);

      // Scanner ring — a torus that sweeps across the grid
      const ringGeo = new THREE.TorusGeometry(GRID * 0.5, 0.08, 6, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: ringColor, transparent: true, opacity: 0.4 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);

      // Small floating "idea" particles above the grid
      const partGeo = new THREE.BufferGeometry();
      const partCount = 60;
      const partPos = new Float32Array(partCount * 3);
      const partVel: { vy: number; phase: number }[] = [];
      for (let p = 0; p < partCount; p++) {
        partPos[p * 3] = (Math.random() - 0.5) * GRID * (CELL + SPACING);
        partPos[p * 3 + 1] = Math.random() * 6 + 1;
        partPos[p * 3 + 2] = (Math.random() - 0.5) * GRID * (CELL + SPACING);
        partVel.push({ vy: 0.02 + Math.random() * 0.03, phase: Math.random() * Math.PI * 2 });
      }
      partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
      const partMat = new THREE.PointsMaterial({
        color: partColor,
        size: 0.15,
        transparent: true,
        opacity: isLight ? 0.4 : 0.6,
        blending: THREE.AdditiveBlending,
      });
      const particles = new THREE.Points(partGeo, partMat);
      scene.add(particles);

      // Animation
      const clock = new THREE.Clock();
      let elapsed = 0;

      const animate = () => {
        raf = requestAnimationFrame(animate);
        elapsed = clock.getElapsedTime();

        // Scanner ring sweeps in a circle
        const ringAngle = elapsed * 0.5;
        ring.position.x = Math.cos(ringAngle) * 4;
        ring.position.z = Math.sin(ringAngle) * 4;
        ring.material.opacity = 0.25 + Math.sin(elapsed * 2) * 0.15;

        // Ripple the pixel grid
        let idx = 0;
        for (let gx = 0; gx < GRID; gx++) {
          for (let gz = 0; gz < GRID; gz++) {
            const o = offsets[idx];
            // Distance from scanner ring center
            const dx = o.x - ring.position.x;
            const dz = o.z - ring.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            // Wave that emanates from the ring
            const wave = Math.sin(dist * 0.8 - elapsed * 3) * 0.5 + 0.5;
            // Base gentle ripple
            const ripple = Math.sin(o.x * 0.3 + elapsed * 1.5) * 0.15 +
                           Math.cos(o.z * 0.3 + elapsed * 1.2) * 0.15;
            const y = wave * 2.5 + ripple;
            const scale = 0.1 + wave * 0.8 + Math.abs(ripple) * 0.3;

            dummy.position.set(o.x, y * 0.5, o.z);
            dummy.scale.set(1, Math.max(0.05, scale), 1);
            dummy.updateMatrix();
            mesh.setMatrixAt(idx, dummy.matrix);

            // Color shift: cyan -> violet -> pink based on wave height
            const t = wave;
            if (t > 0.7) {
              mesh.setColorAt(idx, colPink);
            } else if (t > 0.4) {
              mesh.setColorAt(idx, colViolet);
            } else {
              mesh.setColorAt(idx, colCyan);
            }
            idx++;
          }
        }
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

        // Float particles
        const positions = particles.geometry.attributes.position.array as Float32Array;
        for (let p = 0; p < partCount; p++) {
          positions[p * 3 + 1] += partVel[p].vy;
          if (positions[p * 3 + 1] > 8) {
            positions[p * 3 + 1] = 0.5;
            positions[p * 3] = (Math.random() - 0.5) * GRID * (CELL + SPACING);
            positions[p * 3 + 2] = (Math.random() - 0.5) * GRID * (CELL + SPACING);
          }
        }
        particles.geometry.attributes.position.needsUpdate = true;
        particles.rotation.y = elapsed * 0.05;

        // Slow camera drift
        camera.position.x = Math.sin(elapsed * 0.08) * 3;
        camera.lookAt(0, 0.5, 0);

        renderer.render(scene, camera);
      };
      animate();

      // Resize
      const onResize = () => {
        const nw = mount.clientWidth;
        const nh = mount.clientHeight || 200;
        renderer.setSize(nw, nh);
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', onResize);

      return () => {
        window.removeEventListener('resize', onResize);
      };
    })().then((cleanup) => {
      if (cleanup) cleanup();
    });

    return () => {
      cancelAnimationFrame(raf);
      if (renderer) {
        renderer.dispose?.();
        if (renderer.domElement && mount.contains(renderer.domElement)) {
          mount.removeChild(renderer.domElement);
        }
      }
    };
  }, [theme]);

  return (
    <div className="hero-viz-wrap">
      <div className="hero-viz-canvas" ref={mountRef} />
      <svg className="hero-viz-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* CRT scan lines */}
        <defs>
          <pattern id="scanlines" width="2" height="2" patternUnits="userSpaceOnUse">
            <rect width="2" height="1" fill="var(--viz-svg-scanline)" />
          </pattern>
          <linearGradient id="vizFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--viz-svg-fade-top)" />
            <stop offset="30%" stopColor="rgba(0,0,0,0)" />
            <stop offset="70%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="var(--viz-svg-fade-bottom)" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#scanlines)" />
        <rect width="100" height="100" fill="url(#vizFade)" />
        {/* Corner brackets — pixel art frame */}
        <g stroke="var(--viz-svg-bracket)" strokeWidth="0.8" fill="none" vectorEffect="non-scaling-stroke">
          <path d="M 2 8 L 2 2 L 8 2" />
          <path d="M 92 2 L 98 2 L 98 8" />
          <path d="M 2 92 L 2 98 L 8 98" />
          <path d="M 92 98 L 98 98 L 98 92" />
        </g>
      </svg>
      <div className="hero-viz-label">
        <span className="viz-label-dot" />
        <span>scanning for blocked builders</span>
      </div>
    </div>
  );
}