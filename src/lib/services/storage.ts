import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const STORAGE_ROOT = path.join(os.tmpdir(), 'visual-path-storage');
const ORIGINALS_DIR = path.join(STORAGE_ROOT, 'originals');

export class StorageService {
  static async initialize() {
    await fs.mkdir(ORIGINALS_DIR, { recursive: true });
  }

  static async saveOriginal(file: Buffer, imageId: string, ext: string): Promise<string> {
    await this.initialize();
    const filename = `${imageId}${ext}`;
    const filePath = path.join(ORIGINALS_DIR, filename);
    await fs.writeFile(filePath, file);
    return filePath;
  }
}
