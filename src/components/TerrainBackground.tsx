/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable react-hooks/exhaustive-deps */
import { Box, Button, Drawer, FormControlLabel, Slider, Switch, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { randomBetween } from '../utils/number';

// Storage key for terrain preferences
const TERRAIN_PREFERENCES_KEY = 'terrain_preferences';

// Define the terrain config type to avoid type issues when updating
interface TerrainConfig {
  chunkSize: number;
  segments: number;
  renderDistance: number;
  overlap: number;
  updateThreshold: number;
  heightScale: number;
  noiseScale: number;
  fogNear: number;
  fogFar: number;
  cameraHeight: number;
  cameraDistance: number;
  moveSpeed: THREE.Vector3;
  initialChunks: number;
  chunkGenerationBatchSize: number;
  wireframe: boolean;
  wireframeOpacity: number;
  antialias: boolean;
  pixelRatio: number;
  terrainColor: string;
}

/**
 * Generates enhanced Perlin noise for terrain heightmaps using fractional Brownian motion (fBm)
 * Features:
 * - 3D noise generation using gradient vectors
 * - Consistent noise patterns via permutation tables
 * - Terrain generation with multiple octaves for natural appearance
 * - Memoization for improved performance
 */
class TerrainNoiseGenerator {
  private readonly gradientVectors: number[][];
  private readonly permutationTable: number[];
  public readonly noiseCache: Map<string, number>;

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

    // Create and extend permutation table in a single operation - O(n) time
    const basePermutation = Array.from({ length: 256 }, () => Math.floor(Math.random() * 256));
    this.permutationTable = [...basePermutation, ...basePermutation];

    // Initialize cache for noise values
    this.noiseCache = new Map();
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
    // Cache key for the noise value - quantize to reduce cache size while maintaining quality
    const cacheKey = `${Math.round(x * 1000)},${Math.round(y * 1000)}`;

    // Check if we already computed this value - O(1) lookup
    if (this.noiseCache.has(cacheKey)) {
      return this.noiseCache.get(cacheKey)!;
    }

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

    // Calculate gradient indices for three corners - use bitwise AND for mod 255 operations
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

    // Cache the result - O(1) insertion
    this.noiseCache.set(cacheKey, noise);

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
    // Create cache key for terrain noise value with octaves
    const cacheKey = `${Math.round(x * 1000)},${Math.round(y * 1000)}_${octaves}_${persistence}_${lacunarity}`;

    // Check if we already computed this value - O(1) lookup
    if (this.noiseCache.has(cacheKey)) {
      return this.noiseCache.get(cacheKey)!;
    }

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
    const result = total / maxValue;

    // Cache the result - O(1) insertion
    this.noiseCache.set(cacheKey, result);

    return result;
  }

  /**
   * Clear the noise cache to free memory when needed
   */
  clearCache(): void {
    this.noiseCache.clear();
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
const DEFAULT_TERRAIN_CONFIG: TerrainConfig = {
  chunkSize: 30,
  segments: 30,
  renderDistance: 2,
  overlap: 1,
  updateThreshold: 10,
  heightScale: 6,
  noiseScale: 0.02,
  fogNear: 15,
  fogFar: 100,
  cameraHeight: 12,
  cameraDistance: 18,
  moveSpeed: new THREE.Vector3(0.005, 0, 0.003),
  initialChunks: 1,
  chunkGenerationBatchSize: 1,
  wireframe: true,
  wireframeOpacity: 0.4,
  antialias: false,
  pixelRatio: 1,
  terrainColor: '#ffffff',
};

// Quality presets for easy switching
interface QualityPreset {
  segments: number;
  renderDistance: number;
  antialias: boolean;
  pixelRatio: number;
}

const QUALITY_PRESETS: Record<string, QualityPreset> = {
  ultra: {
    segments: 60,
    renderDistance: 4,
    antialias: true,
    pixelRatio: 2,
  },
  high: {
    segments: 45,
    renderDistance: 3,
    antialias: true,
    pixelRatio: 1,
  },
  medium: {
    segments: 30,
    renderDistance: 2,
    antialias: false,
    pixelRatio: 1,
  },
  low: {
    segments: 20,
    renderDistance: 2,
    antialias: false,
    pixelRatio: 0.75,
  },
};

/**
 * Star configuration.
 * Stars will be generated in "chunks" so that we only keep nearby clusters in view.
 */
const DEFAULT_STAR_CONFIG = {
  chunkSize: 50, // size of a star chunk in world units
  renderDistance: 2, // number of chunks away from camera to keep
  starsPerChunk: 50, // number of stars per chunk
  chunkGenerationBatchSize: 1, // number of star chunks to generate per frame
  yRange: [5, 10] as [number, number], // vertical range for stars
  enabled: true,
  starSize: 0.3,
  starOpacity: 0.8,
};

/**
 * Props for TerrainBackground component
 * @property onLoad - Optional callback triggered when initial terrain chunks are generated
 */
interface TerrainBackgroundProps {
  onLoad?: () => void;
  settingsOpen?: boolean;
  onSettingsOpenChange?: (open: boolean) => void;
}

/**
 * Infinite Terrain Background Component.
 * Generates and renders an infinite procedural terrain (and stars) using Three.js.
 */
const TerrainBackground: React.FC<TerrainBackgroundProps> = ({
  onLoad,
  settingsOpen = false,
  onSettingsOpenChange,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const cameraTargetPosition = useRef(
    new THREE.Vector3(0, DEFAULT_TERRAIN_CONFIG.cameraHeight, DEFAULT_TERRAIN_CONFIG.cameraDistance)
  );
  const currentSpeed = useRef(new THREE.Vector3());
  const lastChunkUpdatePosition = useRef(new THREE.Vector3());
  const [isInitialized, setIsInitialized] = useState(false);
  const chunkGenerationQueue = useRef<Array<[number, number]>>([]);
  const generatedChunks = useRef(0);
  const [localSettingsOpen, setLocalSettingsOpen] = useState(settingsOpen);

  // Track previous chunk positions for reference
  const lastChunkX = useRef<number>(0);
  const lastChunkZ = useRef<number>(0);
  const lastStarChunkX = useRef<number>(0);
  const lastStarChunkZ = useRef<number>(0);

  // State for terrain and star settings
  const [terrainConfig, setTerrainConfig] = useState<TerrainConfig>({ ...DEFAULT_TERRAIN_CONFIG });
  const [starConfig, setStarConfig] = useState({ ...DEFAULT_STAR_CONFIG });
  const [currentQuality, setCurrentQuality] = useState<'custom' | keyof typeof QUALITY_PRESETS>(
    'medium'
  );
  const [needsRestart, setNeedsRestart] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Refs to store scene objects for settings updates
  const sceneRef = useRef<THREE.Scene | null>(null);
  const terrainMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // --- Star management refs ---
  const starChunkGenerationQueue = useRef<Array<[number, number]>>([]);
  const starChunksMap = useRef(new Map<string, THREE.Points>());

  // Create a ref to track if we're in the browser environment
  const isBrowser = typeof window !== 'undefined';

  // Add state for device pixel ratio to use after component has mounted
  const [devicePixelRatio, setDevicePixelRatio] = useState(1);

  // Update device pixel ratio after component has mounted
  useEffect(() => {
    if (isBrowser) {
      setDevicePixelRatio(window.devicePixelRatio || 1);
    }
  }, [isBrowser]);

  // Save preferences when they change
  const savePreferences = (configToSave?: {
    terrainConfig?: TerrainConfig;
    starConfig?: typeof DEFAULT_STAR_CONFIG;
    currentQuality?: 'custom' | keyof typeof QUALITY_PRESETS;
  }) => {
    if (typeof window === 'undefined') return;

    try {
      // Create a copy of terrain config without camera settings
      const sourceTerrainConfig = configToSave?.terrainConfig || terrainConfig;

      // Extract only the properties we want to save (excluding camera settings)
      const terrainConfigWithoutCamera = {
        chunkSize: sourceTerrainConfig.chunkSize,
        segments: sourceTerrainConfig.segments,
        renderDistance: sourceTerrainConfig.renderDistance,
        overlap: sourceTerrainConfig.overlap,
        updateThreshold: sourceTerrainConfig.updateThreshold,
        heightScale: sourceTerrainConfig.heightScale,
        noiseScale: sourceTerrainConfig.noiseScale,
        fogNear: sourceTerrainConfig.fogNear,
        fogFar: sourceTerrainConfig.fogFar,
        moveSpeed: sourceTerrainConfig.moveSpeed,
        initialChunks: sourceTerrainConfig.initialChunks,
        chunkGenerationBatchSize: sourceTerrainConfig.chunkGenerationBatchSize,
        wireframe: sourceTerrainConfig.wireframe,
        wireframeOpacity: sourceTerrainConfig.wireframeOpacity,
        antialias: sourceTerrainConfig.antialias,
        pixelRatio: sourceTerrainConfig.pixelRatio,
        terrainColor: sourceTerrainConfig.terrainColor,
      };

      const prefsToSave = {
        terrainConfig: terrainConfigWithoutCamera,
        starConfig: configToSave?.starConfig || starConfig,
        currentQuality: configToSave?.currentQuality || currentQuality,
      };
      localStorage.setItem(TERRAIN_PREFERENCES_KEY, JSON.stringify(prefsToSave));
    } catch (error) {
      enqueueSnackbar('Error saving terrain preferences: ' + error, {
        variant: 'error',
      });
    }
  };

  // Load saved preferences on component mount
  // This MUST run before Three.js initialization to ensure settings are applied correctly
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedPrefs = localStorage.getItem(TERRAIN_PREFERENCES_KEY);
      if (savedPrefs) {
        const parsedPrefs = JSON.parse(savedPrefs);
        // Handle moveSpeed which is a THREE.Vector3 and needs special parsing
        if (parsedPrefs.terrainConfig) {
          if (parsedPrefs.terrainConfig.moveSpeed) {
            const { x, y, z } = parsedPrefs.terrainConfig.moveSpeed;
            parsedPrefs.terrainConfig.moveSpeed = new THREE.Vector3(x, y, z);
          }

          // Always use default camera settings instead of saved values
          setTerrainConfig((prev) => ({
            ...prev,
            ...parsedPrefs.terrainConfig,
            // Override with default camera settings
            cameraHeight: DEFAULT_TERRAIN_CONFIG.cameraHeight,
            cameraDistance: DEFAULT_TERRAIN_CONFIG.cameraDistance,
          }));
        }
        if (parsedPrefs.starConfig) {
          setStarConfig((prev) => ({ ...prev, ...parsedPrefs.starConfig }));
        }
        if (parsedPrefs.currentQuality) {
          setCurrentQuality(parsedPrefs.currentQuality);
        }
      }
      // Mark preferences as loaded (whether they exist or not)
      setPreferencesLoaded(true);
    } catch (error) {
      enqueueSnackbar('Error loading terrain preferences: ' + error, {
        variant: 'error',
      });
      // Even in case of error, mark as loaded to allow initialization
      setPreferencesLoaded(true);
    }
    // We intentionally don't include enqueueSnackbar in dependencies to avoid re-running on snackbar changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to handle terrain config changes
  const handleTerrainConfigChange = (property: string, value: any) => {
    setTerrainConfig((prev) => {
      const updated = { ...prev, [property]: value };

      // Check if the property change requires a restart
      if (
        [
          'antialias',
          'pixelRatio',
          'segments',
          'renderDistance',
          'chunkSize',
          'overlap',
          'heightScale',
          'noiseScale',
          'fogNear',
          'fogFar',
          'moveSpeed',
          'initialChunks',
          'chunkGenerationBatchSize',
        ].includes(property)
      ) {
        setCurrentQuality('custom');
        setNeedsRestart(true);
      }

      // Apply pixelRatio change immediately if possible
      if (property === 'pixelRatio' && rendererRef.current) {
        rendererRef.current.setPixelRatio(value);
      }

      // Save preferences after update with the updated config
      savePreferences({ terrainConfig: updated, currentQuality: 'custom' });

      return updated;
    });
  };

  const handleStarConfigChange = (property: string, value: any) => {
    setStarConfig((prev) => {
      const updated = { ...prev, [property]: value };

      // Properties that require restart
      if (
        [
          'chunkSize',
          'renderDistance',
          'starsPerChunk',
          'chunkGenerationBatchSize',
          'yRange',
        ].includes(property)
      ) {
        setNeedsRestart(true);
      }

      // Save preferences after update with the updated config
      savePreferences({ starConfig: updated });

      return updated;
    });
  };

  // Function to handle quality preset changes
  const handleQualityPresetChange = (preset: keyof typeof QUALITY_PRESETS) => {
    setCurrentQuality(preset);
    setTerrainConfig((prev) => {
      const updated = { ...prev, ...QUALITY_PRESETS[preset] };
      setNeedsRestart(true);

      // Save preferences after update with updated quality and config
      savePreferences({ terrainConfig: updated, currentQuality: preset });

      return updated;
    });
  };

  useEffect(() => {
    if (!containerRef.current || !isBrowser || !preferencesLoaded) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 60);
    const renderer = new THREE.WebGLRenderer({
      antialias: terrainConfig.antialias,
      alpha: true,
      powerPreference: 'low-power',
    });
    rendererRef.current = renderer;

    // Pre-compile materials and geometries for terrain
    const terrainMaterial = new THREE.MeshBasicMaterial({
      wireframe: terrainConfig.wireframe,
      color: new THREE.Color(terrainConfig.terrainColor),
      transparent: true,
      opacity: terrainConfig.wireframeOpacity,
      depthWrite: false,
    });
    terrainMaterialRef.current = terrainMaterial;

    // Create and cache shared geometry for better memory usage
    const sharedGeometryCache = new Map<string, THREE.PlaneGeometry>();

    /**
     * Gets or creates a shared terrain geometry for the given parameters
     * This drastically reduces memory usage when many chunks share the same geometry settings
     */
    const getSharedGeometry = (
      chunkSize: number,
      overlap: number,
      segments: number
    ): THREE.PlaneGeometry => {
      // Create a cache key based on geometry parameters
      const cacheKey = `${chunkSize}_${overlap}_${segments}`;

      if (sharedGeometryCache.has(cacheKey)) {
        return sharedGeometryCache.get(cacheKey)!;
      }

      // Create and cache new geometry
      const geometry = new THREE.PlaneGeometry(
        chunkSize + overlap * 2,
        chunkSize + overlap * 2,
        segments + 2 * overlap,
        segments + 2 * overlap
      );
      sharedGeometryCache.set(cacheKey, geometry);
      return geometry;
    };

    // Setup renderer with pre-allocation hints
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(terrainConfig.pixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    scene.fog = new THREE.Fog(0x000000, terrainConfig.fogNear, terrainConfig.fogFar);

    // Set camera position from current config
    camera.position.set(0, terrainConfig.cameraHeight, terrainConfig.cameraDistance);
    camera.lookAt(
      camera.position.x,
      terrainConfig.cameraHeight * 0.4, // Look slightly downward from higher position
      camera.position.z - terrainConfig.cameraDistance
    );

    // Initialize camera target position with the current config values
    cameraTargetPosition.current = new THREE.Vector3(
      0,
      terrainConfig.cameraHeight,
      terrainConfig.cameraDistance
    );

    // Create noise generator with memory cache
    const noiseGenerator = new TerrainNoiseGenerator();
    // Use Map for O(1) lookups of chunks by coordinates
    const terrainChunks = new Map<string, THREE.Mesh>();
    // Track which chunks are currently in the generation queue to avoid duplicates - O(1) lookups
    const pendingChunks = new Set<string>();

    /**
     * Get chunk key from coordinates - consistently used to identify chunks
     * @param x - Chunk X coordinate
     * @param z - Chunk Z coordinate
     * @returns String key for the chunk
     */
    const getChunkKey = (x: number, z: number): string => `${x},${z}`;

    // Initialize terrain chunk generation queue based on camera position
    const initializeChunkQueue = () => {
      const cameraChunkX = Math.floor(camera.position.x / terrainConfig.chunkSize);
      const cameraChunkZ = Math.floor(camera.position.z / terrainConfig.chunkSize);

      // Clear any existing queue
      chunkGenerationQueue.current = [];
      pendingChunks.clear();

      // Use simple rectangular pattern for chunk initialization
      for (
        let x = cameraChunkX - terrainConfig.renderDistance;
        x <= cameraChunkX + terrainConfig.renderDistance;
        x++
      ) {
        for (
          let z = cameraChunkZ - terrainConfig.renderDistance;
          z <= cameraChunkZ + terrainConfig.renderDistance;
          z++
        ) {
          const chunkKey = getChunkKey(x, z);
          if (!terrainChunks.has(chunkKey)) {
            chunkGenerationQueue.current.push([x, z]);
            pendingChunks.add(chunkKey);
          }
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
      const chunkKey = getChunkKey(chunkX, chunkZ);
      if (terrainChunks.has(chunkKey)) return terrainChunks.get(chunkKey);

      // Remove from pending chunks when processed
      pendingChunks.delete(chunkKey);

      // Get a shared base geometry - improves memory usage
      const sharedGeometry = getSharedGeometry(
        terrainConfig.chunkSize,
        terrainConfig.overlap,
        terrainConfig.segments
      );

      // Clone the geometry for this specific chunk's height modifications
      // Using clone() is much more efficient than creating new geometries
      const geometry = sharedGeometry.clone();

      // Get direct reference to position attribute for faster access - O(1)
      const positionsArray = geometry.attributes.position.array as Float32Array;
      const segmentsWithOverlap = terrainConfig.segments + 2 * terrainConfig.overlap + 1;

      // Calculate constant factors outside the loop for better performance
      const xFactor = terrainConfig.chunkSize / terrainConfig.segments;
      const zFactor = terrainConfig.chunkSize / terrainConfig.segments;
      const noiseScale = terrainConfig.noiseScale;
      const heightScale = terrainConfig.heightScale;

      // Generate heightmap with optimized loop - O(n²) where n is segments
      for (let i = 0; i < positionsArray.length; i += 3) {
        // Use integer division for vertex indices - faster than modulo
        const vertexIndex = i / 3;
        const x = vertexIndex % segmentsWithOverlap;
        const z = Math.floor(vertexIndex / segmentsWithOverlap);

        const worldX = (x - terrainConfig.overlap) * xFactor + chunkX * terrainConfig.chunkSize;
        const worldZ = (z - terrainConfig.overlap) * zFactor + chunkZ * terrainConfig.chunkSize;

        // Update height directly in the position array
        positionsArray[i + 2] =
          noiseGenerator.generateTerrainNoise(worldX * noiseScale, worldZ * noiseScale) *
          heightScale;
      }

      // We must tell Three.js that the attributes have changed
      geometry.attributes.position.needsUpdate = true;

      const chunk = new THREE.Mesh(geometry, terrainMaterial);
      chunk.rotation.x = -Math.PI / 2;
      chunk.position.set(chunkX * terrainConfig.chunkSize, 0, chunkZ * terrainConfig.chunkSize);

      scene.add(chunk);
      terrainChunks.set(chunkKey, chunk);
      generatedChunks.current++;

      return chunk;
    };

    // Batch process terrain chunks to distribute generation load - O(batchSize)
    const generateChunkBatch = () => {
      const batchSize = Math.min(
        terrainConfig.chunkGenerationBatchSize,
        chunkGenerationQueue.current.length
      );

      if (batchSize === 0) return;

      // Process the batch
      for (let i = 0; i < batchSize; i++) {
        const nextChunk = chunkGenerationQueue.current.shift();
        if (nextChunk) {
          const [x, z] = nextChunk;
          getTerrainChunk(x, z);
        }
      }

      // Check if we've generated enough terrain chunks to consider the scene ready
      if (!isInitialized && generatedChunks.current >= terrainConfig.initialChunks) {
        setIsInitialized(true);
        onLoad?.();
      }
    };

    /**
     * Updates visible terrain chunks based on camera position
     * - Generates new chunks within render distance
     * - Removes chunks outside render distance
     * - Manages chunk generation queue
     */
    const updateVisibleChunks = () => {
      const cameraChunkX = Math.floor(cameraTargetPosition.current.x / terrainConfig.chunkSize);
      const cameraChunkZ = Math.floor(cameraTargetPosition.current.z / terrainConfig.chunkSize);

      // Queue new terrain chunks for generation
      for (
        let x = cameraChunkX - terrainConfig.renderDistance;
        x <= cameraChunkX + terrainConfig.renderDistance;
        x++
      ) {
        for (
          let z = cameraChunkZ - terrainConfig.renderDistance;
          z <= cameraChunkZ + terrainConfig.renderDistance;
          z++
        ) {
          const chunkKey = getChunkKey(x, z);
          if (
            !terrainChunks.has(chunkKey) &&
            !chunkGenerationQueue.current.some(([cx, cz]) => cx === x && cz === z) &&
            !pendingChunks.has(chunkKey)
          ) {
            chunkGenerationQueue.current.push([x, z]);
            pendingChunks.add(chunkKey);
          }
        }
      }

      // Remove distant terrain chunks
      terrainChunks.forEach((chunk, key) => {
        const [chunkX, chunkZ] = key.split(',').map(Number);
        if (
          Math.abs(chunkX - cameraChunkX) > terrainConfig.renderDistance ||
          Math.abs(chunkZ - cameraChunkZ) > terrainConfig.renderDistance
        ) {
          scene.remove(chunk);
          terrainChunks.delete(key);
          chunk.geometry.dispose();
        }
      });

      // Periodically clear the noise cache if it becomes too large
      if (generatedChunks.current % 10 === 0 && noiseGenerator.noiseCache.size > 5000) {
        noiseGenerator.clearCache();
      }
    };

    // --- Star chunk functions ---

    /**
     * Creates and returns a star chunk (as THREE.Points) at the specified chunk coordinates.
     */
    const getStarChunk = (chunkX: number, chunkZ: number) => {
      const chunkKey = getChunkKey(chunkX, chunkZ);
      if (starChunksMap.current.has(chunkKey)) return starChunksMap.current.get(chunkKey);

      const geometry = new THREE.BufferGeometry();
      const starCount = starConfig.starsPerChunk;
      const positions = new Float32Array(starCount * 3);

      // Generate stars at random positions within the chunk - O(starsPerChunk)
      for (let i = 0; i < starCount; i++) {
        const offsetX = randomBetween(0, starConfig.chunkSize);
        const offsetZ = randomBetween(0, starConfig.chunkSize);
        const worldX = chunkX * starConfig.chunkSize + offsetX;
        const worldZ = chunkZ * starConfig.chunkSize + offsetZ;
        const worldY = randomBetween(starConfig.yRange[0], starConfig.yRange[1]);

        // Direct array access for better performance
        const idx = i * 3;
        positions[idx] = worldX;
        positions[idx + 1] = worldY;
        positions[idx + 2] = worldZ;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      // Create texture loader - reuse textures with a static cache to avoid duplicate loading
      const texturePath = Math.random() > 0.5 ? '/images/sp1.png' : '/images/sp2.png';

      // Use a shared texture loader with memoization
      const material = createStarMaterial(texturePath);

      const starChunk = new THREE.Points(geometry, material);
      // Apply visibility from config
      starChunk.visible = starConfig.enabled;
      scene.add(starChunk);
      starChunksMap.current.set(chunkKey, starChunk);
      return starChunk;
    };

    // Cached texture loader for star textures
    const textureCache = new Map<string, THREE.Texture>();
    const loader = new THREE.TextureLoader();

    /**
     * Creates a star material with the specified texture, using caching for better performance
     */
    const createStarMaterial = (texturePath: string): THREE.PointsMaterial => {
      // Check if texture is already loaded
      let texture: THREE.Texture;

      if (textureCache.has(texturePath)) {
        texture = textureCache.get(texturePath)!;
      } else {
        texture = loader.load(texturePath);
        textureCache.set(texturePath, texture);
      }

      return new THREE.PointsMaterial({
        size: starConfig.starSize,
        map: texture,
        transparent: true,
        opacity: starConfig.starOpacity,
        fog: false,
        depthWrite: false, // Better blending
        blending: THREE.AdditiveBlending, // Creates a glowing effect
      });
    };

    /**
     * Initialize the star chunk generation queue based on camera position.
     */
    const initializeStarChunkQueue = () => {
      const cameraStarChunkX = Math.floor(camera.position.x / starConfig.chunkSize);
      const cameraStarChunkZ = Math.floor(camera.position.z / starConfig.chunkSize);

      // Clear existing queue
      starChunkGenerationQueue.current = [];

      // Use simple rectangular pattern for chunk initialization
      for (
        let x = cameraStarChunkX - starConfig.renderDistance;
        x <= cameraStarChunkX + starConfig.renderDistance;
        x++
      ) {
        for (
          let z = cameraStarChunkZ - starConfig.renderDistance;
          z <= cameraStarChunkZ + starConfig.renderDistance;
          z++
        ) {
          const chunkKey = getChunkKey(x, z);
          if (!starChunksMap.current.has(chunkKey)) {
            starChunkGenerationQueue.current.push([x, z]);
          }
        }
      }
    };

    /**
     * Batch process star chunks to distribute generation load.
     */
    const generateStarChunkBatch = () => {
      const batchSize = Math.min(
        starConfig.chunkGenerationBatchSize,
        starChunkGenerationQueue.current.length
      );

      if (batchSize === 0) return;

      for (let i = 0; i < batchSize; i++) {
        const nextChunk = starChunkGenerationQueue.current.shift();
        if (nextChunk) {
          const [x, z] = nextChunk;
          getStarChunk(x, z);
        }
      }
    };

    /**
     * Updates visible star chunks based on camera position.
     */
    const updateVisibleStarChunks = () => {
      const cameraChunkX = Math.floor(cameraTargetPosition.current.x / starConfig.chunkSize);
      const cameraChunkZ = Math.floor(cameraTargetPosition.current.z / starConfig.chunkSize);

      // Queue new star chunks for generation
      for (
        let x = cameraChunkX - starConfig.renderDistance;
        x <= cameraChunkX + starConfig.renderDistance;
        x++
      ) {
        for (
          let z = cameraChunkZ - starConfig.renderDistance;
          z <= cameraChunkZ + starConfig.renderDistance;
          z++
        ) {
          const chunkKey = getChunkKey(x, z);
          if (
            !starChunksMap.current.has(chunkKey) &&
            !starChunkGenerationQueue.current.some(([cx, cz]) => cx === x && cz === z)
          ) {
            starChunkGenerationQueue.current.push([x, z]);
          }
        }
      }

      // Remove star chunks that are too far away
      starChunksMap.current.forEach((starChunk, key) => {
        const [chunkX, chunkZ] = key.split(',').map(Number);
        if (
          Math.abs(chunkX - cameraChunkX) > starConfig.renderDistance ||
          Math.abs(chunkZ - cameraChunkZ) > starConfig.renderDistance
        ) {
          scene.remove(starChunk);
          starChunk.geometry.dispose();
          if (Array.isArray(starChunk.material)) {
            starChunk.material.forEach((m) => m.dispose());
          } else {
            starChunk.material.dispose();
          }
          starChunksMap.current.delete(key);
        }
      });
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Initialize terrain and star chunk generation queues before starting animation
    initializeChunkQueue();
    initializeStarChunkQueue();

    /**
     * Animation loop with frame rate limiting and performance optimizations.
     */
    const animate = () => {
      // Generate chunks in batches with prioritization
      if (chunkGenerationQueue.current.length > 0) {
        generateChunkBatch();
      } else if (starChunkGenerationQueue.current.length > 0) {
        // Only generate star chunks if terrain is complete
        generateStarChunkBatch();
      }

      // Use lerp for smooth camera movement
      currentSpeed.current.lerp(terrainConfig.moveSpeed, 0.02);
      cameraTargetPosition.current.add(currentSpeed.current);
      camera.position.lerp(cameraTargetPosition.current, 0.05);
      camera.lookAt(camera.position.x, 0, camera.position.z - terrainConfig.cameraDistance);

      // Check if camera has moved enough to update chunks - avoid unnecessary updates
      const dx = Math.abs(cameraTargetPosition.current.x - lastChunkUpdatePosition.current.x);
      const dz = Math.abs(cameraTargetPosition.current.z - lastChunkUpdatePosition.current.z);

      if (dx > terrainConfig.updateThreshold || dz > terrainConfig.updateThreshold) {
        // Update visible chunks for both terrain and stars
        updateVisibleChunks();
        updateVisibleStarChunks();

        // Update camera position tracker
        lastChunkUpdatePosition.current.copy(cameraTargetPosition.current);

        // Update tracking variables for optimization
        lastChunkX.current = Math.floor(cameraTargetPosition.current.x / terrainConfig.chunkSize);
        lastChunkZ.current = Math.floor(cameraTargetPosition.current.z / terrainConfig.chunkSize);
        lastStarChunkX.current = Math.floor(cameraTargetPosition.current.x / starConfig.chunkSize);
        lastStarChunkZ.current = Math.floor(cameraTargetPosition.current.z / starConfig.chunkSize);
      }

      // Always render every frame to ensure smooth animation
      renderer.render(scene, camera);

      // Schedule the next frame at the end of the function
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start the animation loop
    animate();

    // Function to restart the terrain rendering with new settings
    const restartTerrain = () => {
      // Clean up existing resources
      terrainChunks.forEach((chunk) => {
        scene.remove(chunk);
        chunk.geometry.dispose();
      });
      terrainChunks.clear();

      // Clean up existing star chunks
      starChunksMap.current.forEach((starChunk) => {
        scene.remove(starChunk);
        starChunk.geometry.dispose();
        if (Array.isArray(starChunk.material)) {
          starChunk.material.forEach((m) => m.dispose());
        } else {
          starChunk.material.dispose();
        }
      });
      starChunksMap.current.clear();
      starChunkGenerationQueue.current = [];

      // Update terrain material with current settings
      if (terrainMaterialRef.current) {
        terrainMaterialRef.current.wireframe = terrainConfig.wireframe;
        terrainMaterialRef.current.opacity = terrainConfig.wireframeOpacity;
        terrainMaterialRef.current.color = new THREE.Color(terrainConfig.terrainColor);
      }

      // Reset camera and generation state
      generatedChunks.current = 0;
      chunkGenerationQueue.current = [];

      // Update camera and target position with current settings
      camera.position.y = terrainConfig.cameraHeight;
      camera.position.z = terrainConfig.cameraDistance;
      camera.lookAt(
        camera.position.x,
        terrainConfig.cameraHeight * 0.4,
        camera.position.z - terrainConfig.cameraDistance
      );

      // Update the camera target position
      cameraTargetPosition.current.y = terrainConfig.cameraHeight;
      cameraTargetPosition.current.z = terrainConfig.cameraDistance;

      // Re-initialize chunks
      initializeChunkQueue();
      // Re-initialize star chunks
      initializeStarChunkQueue();
      setNeedsRestart(false);
    };

    // Add restart listener
    if (needsRestart) {
      restartTerrain();
    }

    // Cleanup function to prevent memory leaks
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      containerRef.current?.removeChild(renderer.domElement);

      // Dispose of terrain chunks
      terrainChunks.forEach((chunk) => {
        chunk.geometry.dispose();
        scene.remove(chunk);
      });
      terrainMaterial.dispose();

      // Dispose of star chunks
      starChunksMap.current.forEach((starChunk) => {
        starChunk.geometry.dispose();
        if (Array.isArray(starChunk.material)) {
          starChunk.material.forEach((m) => m.dispose());
        } else {
          starChunk.material.dispose();
        }
        scene.remove(starChunk);
      });

      // Dispose of shared geometries
      sharedGeometryCache.forEach((geometry) => {
        geometry.dispose();
      });
      sharedGeometryCache.clear();

      // Dispose of textures
      textureCache.forEach((texture) => {
        texture.dispose();
      });
      textureCache.clear();

      // Clear caches to help garbage collection
      noiseGenerator.clearCache();

      renderer.dispose();
    };
  }, [needsRestart, isBrowser, preferencesLoaded]);

  // Additional effect for handling starConfig and terrainConfig changes that don't need full scene recreation
  useEffect(() => {
    if (!sceneRef.current || !terrainMaterialRef.current) return;

    // Update terrain material
    terrainMaterialRef.current.wireframe = terrainConfig.wireframe;
    terrainMaterialRef.current.opacity = terrainConfig.wireframeOpacity;
    terrainMaterialRef.current.color = new THREE.Color(terrainConfig.terrainColor);

    // Update star visibility
    starChunksMap.current.forEach((chunk) => {
      chunk.visible = starConfig.enabled;

      if (!Array.isArray(chunk.material)) {
        (chunk.material as THREE.PointsMaterial).size = starConfig.starSize;
        (chunk.material as THREE.PointsMaterial).opacity = starConfig.starOpacity;
      }
    });

    // Update camera target position when camera settings change
    // This allows for smooth transition to new height/distance
    if (cameraTargetPosition.current) {
      cameraTargetPosition.current.y = terrainConfig.cameraHeight;
      cameraTargetPosition.current.z = terrainConfig.cameraDistance;
    }
  }, [
    terrainConfig.wireframe,
    terrainConfig.wireframeOpacity,
    terrainConfig.terrainColor,
    terrainConfig.cameraHeight,
    terrainConfig.cameraDistance,
    starConfig.enabled,
    starConfig.starSize,
    starConfig.starOpacity,
  ]);

  // Update local state when prop changes
  useEffect(() => {
    setLocalSettingsOpen(settingsOpen);
  }, [settingsOpen]);

  // Notify parent component when settings open state changes locally
  const handleSettingsOpenChange = (open: boolean) => {
    setLocalSettingsOpen(open);
    if (onSettingsOpenChange) {
      onSettingsOpenChange(open);
    }
  };

  return (
    <>
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

      {/* Settings Drawer */}
      <Drawer
        anchor="left"
        open={localSettingsOpen}
        onClose={() => handleSettingsOpenChange(false)}
        PaperProps={{
          sx: {
            width: { xs: '80%', sm: 350 },
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            color: 'white',
            padding: 3,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'medium' }}>
            Terrain Settings
          </Typography>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => {
              const defaultTerrainConfig = { ...DEFAULT_TERRAIN_CONFIG };
              const defaultStarConfig = { ...DEFAULT_STAR_CONFIG };
              setTerrainConfig(defaultTerrainConfig);
              setStarConfig(defaultStarConfig);
              setCurrentQuality('medium');
              setNeedsRestart(true);
              savePreferences({
                terrainConfig: defaultTerrainConfig,
                starConfig: defaultStarConfig,
                currentQuality: 'medium',
              });
            }}
            sx={{ borderColor: 'rgba(255,77,77,0.5)', color: '#ff6666' }}
          >
            Reset
          </Button>
        </Box>

        {/* Quality presets */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Quality Preset
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
              justifyContent: 'space-between',
            }}
          >
            {Object.keys(QUALITY_PRESETS).map((preset) => (
              <Button
                key={preset}
                variant={currentQuality === preset ? 'contained' : 'outlined'}
                size="small"
                onClick={() => handleQualityPresetChange(preset as keyof typeof QUALITY_PRESETS)}
                sx={{
                  minWidth: 0,
                  flex: '1 0 auto',
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  textTransform: 'capitalize',
                  '&.MuiButton-contained': {
                    backgroundColor: '#304FFE',
                  },
                }}
              >
                {preset}
              </Button>
            ))}
          </Box>

          {needsRestart && (
            <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(255,255,0,0.2)', borderRadius: 1 }}>
              <Typography variant="caption" sx={{ color: 'yellow', display: 'block', mb: 1 }}>
                Some changes require restarting the terrain renderer.
              </Typography>
              <Button
                size="small"
                variant="contained"
                fullWidth
                onClick={() => {
                  // Force a restart by toggling needsRestart to false and back to true
                  // This will trigger the useEffect to run again
                  setNeedsRestart(false);
                  setTimeout(() => setNeedsRestart(true), 0);
                }}
                sx={{
                  backgroundColor: 'rgba(255, 255, 0, 0.5)',
                  color: 'black',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 0, 0.7)',
                  },
                }}
              >
                Apply & Restart Renderer
              </Button>
            </Box>
          )}
        </Box>

        {/* Rendering settings */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Rendering
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={terrainConfig.antialias}
                onChange={(e) => handleTerrainConfigChange('antialias', e.target.checked)}
                color="primary"
              />
            }
            label="Anti-aliasing"
          />
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" gutterBottom>
              Terrain Detail
            </Typography>
            <Slider
              value={terrainConfig.segments}
              onChange={(_, value) => handleTerrainConfigChange('segments', value)}
              min={10}
              max={60}
              step={5}
              valueLabelDisplay="auto"
              sx={{ color: 'white' }}
            />
          </Box>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" gutterBottom>
              Render Distance
            </Typography>
            <Slider
              value={terrainConfig.renderDistance}
              onChange={(_, value) => handleTerrainConfigChange('renderDistance', value)}
              min={2}
              max={5}
              step={1}
              valueLabelDisplay="auto"
              sx={{ color: 'white' }}
            />
          </Box>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" gutterBottom>
              Pixel Ratio
            </Typography>
            <Slider
              value={terrainConfig.pixelRatio}
              onChange={(_, value) => handleTerrainConfigChange('pixelRatio', value)}
              min={0.5}
              max={Math.min(2, devicePixelRatio)}
              step={0.25}
              valueLabelDisplay="auto"
              marks={[
                { value: 0.5, label: 'Low' },
                { value: 1, label: 'Normal' },
                { value: Math.min(2, devicePixelRatio), label: 'High' },
              ]}
              sx={{ color: 'white' }}
            />
          </Box>
        </Box>

        {/* Wireframe settings */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Wireframe
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={terrainConfig.wireframe}
                onChange={(e) => handleTerrainConfigChange('wireframe', e.target.checked)}
                color="primary"
              />
            }
            label="Enable Wireframe"
          />
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" gutterBottom>
              Wireframe Opacity
            </Typography>
            <Slider
              value={terrainConfig.wireframeOpacity}
              onChange={(_, value) => handleTerrainConfigChange('wireframeOpacity', value)}
              min={0.1}
              max={1}
              step={0.1}
              valueLabelDisplay="auto"
              sx={{ color: 'white' }}
            />
          </Box>
        </Box>

        {/* Terrain shape settings */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Terrain Shape
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" gutterBottom>
              Height Scale
            </Typography>
            <Slider
              value={terrainConfig.heightScale}
              onChange={(_, value) => handleTerrainConfigChange('heightScale', value)}
              min={1}
              max={20}
              step={1}
              valueLabelDisplay="auto"
              sx={{ color: 'white' }}
            />
          </Box>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" gutterBottom>
              Noise Scale
            </Typography>
            <Slider
              value={terrainConfig.noiseScale}
              onChange={(_, value) => handleTerrainConfigChange('noiseScale', value)}
              min={0.005}
              max={0.05}
              step={0.005}
              valueLabelDisplay="auto"
              sx={{ color: 'white' }}
            />
          </Box>
        </Box>

        {/* Star settings */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Stars
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={starConfig.enabled}
                onChange={(e) => handleStarConfigChange('enabled', e.target.checked)}
                color="primary"
              />
            }
            label="Show Stars"
          />
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" gutterBottom>
              Star Size
            </Typography>
            <Slider
              value={starConfig.starSize}
              onChange={(_, value) => handleStarConfigChange('starSize', value)}
              min={0.1}
              max={1}
              step={0.1}
              valueLabelDisplay="auto"
              disabled={!starConfig.enabled}
              sx={{ color: 'white' }}
            />
          </Box>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" gutterBottom>
              Star Opacity
            </Typography>
            <Slider
              value={starConfig.starOpacity}
              onChange={(_, value) => handleStarConfigChange('starOpacity', value)}
              min={0.1}
              max={1}
              step={0.1}
              valueLabelDisplay="auto"
              disabled={!starConfig.enabled}
              sx={{ color: 'white' }}
            />
          </Box>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" gutterBottom>
              Stars Per Chunk
            </Typography>
            <Slider
              value={starConfig.starsPerChunk}
              onChange={(_, value) => handleStarConfigChange('starsPerChunk', value)}
              min={10}
              max={200}
              step={10}
              valueLabelDisplay="auto"
              disabled={!starConfig.enabled}
              sx={{ color: 'white' }}
            />
          </Box>
        </Box>

        {/* Add Terrain Color control */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Appearance
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="body2">Terrain Color</Typography>
            <Box
              component="input"
              type="color"
              value={terrainConfig.terrainColor}
              onChange={(e) => handleTerrainConfigChange('terrainColor', e.target.value)}
              sx={{
                width: 40,
                height: 40,
                border: 'none',
                borderRadius: '50%',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                '&::-webkit-color-swatch': {
                  borderRadius: '50%',
                  border: 'none',
                },
                '&::-moz-color-swatch': {
                  borderRadius: '50%',
                  border: 'none',
                },
              }}
            />
          </Box>
        </Box>

        {/* Add Camera settings */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Camera
          </Typography>

          {/* Add indicator that camera settings won't be saved */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              p: 1,
              borderRadius: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <Typography variant="caption" color="rgba(255, 255, 255, 0.7)">
              Camera settings will not be saved between sessions
            </Typography>
          </Box>

          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" gutterBottom>
              Camera Height
            </Typography>
            <Slider
              value={terrainConfig.cameraHeight}
              onChange={(_, value) => handleTerrainConfigChange('cameraHeight', value)}
              min={5}
              max={25}
              step={1}
              valueLabelDisplay="auto"
              sx={{ color: 'white' }}
            />
          </Box>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" gutterBottom>
              Camera Distance
            </Typography>
            <Slider
              value={terrainConfig.cameraDistance}
              onChange={(_, value) => handleTerrainConfigChange('cameraDistance', value)}
              min={10}
              max={30}
              step={1}
              valueLabelDisplay="auto"
              sx={{ color: 'white' }}
            />
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default TerrainBackground;
