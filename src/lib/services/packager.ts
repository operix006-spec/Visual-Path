import fs from 'fs';
import path from 'path';
import os from 'os';
import { ZipArchive } from 'archiver';
import { db } from '@/lib/db';

const STORAGE_ROOT = path.join(os.tmpdir(), 'visual-path-storage');
const OUTPUTS_DIR = path.join(STORAGE_ROOT, 'outputs');

export class PackagerService {
  static async initialize() {
    await fs.promises.mkdir(OUTPUTS_DIR, { recursive: true });
  }

  static async generateZip(sessionId: string): Promise<string> {
    await this.initialize();

    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: { images: true }
    });

    if (!session) throw new Error("Session not found");

    const zipFilename = `${sessionId}.zip`;
    const zipPath = path.join(OUTPUTS_DIR, zipFilename);
    const output = fs.createWriteStream(zipPath);
    const archive = new ZipArchive({
      zlib: { level: 0 } // No compression needed since images are already compressed, faster creation
    });

    return new Promise((resolve, reject) => {
      output.on('close', async () => {
        // Update session with the output path
        await db.session.update({
          where: { id: sessionId },
          data: { 
            outputFilePath: zipPath,
            status: 'ZIP_READY'
          }
        });
        resolve(zipPath);
      });

      archive.on('error', (err: Error) => {
        reject(err);
      });

      archive.pipe(output);

      // Add images to the archive
      for (const image of session.images) {
        if (!image.originalPath) continue;

        const classification = image.aiClassification || 'Studio_Product';
        // Sanitize classification for folder name
        const folderName = classification.replace(/[^a-z0-9_-]/gi, '_');
        
        // Inside the zip, structure will be: Classification/OriginalFilename (no extra folders)
        const baseFilename = path.basename(image.originalFilename);
        
        // archiver takes unix paths for internal zip structure
        const zipInternalPath = `${folderName}/${baseFilename}`;

        archive.file(image.originalPath, { name: zipInternalPath });
      }

      archive.finalize();
    });
  }
}
