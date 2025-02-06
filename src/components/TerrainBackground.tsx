import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Optimized Perlin Noise - Simplified, and added noise wrapping.
class PerlinNoise {
  private readonly grad3: number[][];
  private readonly p: number[];
  private readonly perm: number[];

  constructor() {
    this.grad3 = [
      [1, 1, 0],
      [-1, 1, 0],
      [1, -1, 0],
      [-1, -1, 0],
      [1, 0, 1],
      [-1, 0, 1],
      [1, 0, -1],
      [-1, 0, -1],
      [0, 1, 1],
      [0, -1, 1],
      [0, 1, -1],
      [0, -1, -1],
    ];
    this.p = Array.from({ length: 256 }, () => Math.floor(Math.random() * 256));
    this.perm = new Array(512);
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
    }
  }

  private dot(g: number[], x: number, y: number): number {
    return g[0] * x + g[1] * y;
  }

  noise(xin: number, yin: number): number {
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

    const s = (xin + yin) * F2;
    const [i, j] = [Math.floor(xin + s), Math.floor(yin + s)];
    const t = (i + j) * G2;
    const [X0, Y0] = [i - t, j - t];
    const [x0, y0] = [xin - X0, yin - Y0];

    const [i1, j1] = x0 > y0 ? [1, 0] : [0, 1];
    const [x1, y1] = [x0 - i1 + G2, y0 - j1 + G2];
    const [x2, y2] = [x0 - 1.0 + 2.0 * G2, y0 - 1.0 + 2.0 * G2];

    const [ii, jj] = [i & 255, j & 255];
    const [gi0, gi1, gi2] = [
      this.perm[(ii + this.perm[jj]) & 255] % 12,
      this.perm[(ii + i1 + this.perm[jj + j1]) & 255] % 12,
      this.perm[(ii + 1 + this.perm[jj + 1]) & 255] % 12,
    ];

    const calculate = (x: number, y: number, gi: number) => {
      let t = 0.5 - x * x - y * y;
      return t < 0 ? 0.0 : (t *= t) * t * this.dot(this.grad3[gi], x, y);
    };

    const [n0, n1, n2] = [calculate(x0, y0, gi0), calculate(x1, y1, gi1), calculate(x2, y2, gi2)];

    return 70.0 * (n0 + n1 + n2);
  }

  fbm(x: number, y: number, octaves = 4, persistence = 0.5, lacunarity = 2.0): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0; // Used for normalization

    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude; // Accumulate max value for normalization
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    return total / maxValue; // Normalize
  }
}

const TerrainBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameIdRef = useRef<number | null>(null);
  const cameraTarget = useRef(new THREE.Vector3(0, 5, 10));
  const targetSpeed = useRef(new THREE.Vector3(0.015, 0, 0.009));
  const speed = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    scene.fog = new THREE.Fog(0x000000, 15, 50);

    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    const perlin = new PerlinNoise();
    const chunkSize = 20;
    const segments = 50;
    const terrainChunks = new Map();
    const renderDistance = 2;
    const overlap = Math.ceil(segments * 0.03);

    // Shared material for all chunks
    const material = new THREE.MeshBasicMaterial({
      wireframe: true,
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
    });

    const getOrCreateChunk = (chunkX: number, chunkZ: number) => {
      const chunkKey = `${chunkX},${chunkZ}`;
      let terrain = terrainChunks.get(chunkKey);

      if (!terrain) {
        const geometry = new THREE.PlaneGeometry(
          chunkSize + overlap * 2 * (chunkSize / segments),
          chunkSize + overlap * 2 * (chunkSize / segments),
          segments + 2 * overlap,
          segments + 2 * overlap
        );
        const positions = geometry.attributes.position.array as Float32Array;

        // Generate height data during chunk creation
        for (let z = -overlap; z <= segments + overlap; z++) {
          for (let x = -overlap; x <= segments + overlap; x++) {
            const i = (z + overlap) * (segments + 2 * overlap + 1) + (x + overlap);
            const worldX = (x / segments) * chunkSize + chunkX * chunkSize;
            const worldZ = (z / segments) * chunkSize + chunkZ * chunkSize;
            const height = perlin.fbm(worldX * 0.02, worldZ * 0.02, 4, 0.5, 2.2) * 6;
            positions[i * 3 + 2] = height;
          }
        }

        terrain = new THREE.Mesh(geometry, material);
        terrain.rotation.x = -Math.PI / 2;
        terrain.position.set(chunkX * chunkSize, 0, chunkZ * chunkSize);
        scene.add(terrain);
        terrainChunks.set(chunkKey, terrain);
      }
      return terrain;
    };

    const updateTerrain = () => {
      const cameraChunkX = Math.floor(cameraTarget.current.x / chunkSize);
      const cameraChunkZ = Math.floor(cameraTarget.current.z / chunkSize);

      // Create new chunks as needed
      for (let x = cameraChunkX - renderDistance; x <= cameraChunkX + renderDistance; x++) {
        for (let z = cameraChunkZ - renderDistance; z <= cameraChunkZ + renderDistance; z++) {
          getOrCreateChunk(x, z);
        }
      }

      // Remove distant chunks
      terrainChunks.forEach((chunk, key) => {
        const [chunkX, chunkZ] = key.split(',').map(Number);
        if (
          Math.abs(chunkX - cameraChunkX) > renderDistance ||
          Math.abs(chunkZ - cameraChunkZ) > renderDistance
        ) {
          scene.remove(chunk);
          terrainChunks.delete(key);
          if (chunk.geometry) chunk.geometry.dispose();
        }
      });
    };

    const lerp = (start: number, end: number, alpha: number) => start + alpha * (end - start);
    const animate = () => {
      speed.current.lerp(targetSpeed.current, 0.05);
      cameraTarget.current.add(speed.current);

      camera.position.x = lerp(camera.position.x, cameraTarget.current.x, 0.05);
      camera.position.y = lerp(camera.position.y, cameraTarget.current.y, 0.05);
      camera.position.z = lerp(camera.position.z, cameraTarget.current.z, 0.05);
      camera.lookAt(camera.position.x, 0, camera.position.z - 10);

      updateTerrain();
      renderer.render(scene, camera);
      frameIdRef.current = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
      containerRef.current?.removeChild(renderer.domElement);

      // Cleanup resources
      terrainChunks.forEach((chunk) => chunk.geometry?.dispose());
      material.dispose();
      renderer.dispose();
      scene.fog = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export default TerrainBackground;
