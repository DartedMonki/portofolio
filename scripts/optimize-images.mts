import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ImageSize {
  width: number;
  suffix: string;
}

const SIZES: ImageSize[] = [
  { width: 256, suffix: 'sm' },
  { width: 480, suffix: 'md' },
  { width: 640, suffix: 'lg' },
];

const FORMATS = ['webp', 'avif'] as const;
const QUALITY = {
  webp: 75,
  avif: 65,
};

async function checkImageExists(outputDir: string, filename: string): Promise<boolean> {
  try {
    // Check if all variations exist
    for (const size of SIZES) {
      for (const format of FORMATS) {
        const filePath = path.join(outputDir, `${filename}-${size.suffix}.${format}`);
        await fs.access(filePath);
      }
    }
    return true;
  } catch {
    return false;
  }
}

async function optimizeImage(inputPath: string, outputDir: string) {
  const filename = path.basename(inputPath, path.extname(inputPath));

  // Check if image is already optimized
  const isOptimized = await checkImageExists(outputDir, filename);
  if (isOptimized) {
    // eslint-disable-next-line no-console
    console.log(`Skipping ${filename}: already optimized`);
    return;
  }

  // Create output directory if it doesn't exist
  await fs.mkdir(outputDir, { recursive: true });

  // Process each size
  for (const size of SIZES) {
    const image = sharp(inputPath).resize(size.width, null, {
      withoutEnlargement: true,
      fit: 'inside',
    });

    // Generate each format
    for (const format of FORMATS) {
      const outputPath = path.join(outputDir, `${filename}-${size.suffix}.${format}`);

      await image
        .clone()
        [format]({
          quality: QUALITY[format],
          effort: 6, // Higher effort = better compression but slower
        })
        .toFile(outputPath);

      // eslint-disable-next-line no-console
      console.log(`Generated: ${outputPath}`);
    }
  }
}

async function processDirectory(inputDir: string, outputDir: string) {
  try {
    const files = await fs.readdir(inputDir);

    for (const file of files) {
      if (RegExp(/\.(jpg|jpeg|png)$/i).test(file)) {
        // Changed exec to test
        const inputPath = path.join(inputDir, file);
        await optimizeImage(inputPath, outputDir);
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error processing directory:', error); // Added error logging
    process.exit(1);
  }
}

// Run the script
const inputDir = path.join(path.dirname(__dirname), 'public/images');
const outputDir = path.join(path.dirname(__dirname), 'public/images/optimized');

processDirectory(inputDir, outputDir).then(() => {
  // eslint-disable-next-line no-console
  console.log('Image optimization complete!');
});
