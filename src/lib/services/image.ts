import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const STORAGE_ROOT = path.join(os.tmpdir(), 'visual-path-storage');
const OPTIMIZED_DIR = path.join(STORAGE_ROOT, 'optimized');

export class ImageService {
  static async initialize() {
    await fs.mkdir(OPTIMIZED_DIR, { recursive: true });
  }

  static async createOptimizedCopy(originalPath: string, imageId: string): Promise<string> {
    await this.initialize();
    const filename = `${imageId}.webp`;
    const outputPath = path.join(OPTIMIZED_DIR, filename);

    await sharp(originalPath)
      .resize({
        width: 1024,
        height: 1024,
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toFile(outputPath);

    return outputPath;
  }
}
