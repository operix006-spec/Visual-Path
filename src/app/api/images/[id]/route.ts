import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const optimizedPath = path.join(process.cwd(), 'storage', 'optimized', `${id}.webp`);
    
    let filePath = optimizedPath;
    let mimeType = 'image/webp';

    try {
      await fs.access(optimizedPath);
    } catch {
      // Fallback to original path if optimized copy is not ready
      const image = await db.image.findUnique({
        where: { id },
        select: { originalPath: true, mimeType: true }
      });

      if (!image || !image.originalPath) {
        return new NextResponse('Image not found', { status: 404 });
      }

      filePath = image.originalPath;
      mimeType = image.mimeType || 'image/jpeg';
    }

    const fileBuffer = await fs.readFile(/*turbopackIgnore: true*/ filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
