/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * Generates enhanced Perlin noise for terrain heightmaps using fractional Brownian motion (fBm)
 * Features:
 * - 3D noise generation using gradient vectors
 * - Consistent noise patterns via permutation tables
 * - Terrain generation with multiple octaves for natural appearance
 */
class TerrainNoiseGenerator {
  private readonly gradientVectors: number[][];
  private readonly basePermutation: number[];
  private readonly permutationTable: number[];

  constructor() {
    // Define gradient vectors for 3D noise (12 edges of a cube)
    this.gradientVectors = [
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

    // Create random permutation table for noise consistency
    this.basePermutation = Array.from({ length: 256 }, () => Math.floor(Math.random() * 256));

    // Double the permutation table to avoid overflow
    this.permutationTable = new Array(512);
    for (let i = 0; i < 512; i++) {
      this.permutationTable[i] = this.basePermutation[i & 255];
    }
  }

  /**
   * Calculates dot product between gradient and distance vectors
   * @param gradientIndex - Selected gradient vector from permutation table
   * @param x - X coordinate of distance vector
   * @param y - Y coordinate of distance vector
   * @returns Dot product result
   */
  private calculateGradientDot(gradientIndex: number[], x: number, y: number): number {
    return gradientIndex[0] * x + gradientIndex[1] * y;
  }

  /**
   * Generates 2D Perlin noise value at specified coordinates
   * @param x - X coordinate in noise space
   * @param y - Y coordinate in noise space
   * @returns Noise value between -1 and 1
   */
  generateNoise(x: number, y: number): number {
    // Constants for skewing and unskewing
    const skewFactor = 0.5 * (Math.sqrt(3.0) - 1.0); // Skewing factor
    const unskewFactor = (3.0 - Math.sqrt(3.0)) / 6.0; // Unskewing factor

    // Skew input space to determine simplex cell origin
    const skew = (x + y) * skewFactor;
    const [cellX, cellY] = [Math.floor(x + skew), Math.floor(y + skew)];
    const unskew = (cellX + cellY) * unskewFactor;

    // Unskew cell origin back to (x,y) space
    const [originX, originY] = [cellX - unskew, cellY - unskew];
    const [relativeX, relativeY] = [x - originX, y - originY];

    // Determine which simplex we're in and offsets for middle vertex
    const [offsetX, offsetY] =
      relativeX > relativeY
        ? [1, 0] // Upper triangle
        : [0, 1]; // Lower triangle

    // Calculate vertices coordinates
    const x1 = relativeX - offsetX + unskewFactor;
    const y1 = relativeY - offsetY + unskewFactor;
    const x2 = relativeX - 1.0 + 2.0 * unskewFactor;
    const y2 = relativeY - 1.0 + 2.0 * unskewFactor;

    // Calculate gradient indices for three corners
    const [gridX, gridY] = [cellX & 255, cellY & 255];
    const gradientIndices = [
      this.permutationTable[(gridX + this.permutationTable[gridY]) & 255] % 12,
      this.permutationTable[(gridX + offsetX + this.permutationTable[gridY + offsetY]) & 255] % 12,
      this.permutationTable[(gridX + 1 + this.permutationTable[gridY + 1]) & 255] % 12,
    ];

    /**
     * Calculate contribution from each corner
     * @param x - X coordinate relative to corner
     * @param y - Y coordinate relative to corner
     * @param gradientIndex - Index of gradient vector
     */
    const calculateCornerContribution = (x: number, y: number, gradientIndex: number): number => {
      const t = 0.5 - x * x - y * y;
      return t < 0
        ? 0.0
        : Math.pow(t, 4) * this.calculateGradientDot(this.gradientVectors[gradientIndex], x, y);
    };

    // Sum contributions from three corners
    const noise =
      70.0 *
      (calculateCornerContribution(relativeX, relativeY, gradientIndices[0]) +
        calculateCornerContribution(x1, y1, gradientIndices[1]) +
        calculateCornerContribution(x2, y2, gradientIndices[2]));

    return noise;
  }

  /**
   * Generate fractal Brownian motion (fBm) noise
   * Combines multiple octaves of noise for more natural-looking terrain
   */
  generateTerrainNoise(
    x: number,
    y: number,
    octaves = 4,
    persistence = 0.5,
    lacunarity = 2.0
  ): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    // Combine multiple octaves of noise
    for (let i = 0; i < octaves; i++) {
      total += this.generateNoise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence; // Decrease amplitude with each octave
      frequency *= lacunarity; // Increase frequency with each octave
    }

    // Normalize the result
    return total / maxValue;
  }
}

/**
 * Configuration for terrain generation and visualization
 * @property chunkSize - Size of each terrain chunk in world units
 * @property segments - Number of segments per chunk (affects mesh detail)
 * @property renderDistance - Number of chunks to render in each direction from camera
 * @property overlap - Overlap size between chunks to prevent visible seams
 * @property updateThreshold - Distance camera must move before updating chunks
 * @property heightScale - Vertical scale factor for terrain elevation
 * @property noiseScale - Scale factor for noise sampling coordinates
 * @property fogNear - Starting distance for fog effect
 * @property fogFar - Maximum distance for fog effect
 * @property cameraHeight - Initial vertical camera position
 * @property cameraDistance - Initial camera distance from target
 * @property moveSpeed - Camera movement speed vector
 * @property initialChunks - Minimum chunks required before scene is considered ready
 * @property chunkGenerationBatchSize - Chunks to generate per frame
 */
const TERRAIN_CONFIG = {
  chunkSize: 30,
  segments: 30,
  renderDistance: 2,
  overlap: 1,
  updateThreshold: 10,
  heightScale: 6,
  noiseScale: 0.02,
  fogNear: 15,
  fogFar: 50,
  cameraHeight: 5,
  cameraDistance: 10,
  moveSpeed: new THREE.Vector3(0.005, 0, 0.003),
  initialChunks: 1,
  chunkGenerationBatchSize: 1,
} as const;

/**
 * Configuration for falling stars.
 */
const FALLING_STAR_CONFIG = {
  starSize: 0.05,
  starColor: new THREE.Color(255, 255, 255),
  trailColor: new THREE.Color(0.9, 0.7, 0.2),
  velocity: new THREE.Vector3(-0.15, -0.08, -0.05), // Adjusted for more horizontal movement
  spawnProbability: 0.03,
  maxStars: 5, // Increased for more stars
  trailLength: 60, // Longer trails
  trailSize: 0.15,
  speed: 1.5, // Faster movement
  fadeFactor: 0.94, // Slower fade for longer visible trails
  spawnOffset: {
    // New configuration for spawn position
    x: { min: 30, max: 50 }, // Further to the right
    y: { min: 15, max: 25 }, // Higher up
    z: { min: -25, max: -10 }, // Varied depth
  },
} as const;

interface FallingStar {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  trail: THREE.Points;
  trailPositions: THREE.Vector3[];
  trailAlphas: Float32Array;
}

/**
 * Props for TerrainBackground component
 * @property onLoad - Optional callback triggered when initial terrain chunks are generated
 */
interface TerrainBackgroundProps {
  onLoad?: () => void;
}

/**
 * Infinite Terrain Background Component
 * Generates and renders an infinite procedural terrain using Three.js,
 * and intermittently spawns falling stars with configurable behavior.
 */
const TerrainBackground: React.FC<TerrainBackgroundProps> = ({ onLoad }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const cameraTargetPosition = useRef(
    new THREE.Vector3(0, TERRAIN_CONFIG.cameraHeight, TERRAIN_CONFIG.cameraDistance)
  );
  const currentSpeed = useRef(new THREE.Vector3());
  const lastChunkUpdatePosition = useRef(new THREE.Vector3());
  const [isInitialized, setIsInitialized] = useState(false);
  const chunkGenerationQueue = useRef<Array<[number, number]>>([]);
  const generatedChunks = useRef(0);

  // Store falling stars along with their trails.
  const fallingStars = useRef<FallingStar[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 60);
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'low-power',
    });

    // Pre-compile materials and geometries
    const terrainMaterial = new THREE.MeshBasicMaterial({
      wireframe: true,
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });

    // Setup renderer with pre-allocation hints
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(1);
    containerRef.current.appendChild(renderer.domElement);
    scene.fog = new THREE.Fog(0x000000, TERRAIN_CONFIG.fogNear, TERRAIN_CONFIG.fogFar);

    camera.position.set(0, TERRAIN_CONFIG.cameraHeight, TERRAIN_CONFIG.cameraDistance);
    camera.lookAt(0, 0, 0);

    const noiseGenerator = new TerrainNoiseGenerator();
    const terrainChunks = new Map();

    // Initialize chunk generation queue
    const initializeChunkQueue = () => {
      const cameraChunkX = Math.floor(camera.position.x / TERRAIN_CONFIG.chunkSize);
      const cameraChunkZ = Math.floor(camera.position.z / TERRAIN_CONFIG.chunkSize);

      for (
        let x = cameraChunkX - TERRAIN_CONFIG.renderDistance;
        x <= cameraChunkX + TERRAIN_CONFIG.renderDistance;
        x++
      ) {
        for (
          let z = cameraChunkZ - TERRAIN_CONFIG.renderDistance;
          z <= cameraChunkZ + TERRAIN_CONFIG.renderDistance;
          z++
        ) {
          chunkGenerationQueue.current.push([x, z]);
        }
      }
    };

    /**
     * Creates and returns a terrain chunk mesh at specified coordinates
     * @param chunkX - Chunk X coordinate in chunk space
     * @param chunkZ - Chunk Z coordinate in chunk space
     * @returns THREE.Mesh instance representing the terrain chunk
     */
    const getTerrainChunk = (chunkX: number, chunkZ: number) => {
      const chunkKey = `${chunkX},${chunkZ}`;
      if (terrainChunks.has(chunkKey)) return terrainChunks.get(chunkKey);

      const geometry = new THREE.PlaneGeometry(
        TERRAIN_CONFIG.chunkSize + TERRAIN_CONFIG.overlap * 2,
        TERRAIN_CONFIG.chunkSize + TERRAIN_CONFIG.overlap * 2,
        TERRAIN_CONFIG.segments + 2 * TERRAIN_CONFIG.overlap,
        TERRAIN_CONFIG.segments + 2 * TERRAIN_CONFIG.overlap
      );

      // Pre-allocate typed array for better memory efficiency
      const positions = new Float32Array(geometry.attributes.position.array);

      // Generate heightmap with optimized loop
      for (let i = 0; i < positions.length; i += 3) {
        const x = Math.floor(i / 3) % (TERRAIN_CONFIG.segments + 2 * TERRAIN_CONFIG.overlap + 1);
        const z = Math.floor(i / (3 * (TERRAIN_CONFIG.segments + 2 * TERRAIN_CONFIG.overlap + 1)));

        const worldX =
          ((x - TERRAIN_CONFIG.overlap) / TERRAIN_CONFIG.segments) * TERRAIN_CONFIG.chunkSize +
          chunkX * TERRAIN_CONFIG.chunkSize;
        const worldZ =
          ((z - TERRAIN_CONFIG.overlap) / TERRAIN_CONFIG.segments) * TERRAIN_CONFIG.chunkSize +
          chunkZ * TERRAIN_CONFIG.chunkSize;

        positions[i + 2] =
          noiseGenerator.generateTerrainNoise(
            worldX * TERRAIN_CONFIG.noiseScale,
            worldZ * TERRAIN_CONFIG.noiseScale
          ) * TERRAIN_CONFIG.heightScale;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const chunk = new THREE.Mesh(geometry, terrainMaterial);
      chunk.rotation.x = -Math.PI / 2;
      chunk.position.set(chunkX * TERRAIN_CONFIG.chunkSize, 0, chunkZ * TERRAIN_CONFIG.chunkSize);

      scene.add(chunk);
      terrainChunks.set(chunkKey, chunk);
      generatedChunks.current++;

      return chunk;
    };

    // Batch process chunks to distribute generation load
    const generateChunkBatch = () => {
      const batchSize = Math.min(
        TERRAIN_CONFIG.chunkGenerationBatchSize,
        chunkGenerationQueue.current.length
      );

      for (let i = 0; i < batchSize; i++) {
        const nextChunk = chunkGenerationQueue.current.shift();
        if (nextChunk) {
          const [x, z] = nextChunk;
          getTerrainChunk(x, z);
        }
      }

      // Check if we've generated enough chunks to consider the scene ready
      if (!isInitialized && generatedChunks.current >= TERRAIN_CONFIG.initialChunks) {
        setIsInitialized(true);
        onLoad?.();
      }
    };

    /**
     * Updates visible chunks based on camera position
     * - Generates new chunks within render distance
     * - Removes chunks outside render distance
     * - Manages chunk generation queue
     */
    const updateVisibleChunks = () => {
      const cameraChunkX = Math.floor(cameraTargetPosition.current.x / TERRAIN_CONFIG.chunkSize);
      const cameraChunkZ = Math.floor(cameraTargetPosition.current.z / TERRAIN_CONFIG.chunkSize);

      // Queue new chunks for generation
      for (
        let x = cameraChunkX - TERRAIN_CONFIG.renderDistance;
        x <= cameraChunkX + TERRAIN_CONFIG.renderDistance;
        x++
      ) {
        for (
          let z = cameraChunkZ - TERRAIN_CONFIG.renderDistance;
          z <= cameraChunkZ + TERRAIN_CONFIG.renderDistance;
          z++
        ) {
          const chunkKey = `${x},${z}`;
          if (
            !terrainChunks.has(chunkKey) &&
            !chunkGenerationQueue.current.some(([cx, cz]) => cx === x && cz === z)
          ) {
            chunkGenerationQueue.current.push([x, z]);
          }
        }
      }

      // Remove distant chunks
      terrainChunks.forEach((chunk, key) => {
        const [chunkX, chunkZ] = key.split(',').map(Number);
        if (
          Math.abs(chunkX - cameraChunkX) > TERRAIN_CONFIG.renderDistance ||
          Math.abs(chunkZ - cameraChunkZ) > TERRAIN_CONFIG.renderDistance
        ) {
          scene.remove(chunk);
          terrainChunks.delete(key);
          chunk.geometry.dispose();
        }
      });
    };

    /**
     * Creates a falling star along with its trail.
     */
    const createFallingStar = () => {
      // Comet head
      const starGeometry = new THREE.SphereGeometry(FALLING_STAR_CONFIG.starSize, 8, 8);
      const starMaterial = new THREE.MeshBasicMaterial({
        color: FALLING_STAR_CONFIG.starColor,
        transparent: true,
        opacity: 0.8,
      });
      const starMesh = new THREE.Mesh(starGeometry, starMaterial);

      // Starting position relative to camera
      const startX =
        camera.position.x +
        FALLING_STAR_CONFIG.spawnOffset.x.min +
        Math.random() *
          (FALLING_STAR_CONFIG.spawnOffset.x.max - FALLING_STAR_CONFIG.spawnOffset.x.min);
      const startY =
        camera.position.y +
        FALLING_STAR_CONFIG.spawnOffset.y.min +
        Math.random() *
          (FALLING_STAR_CONFIG.spawnOffset.y.max - FALLING_STAR_CONFIG.spawnOffset.y.min);
      const startZ =
        camera.position.z +
        FALLING_STAR_CONFIG.spawnOffset.z.min +
        Math.random() *
          (FALLING_STAR_CONFIG.spawnOffset.z.max - FALLING_STAR_CONFIG.spawnOffset.z.min);

      starMesh.position.set(startX, startY, startZ);

      // Comet trail (particle system)
      const trailGeometry = new THREE.BufferGeometry();
      const trailPositions = new Array(FALLING_STAR_CONFIG.trailLength)
        .fill(null)
        .map(() => starMesh.position.clone());

      const trailAlphas = new Float32Array(FALLING_STAR_CONFIG.trailLength).fill(0);
      const trailAttributes = {
        position: new THREE.BufferAttribute(
          new Float32Array(3 * FALLING_STAR_CONFIG.trailLength),
          3
        ),
        alpha: new THREE.BufferAttribute(trailAlphas, 1),
      };

      trailGeometry.setAttribute('position', trailAttributes.position);
      trailGeometry.setAttribute('alpha', trailAttributes.alpha);

      const trailMaterial = new THREE.PointsMaterial({
        color: FALLING_STAR_CONFIG.trailColor,
        size: FALLING_STAR_CONFIG.trailSize,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      // Custom shader for fading trail
      trailMaterial.onBeforeCompile = (shader) => {
        shader.vertexShader = `
          attribute float alpha;
          varying float vAlpha;
          ${shader.vertexShader}
        `.replace(
          '#include <begin_vertex>',
          `
          #include <begin_vertex>
          vAlpha = alpha;
        `
        );

        shader.fragmentShader = `
          varying float vAlpha;
          ${shader.fragmentShader}
        `.replace(
          '#include <color_fragment>',
          `
          #include <color_fragment>
          diffuseColor.a *= vAlpha;
        `
        );
      };

      const trail = new THREE.Points(trailGeometry, trailMaterial);

      scene.add(starMesh);
      scene.add(trail);

      fallingStars.current.push({
        mesh: starMesh,
        velocity: FALLING_STAR_CONFIG.velocity.clone().multiplyScalar(FALLING_STAR_CONFIG.speed),
        trail,
        trailPositions,
        trailAlphas,
      });
    };

    /**
     * Updates falling stars and their trails.
     */
    const updateFallingStars = () => {
      fallingStars.current.forEach((star, index) => {
        // Update comet position
        star.mesh.position.add(star.velocity);

        // Update trail positions and alphas
        star.trailPositions.unshift(star.mesh.position.clone());
        if (star.trailPositions.length > FALLING_STAR_CONFIG.trailLength) {
          star.trailPositions.pop();
        }

        // Update alpha values (fade out)
        star.trailAlphas = new Float32Array(
          star.trailPositions.map((_, i) => Math.pow(FALLING_STAR_CONFIG.fadeFactor, i) * 0.8)
        );

        // Update buffer attributes
        const positions = star.trail.geometry.attributes.position.array as Float32Array;
        const alphas = star.trail.geometry.attributes.alpha.array as Float32Array;

        star.trailPositions.forEach((pos, i) => {
          positions[i * 3] = pos.x;
          positions[i * 3 + 1] = pos.y;
          positions[i * 3 + 2] = pos.z;
          alphas[i] = star.trailAlphas[i];
        });

        star.trail.geometry.attributes.position.needsUpdate = true;
        star.trail.geometry.attributes.alpha.needsUpdate = true;

        // Remove old stars
        if (star.mesh.position.y < camera.position.y - 15) {
          scene.remove(star.mesh);
          scene.remove(star.trail);
          fallingStars.current.splice(index, 1);
        }
      });
    };

    const animate = () => {
      // Generate chunks in batches
      if (chunkGenerationQueue.current.length > 0) {
        generateChunkBatch();
      }

      // Spawn a new falling star per frame based on the spawn probability,
      // as long as we haven't reached the maximum number of stars.
      if (
        fallingStars.current.length < FALLING_STAR_CONFIG.maxStars &&
        Math.random() < FALLING_STAR_CONFIG.spawnProbability
      ) {
        createFallingStar();
      }

      updateFallingStars();

      // Use lerp for smooth camera movement
      currentSpeed.current.lerp(TERRAIN_CONFIG.moveSpeed, 0.02);
      cameraTargetPosition.current.add(currentSpeed.current);
      camera.position.lerp(cameraTargetPosition.current, 0.05);
      camera.lookAt(camera.position.x, 0, camera.position.z - TERRAIN_CONFIG.cameraDistance);

      if (
        Math.abs(cameraTargetPosition.current.x - lastChunkUpdatePosition.current.x) >
          TERRAIN_CONFIG.updateThreshold ||
        Math.abs(cameraTargetPosition.current.z - lastChunkUpdatePosition.current.z) >
          TERRAIN_CONFIG.updateThreshold
      ) {
        updateVisibleChunks();
        lastChunkUpdatePosition.current.copy(cameraTargetPosition.current);
      }

      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Initialize chunk generation queue before starting animation
    initializeChunkQueue();
    animate();

    // Cleanup function to prevent memory leaks
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      containerRef.current?.removeChild(renderer.domElement);

      // Dispose of Three.js resources
      terrainChunks.forEach((chunk) => {
        chunk.geometry.dispose();
        scene.remove(chunk);
      });
      terrainMaterial.dispose();
      renderer.dispose();
      fallingStars.current.forEach(({ mesh, trail }) => {
        mesh.geometry.dispose();
        trail.geometry.dispose();
        scene.remove(mesh);
        scene.remove(trail);
      });
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
      {!isInitialized && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#000',
            zIndex: 1,
          }}
        />
      )}
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
